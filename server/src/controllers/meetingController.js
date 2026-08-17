const prisma = require('../config/database');
const { validateMeeting } = require('../validators/meetingValidator');
const { processTranscriptWithAI } = require('../services/aiService');
const pdfModule = require('pdf-parse');

const extractPdfText = async (buffer) => {
  if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    return pdfData.text || '';
  } else if (typeof pdfModule === 'function') {
    const pdfData = await pdfModule(buffer);
    return pdfData.text || '';
  } else if (pdfModule.default && typeof pdfModule.default === 'function') {
    const pdfData = await pdfModule.default(buffer);
    return pdfData.text || '';
  }
  throw new Error('Unsupported pdf-parse module structure.');
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
          transcriptText = await extractPdfText(req.file.buffer);
          if (!transcriptText || !transcriptText.trim()) {
            return res.status(400).json({
              success: false,
              message: 'No readable text could be extracted from this PDF document. If it is a scanned image, please paste text manually.'
            });
          }
        } catch (pdfErr) {
          console.error('PDF Parsing Error:', pdfErr);
          return res.status(400).json({
            success: false,
            message: 'Failed to extract text from uploaded PDF file. Please ensure it is a valid PDF document.'
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
      discussionPoints: JSON.parse(meeting.discussionPoints || '[]'),
      decisions: JSON.parse(meeting.decisions || '[]'),
      risks: JSON.parse(meeting.risks || '[]'),
      unansweredQuestions: JSON.parse(meeting.unansweredQuestions || '[]')
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
      discussionPoints: JSON.parse(updated.discussionPoints || '[]'),
      decisions: JSON.parse(updated.decisions || '[]'),
      risks: JSON.parse(updated.risks || '[]'),
      unansweredQuestions: JSON.parse(updated.unansweredQuestions || '[]')
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
    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        summary: aiResult.summary,
        discussionPoints: JSON.stringify(aiResult.discussionPoints),
        decisions: JSON.stringify(aiResult.decisions),
        risks: JSON.stringify(aiResult.risks),
        unansweredQuestions: JSON.stringify(aiResult.unansweredQuestions)
      }
    });

    // Delete previous action items for this meeting to ensure reprocessing consistency
    await prisma.actionItem.deleteMany({
      where: { meetingId: id }
    });

    // Insert newly extracted action items
    if (aiResult.actionItems && aiResult.actionItems.length > 0) {
      const newActionsData = aiResult.actionItems.map(item => {
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
          status: item.status || 'Open'
        };
      });

      await prisma.actionItem.createMany({
        data: newActionsData
      });
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
          discussionPoints: aiResult.discussionPoints,
          decisions: aiResult.decisions,
          risks: aiResult.risks,
          unansweredQuestions: aiResult.unansweredQuestions
        }
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
  processMeetingAI
};
