const prisma = require('../config/database');
const { validateActionItem } = require('../validators/actionValidator');

const createActionItem = async (req, res, next) => {
  try {
    const { meetingId, task, owner, dueDate, priority, status } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required.'
      });
    }

    // Check meeting ownership
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId: req.user.id }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Associated meeting not found or access denied.'
      });
    }

    const { isValid, errors } = validateActionItem(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        meetingId,
        userId: req.user.id,
        task: task.trim(),
        owner: owner && owner.trim() ? owner.trim() : 'Unassigned',
        dueDate: dueDate && !isNaN(Date.parse(dueDate)) ? new Date(dueDate) : null,
        priority: priority || 'Medium',
        status: status || 'Open'
      },
      include: {
        meeting: {
          select: { id: true, title: true, meetingType: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Action item created successfully.',
      data: { actionItem }
    });
  } catch (error) {
    next(error);
  }
};

const getActionItems = async (req, res, next) => {
  try {
    const { search, status, priority, owner, overdue, meetingId } = req.query;

    const whereClause = {
      userId: req.user.id
    };

    if (meetingId) {
      whereClause.meetingId = meetingId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { task: { contains: q } },
        { owner: { contains: q } },
        { meeting: { title: { contains: q } } }
      ];
    }

    if (status && status !== 'All') {
      whereClause.status = status;
    }

    if (priority && priority !== 'All') {
      whereClause.priority = priority;
    }

    if (owner && owner !== 'All') {
      whereClause.owner = { contains: owner };
    }

    if (overdue === 'true') {
      const today = new Date();
      whereClause.dueDate = { lt: today };
      whereClause.status = { not: 'Completed' };
    }

    const actionItems = await prisma.actionItem.findMany({
      where: whereClause,
      include: {
        meeting: {
          select: { id: true, title: true, meetingType: true, meetingDate: true }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const now = new Date();
    const itemsWithOverdueFlag = actionItems.map(item => ({
      ...item,
      isOverdue: item.dueDate ? new Date(item.dueDate) < now && item.status !== 'Completed' : false
    }));

    return res.status(200).json({
      success: true,
      data: { actionItems: itemsWithOverdueFlag }
    });
  } catch (error) {
    next(error);
  }
};

const getActionItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const actionItem = await prisma.actionItem.findFirst({
      where: { id, userId: req.user.id },
      include: {
        meeting: {
          select: { id: true, title: true }
        }
      }
    });

    if (!actionItem) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { actionItem }
    });
  } catch (error) {
    next(error);
  }
};

const updateActionItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.actionItem.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found or access denied.'
      });
    }

    const { task, owner, dueDate, priority, status } = req.body;

    const { isValid, errors } = validateActionItem(req.body, true);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    let parsedDueDate = existing.dueDate;
    if (dueDate !== undefined) {
      parsedDueDate = dueDate && !isNaN(Date.parse(dueDate)) ? new Date(dueDate) : null;
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        ...(task && { task: task.trim() }),
        ...(owner !== undefined && { owner: owner.trim() || 'Unassigned' }),
        dueDate: parsedDueDate,
        ...(priority && { priority }),
        ...(status && { status })
      },
      include: {
        meeting: {
          select: { id: true, title: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Action item updated successfully.',
      data: { actionItem: updated }
    });
  } catch (error) {
    next(error);
  }
};

const deleteActionItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.actionItem.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found or access denied.'
      });
    }

    await prisma.actionItem.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Action item deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createActionItem,
  getActionItems,
  getActionItemById,
  updateActionItem,
  deleteActionItem
};
