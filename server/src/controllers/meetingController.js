const prisma = require('../config/database');
const { validateMeeting } = require('../validators/meetingValidator');
const { processTranscriptWithAI } = require('../services/aiService');
const { extractPdfTextWithReadingOrder } = require('../utils/pdfExtractor');

/**
 * Helper to safely parse JSON or array values without throwing unhandled exceptions.
 */
const safeJsonParse = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : fallback);
  } catch (e) {
    return typeof value === 'string' && value.trim() ? [value.trim()] : fallback;
  }
};

const createMeeting = async (req, res, next) => {
  try {
    let transcriptText = req.body.transcript || '';

    // If file uploaded, read contents (.txt or .pdf)
    if (req.file) {
      const fileName = req.file.originalname.toLowerCase();
      if (fileName.endsWith('.txt')) {
        transcriptText = req.file.buffer.toString('utf8');
      } else if (fileName.endsWith('.pdf')) {
        try {
          console.log(`[PDF EXTRACTION]: Processing uploaded PDF document "${req.file.originalname}" (${req.file.size} bytes)...`);
          transcriptText = await extractPdfTextWithReadingOrder(req.file.buffer);
          console.log(`[PDF EXTRACTION SUCCESS]: Extracted ${transcriptText.length} characters with reading-order preservation.`);
          if (!transcriptText || !transcriptText.trim()) {
            return res.status(400).json({
              success: false,
              message: 'Unable to extract text from this PDF. Please verify that the file contains readable text or try pasting manually.'
            });
          }
        } catch (pdfErr) {
          console.error('PDF Reading-Order Parsing Error:', pdfErr);
          return res.status(400).json({
            success: false,
            message: pdfErr.message || 'Failed to extract text from uploaded PDF file. Please ensure it is a valid text-based PDF document.'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Only .txt and .pdf files are supported for transcript uploads.'
        });
      }
    }

    const payload = { ...req.body, transcript: transcriptText };
    const { isValid, errors } = validateMeeting(payload, req.file);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const meeting = await prisma.meeting.create({
      data: {
        userId: req.user.id,
        title: req.body.title.trim(),
        meetingDate: new Date(req.body.meetingDate),
        meetingType: req.body.meetingType || 'Internal Meeting',
        participants: req.body.participants ? req.body.participants.trim() : '',
        transcript: transcriptText.trim()
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Meeting created successfully.',
      data: { meeting }
    });
  } catch (error) {
    next(error);
  }
};

const getMeetings = async (req, res, next) => {
  try {
    const { search, type } = req.query;

    const whereClause = {
      userId: req.user.id
    };

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { participants: { contains: q } },
        { transcript: { contains: q } }
      ];
    }

    if (type && type.trim() && type !== 'All') {
      whereClause.meetingType = type.trim();
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { actionItems: true }
        }
      },
      orderBy: { meetingDate: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: { meetings }
    });
  } catch (error) {
    next(error);
  }
};

const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        actionItems: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied.'
      });
    }

    // Safely parse JSON strings for frontend consumption
    const formattedMeeting = {
      ...meeting,
      discussionPoints: safeJsonParse(meeting.discussionPoints),
      decisions: safeJsonParse(meeting.decisions),
      risks: safeJsonParse(meeting.risks),
      unansweredQuestions: safeJsonParse(meeting.unansweredQuestions)
    };

    return res.status(200).json({
      success: true,
      data: { meeting: formattedMeeting }
    });
  } catch (error) {
    next(error);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.meeting.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied.'
      });
    }

    const { title, meetingDate, meetingType, participants, transcript, summary, discussionPoints, decisions, risks, unansweredQuestions } = req.body;

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(meetingDate && { meetingDate: new Date(meetingDate) }),
        ...(meetingType && { meetingType }),
        ...(participants !== undefined && { participants: participants.trim() }),
        ...(transcript !== undefined && { transcript: transcript.trim() }),
        ...(summary !== undefined && { summary }),
        ...(discussionPoints !== undefined && { discussionPoints: JSON.stringify(discussionPoints) }),
        ...(decisions !== undefined && { decisions: JSON.stringify(decisions) }),
        ...(risks !== undefined && { risks: JSON.stringify(risks) }),
        ...(unansweredQuestions !== undefined && { unansweredQuestions: JSON.stringify(unansweredQuestions) })
      }
    });

    const formattedUpdated = {
      ...updated,
      discussionPoints: safeJsonParse(updated.discussionPoints),
      decisions: safeJsonParse(updated.decisions),
      risks: safeJsonParse(updated.risks),
      unansweredQuestions: safeJsonParse(updated.unansweredQuestions)
    };

    return res.status(200).json({
      success: true,
      message: 'Meeting updated successfully.',
      data: { meeting: formattedUpdated }
    });
  } catch (error) {
    next(error);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.meeting.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied.'
      });
    }

    await prisma.meeting.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Meeting and associated action items deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const processMeetingAI = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied.'
      });
    }

    if (!meeting.transcript || !meeting.transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot process empty transcript.'
      });
    }

    // Call AI processing service (with auto validation & fallback)
    const aiResult = await processTranscriptWithAI(meeting.transcript);

    // Save structured details in meeting record
    await prisma.meeting.update({
      where: { id },
      data: {
        summary: aiResult.summary,
        discussionPoints: JSON.stringify(aiResult.discussionPoints),
        decisions: JSON.stringify(aiResult.decisions),
        risks: JSON.stringify(aiResult.risks),
        unansweredQuestions: JSON.stringify(aiResult.unansweredQuestions)
      }
    });

    // Fetch existing action items to preserve manual user updates and completed tasks
    const existingActionItems = await prisma.actionItem.findMany({
      where: { meetingId: id }
    });

    const userModifiedMap = new Map();
    existingActionItems.forEach(item => {
      // Keep items that were edited or updated by user (non-Open status or custom assigned owner)
      if (item.status !== 'Open' || (item.owner && item.owner !== 'Unassigned')) {
        userModifiedMap.set(item.task.toLowerCase().trim(), item);
      }
    });

    // Delete obsolete unmodified open action items
    await prisma.actionItem.deleteMany({
      where: {
        meetingId: id,
        status: 'Open',
        owner: 'Unassigned'
      }
    });

    // Insert newly extracted action items if not already present with user edits
    if (aiResult.actionItems && aiResult.actionItems.length > 0) {
      const newActionsData = aiResult.actionItems
        .filter(item => !userModifiedMap.has(item.task.toLowerCase().trim()))
        .map(item => {
          let parsedDate = null;
          if (item.dueDate && !isNaN(Date.parse(item.dueDate))) {
            parsedDate = new Date(item.dueDate);
          }

          return {
            meetingId: id,
            userId: req.user.id,
            task: item.task,
            owner: item.owner || 'Unassigned',
            dueDate: parsedDate,
            priority: item.priority || 'Medium',
            status: item.status || 'Open',
            evidence: item.evidence || item.task
          };
        });

      if (newActionsData.length > 0) {
        await prisma.actionItem.createMany({
          data: newActionsData
        });
      }
    }

    const refreshedMeeting = await prisma.meeting.findFirst({
      where: { id },
      include: {
        actionItems: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'AI analysis completed successfully.',
      data: {
        meeting: {
          ...refreshedMeeting,
          discussionPoints: aiResult.discussionPoints || [],
          decisions: aiResult.decisions || [],
          risks: aiResult.risks || [],
          unansweredQuestions: aiResult.unansweredQuestions || []
        }
      }
    });
  } catch (error) {
    console.error('[PROCESS MEETING AI ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze transcript with AI.'
    });
  }
};

const debugPdfExtraction = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'PDF Debugger is disabled in production environments.' });
    }

    if (!req.file || !req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ success: false, message: 'Please upload a valid PDF file under the "file" field.' });
    }

    const transcriptText = await extractPdfTextWithReadingOrder(req.file.buffer);
    const lines = transcriptText.split('\n').filter(Boolean);

    return res.status(200).json({
      success: true,
      message: 'PDF reading-order extraction inspect completed.',
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        characterCount: transcriptText.length,
        lineCount: lines.length,
        linesPreview: lines.slice(0, 30),
        fullTranscript: transcriptText
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  processMeetingAI,
  debugPdfExtraction
};
