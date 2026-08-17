const prisma = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const [
      totalMeetings,
      totalActionItems,
      openActionItems,
      inProgressActionItems,
      blockedActionItems,
      completedActionItems,
      overdueActionItems,
      dueSoonActionItems,
      recentMeetings,
      recentActions
    ] = await Promise.all([
      prisma.meeting.count({ where: { userId } }),
      prisma.actionItem.count({ where: { userId } }),
      prisma.actionItem.count({ where: { userId, status: 'Open' } }),
      prisma.actionItem.count({ where: { userId, status: 'In Progress' } }),
      prisma.actionItem.count({ where: { userId, status: 'Blocked' } }),
      prisma.actionItem.count({ where: { userId, status: 'Completed' } }),
      prisma.actionItem.count({
        where: {
          userId,
          dueDate: { lt: today },
          status: { not: 'Completed' }
        }
      }),
      prisma.actionItem.count({
        where: {
          userId,
          dueDate: { gte: today, lte: threeDaysFromNow },
          status: { not: 'Completed' }
        }
      }),
      prisma.meeting.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { actionItems: true }
          }
        }
      }),
      prisma.actionItem.findMany({
        where: { userId, status: { not: 'Completed' } },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          meeting: {
            select: { id: true, title: true }
          }
        }
      })
    ]);

    const activePending = totalActionItems - completedActionItems;
    const onTrackCount = Math.max(0, activePending - overdueActionItems);
    const healthPercentage = totalActionItems > 0
      ? Math.round(((completedActionItems + onTrackCount) / totalActionItems) * 100)
      : 100;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalMeetings,
          totalActionItems,
          openActionItems,
          inProgressActionItems,
          blockedActionItems,
          completedActionItems,
          overdueActionItems,
          dueSoonActionItems,
          onTrackCount,
          healthPercentage
        },
        recentMeetings,
        recentActions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
