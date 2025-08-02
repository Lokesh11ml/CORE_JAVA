const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Report = require('../models/Report');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard data based on user role
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin';
    const isSupervisor = userRole === 'supervisor';
    const isTelecaller = userRole === 'telecaller';

    // Get date range for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get date range for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Base query conditions based on user role
    let leadQuery = {};
    let callQuery = {};
    let userQuery = {};

    if (isTelecaller) {
      leadQuery.assignedTo = userId;
      callQuery.telecallerId = userId;
    } else if (isSupervisor) {
      // Get team members
      const supervisor = await User.findById(userId).populate('teamMembers');
      const teamMemberIds = supervisor.teamMembers.map(member => member._id);
      leadQuery.assignedTo = { $in: teamMemberIds };
      callQuery.telecallerId = { $in: teamMemberIds };
      userQuery._id = { $in: teamMemberIds };
    }
    // Admin can see all data, so no additional filters

    // Get basic stats
    const [
      totalLeads,
      newLeadsToday,
      totalCalls,
      todayCalls,
      conversions,
      pendingFollowups,
      overdueFollowups
    ] = await Promise.all([
      Lead.countDocuments(leadQuery),
      Lead.countDocuments({ ...leadQuery, createdAt: { $gte: today } }),
      Call.countDocuments(callQuery),
      Call.countDocuments({ ...callQuery, startTime: { $gte: today } }),
      Lead.countDocuments({ ...leadQuery, status: 'converted' }),
      Lead.countDocuments({ 
        ...leadQuery, 
        nextFollowupDate: { $gte: today, $lt: tomorrow },
        status: { $nin: ['converted', 'closed'] }
      }),
      Lead.countDocuments({ 
        ...leadQuery, 
        nextFollowupDate: { $lt: today },
        status: { $nin: ['converted', 'closed'] }
      })
    ]);

    // Calculate success rate
    const successfulCalls = await Call.countDocuments({
      ...callQuery,
      isSuccessful: true
    });
    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

    // Calculate conversion rate
    const contactedLeads = await Lead.countDocuments({
      ...leadQuery,
      status: { $in: ['contacted', 'qualified', 'interested', 'converted'] }
    });
    const conversionRate = contactedLeads > 0 ? Math.round((conversions / contactedLeads) * 100) : 0;

    // Get recent leads
    const recentLeads = await Lead.find(leadQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name');

    // Get recent calls
    const recentCalls = await Call.find(callQuery)
      .sort({ startTime: -1 })
      .limit(5)
      .populate('leadId', 'name phone')
      .populate('telecallerId', 'name');

    // Get upcoming follow-ups
    const upcomingFollowups = await Lead.find({
      ...leadQuery,
      nextFollowupDate: { $gte: today },
      status: { $nin: ['converted', 'closed'] }
    })
      .sort({ nextFollowupDate: 1 })
      .limit(10)
      .populate('assignedTo', 'name');

    // Get lead pipeline data
    const leadPipeline = await Lead.aggregate([
      { $match: leadQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count'
        }
      }
    ]);

    // Get call trends for last 7 days
    const callTrends = await Call.aggregate([
      { $match: { ...callQuery, startTime: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }
          },
          calls: { $sum: 1 },
          successful: {
            $sum: { $cond: ['$isSuccessful', 1, 0] }
          }
        }
      },
      {
        $project: {
          date: '$_id.date',
          calls: 1,
          successful: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get team performance (for admin/supervisor)
    let teamPerformance = null;
    if (isAdmin || isSupervisor) {
      const teamQuery = isSupervisor ? userQuery : {};
      teamPerformance = await User.aggregate([
        { $match: { ...teamQuery, role: 'telecaller' } },
        {
          $lookup: {
            from: 'calls',
            localField: '_id',
            foreignField: 'telecallerId',
            as: 'calls'
          }
        },
        {
          $lookup: {
            from: 'leads',
            localField: '_id',
            foreignField: 'assignedTo',
            as: 'leads'
          }
        },
        {
          $project: {
            name: 1,
            calls: { $size: '$calls' },
            conversions: {
              $size: {
                $filter: {
                  input: '$leads',
                  cond: { $eq: ['$$this.status', 'converted'] }
                }
              }
            }
          }
        }
      ]);
    }

    // Get notifications
    const notifications = await getNotifications(userId, userRole);

    const dashboardData = {
      stats: {
        totalLeads,
        newLeadsToday,
        totalCalls,
        todayCalls,
        conversions,
        conversionRate,
        successRate,
        pendingFollowups,
        overdueFollowups
      },
      recentLeads: recentLeads.map(lead => ({
        _id: lead._id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        assignedTo: lead.assignedTo?.name
      })),
      recentCalls: recentCalls.map(call => ({
        _id: call._id,
        phoneNumber: call.phoneNumber,
        duration: call.formattedDuration,
        outcome: call.outcome,
        startTime: call.startTime,
        isSuccessful: call.isSuccessful,
        leadName: call.leadId?.name
      })),
      upcomingFollowups: upcomingFollowups.map(lead => ({
        _id: lead._id,
        leadName: lead.name,
        phone: lead.phone,
        nextFollowupDate: lead.nextFollowupDate,
        telecallerName: lead.assignedTo?.name
      })),
      leadPipeline,
      callTrends,
      teamPerformance,
      notifications
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Helper function to get notifications
async function getNotifications(userId, userRole) {
  const notifications = [];

  // Get overdue follow-ups
  const overdueFollowups = await Lead.find({
    assignedTo: userId,
    nextFollowupDate: { $lt: new Date() },
    status: { $nin: ['converted', 'closed'] }
  }).count();

  if (overdueFollowups > 0) {
    notifications.push({
      type: 'warning',
      message: `${overdueFollowups} follow-up(s) overdue`,
      priority: 'high'
    });
  }

  // Get new leads assigned today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newLeadsToday = await Lead.find({
    assignedTo: userId,
    createdAt: { $gte: today }
  }).count();

  if (newLeadsToday > 0) {
    notifications.push({
      type: 'info',
      message: `${newLeadsToday} new lead(s) assigned today`,
      priority: 'medium'
    });
  }

  // For supervisors and admins, get team notifications
  if (userRole === 'supervisor' || userRole === 'admin') {
    const teamMembers = userRole === 'supervisor' 
      ? await User.findById(userId).populate('teamMembers')
      : await User.find({ role: 'telecaller' });

    const memberIds = userRole === 'supervisor' 
      ? teamMembers.teamMembers.map(m => m._id)
      : teamMembers.map(m => m._id);

    // Check for team members with no activity today
    const inactiveMembers = await User.countDocuments({
      _id: { $in: memberIds },
      lastActive: { $lt: today }
    });

    if (inactiveMembers > 0) {
      notifications.push({
        type: 'warning',
        message: `${inactiveMembers} team member(s) inactive today`,
        priority: 'medium'
      });
    }
  }

  return notifications;
}

// @route   GET /api/dashboard/analytics
// @desc    Get detailed analytics data
// @access  Private (Admin/Supervisor)
router.get('/analytics', [verifyToken, requireRole('admin', 'supervisor')], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    // Get detailed analytics
    const analytics = await getDetailedAnalytics(start, end, req.user);

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

// Helper function for detailed analytics
async function getDetailedAnalytics(startDate, endDate, user) {
  const isSupervisor = user.role === 'supervisor';
  let userQuery = {};

  if (isSupervisor) {
    const supervisor = await User.findById(user._id).populate('teamMembers');
    userQuery = { _id: { $in: supervisor.teamMembers.map(m => m._id) } };
  }

  // Get call analytics
  const callAnalytics = await Call.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
        ...(isSupervisor && { telecallerId: { $in: userQuery._id.$in } })
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          outcome: '$outcome'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);

  // Get lead analytics
  const leadAnalytics = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        ...(isSupervisor && { assignedTo: { $in: userQuery._id.$in } })
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status',
          source: '$source'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    callAnalytics,
    leadAnalytics,
    dateRange: { startDate, endDate }
  };
}

module.exports = router;