const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Report = require('../models/Report');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview with KPIs
// @access  Private
router.get('/overview', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Build base query based on user role
    let baseQuery = {};
    if (req.user.role === 'telecaller') {
      baseQuery = { assignedTo: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      baseQuery = { assignedTo: { $in: teamMemberIds } };
    }

    // Get lead statistics
    const leadStats = await Lead.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          interestedLeads: { $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] } },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
          hotLeads: { $sum: { $cond: [{ $eq: ['$quality', 'hot'] }, 1, 0] } },
          warmLeads: { $sum: { $cond: [{ $eq: ['$quality', 'warm'] }, 1, 0] } },
          coldLeads: { $sum: { $cond: [{ $eq: ['$quality', 'cold'] }, 1, 0] } }
        }
      }
    ]);

    // Get call statistics
    let callQuery = {};
    if (req.user.role === 'telecaller') {
      callQuery = { telecaller: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      callQuery = { telecaller: { $in: teamMemberIds } };
    }

    const callStats = await Call.aggregate([
      {
        $match: {
          ...callQuery,
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          completedCalls: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          successfulCalls: { $sum: { $cond: ['$isSuccessful', 1, 0] } },
          totalDuration: { $sum: '$duration' },
          averageDuration: { $avg: '$duration' },
          missedCalls: { $sum: { $cond: [{ $eq: ['$status', 'no-answer'] }, 1, 0] } },
          failedCalls: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    // Get user statistics
    let userQuery = {};
    if (req.user.role === 'supervisor') {
      userQuery = { _id: { $in: req.user.teamMembers } };
    } else if (req.user.role === 'admin') {
      userQuery = { role: 'telecaller' };
    }

    const userStats = await User.aggregate([
      {
        $match: {
          ...userQuery,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$currentStatus', 'available'] }, 1, 0] } },
          busyUsers: { $sum: { $cond: [{ $eq: ['$currentStatus', 'busy'] }, 1, 0] } },
          offlineUsers: { $sum: { $cond: [{ $eq: ['$currentStatus', 'offline'] }, 1, 0] } }
        }
      }
    ]);

    // Get report statistics
    let reportQuery = {};
    if (req.user.role === 'telecaller') {
      reportQuery = { user: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      reportQuery = { user: { $in: teamMemberIds } };
    }

    const reportStats = await Report.aggregate([
      {
        $match: {
          ...reportQuery,
          reportDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          submittedReports: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          approvedReports: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          avgEnergy: { $avg: '$energy' },
          avgMood: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$mood', 'excellent'] }, then: 5 },
                  { case: { $eq: ['$mood', 'good'] }, then: 4 },
                  { case: { $eq: ['$mood', 'average'] }, then: 3 },
                  { case: { $eq: ['$mood', 'poor'] }, then: 2 },
                  { case: { $eq: ['$mood', 'terrible'] }, then: 1 }
                ],
                default: 3
              }
            }
          }
        }
      }
    ]);

    // Calculate KPIs
    const leadData = leadStats[0] || {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      qualifiedLeads: 0,
      interestedLeads: 0,
      convertedLeads: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0
    };

    const callData = callStats[0] || {
      totalCalls: 0,
      completedCalls: 0,
      successfulCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
      missedCalls: 0,
      failedCalls: 0
    };

    const userData = userStats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      busyUsers: 0,
      offlineUsers: 0
    };

    const reportData = reportStats[0] || {
      totalReports: 0,
      submittedReports: 0,
      approvedReports: 0,
      avgEnergy: 0,
      avgMood: 0
    };

    // Calculate rates
    const conversionRate = leadData.totalLeads > 0 ? 
      Math.round((leadData.convertedLeads / leadData.totalLeads) * 100) : 0;
    const successRate = callData.totalCalls > 0 ? 
      Math.round((callData.successfulCalls / callData.totalCalls) * 100) : 0;
    const completionRate = callData.totalCalls > 0 ? 
      Math.round((callData.completedCalls / callData.totalCalls) * 100) : 0;
    const submissionRate = reportData.totalReports > 0 ? 
      Math.round((reportData.submittedReports / reportData.totalReports) * 100) : 0;

    const overview = {
      period: {
        startDate,
        endDate
      },
      leads: {
        ...leadData,
        conversionRate
      },
      calls: {
        ...callData,
        successRate,
        completionRate,
        averageDurationMinutes: Math.round(callData.averageDuration / 60)
      },
      users: userData,
      reports: {
        ...reportData,
        submissionRate
      }
    };

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/charts/leads
// @desc    Get lead data for charts
// @access  Private
router.get('/charts/leads', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy')
], async (req, res) => {
  try {
    const { dateFrom, dateTo, groupBy = 'day' } = req.query;
    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Build base query based on user role
    let baseQuery = {};
    if (req.user.role === 'telecaller') {
      baseQuery = { assignedTo: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      baseQuery = { assignedTo: { $in: teamMemberIds } };
    }

    // Determine date format based on groupBy
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // Get lead trends
    const leadTrends = await Lead.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          totalLeads: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get lead sources
    const leadSources = await Lead.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
        }
      },
      {
        $project: {
          source: '$_id',
          count: 1,
          converted: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$converted', '$count'] }, 100] }
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get lead quality distribution
    const leadQuality = await Lead.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$quality',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      trends: leadTrends,
      sources: leadSources,
      quality: leadQuality
    });

  } catch (error) {
    console.error('Get lead charts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/charts/calls
// @desc    Get call data for charts
// @access  Private
router.get('/charts/calls', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy')
], async (req, res) => {
  try {
    const { dateFrom, dateTo, groupBy = 'day' } = req.query;
    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Build base query based on user role
    let baseQuery = {};
    if (req.user.role === 'telecaller') {
      baseQuery = { telecaller: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      baseQuery = { telecaller: { $in: teamMemberIds } };
    }

    // Determine date format based on groupBy
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // Get call trends
    const callTrends = await Call.aggregate([
      {
        $match: {
          ...baseQuery,
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$startTime' } },
            status: '$status'
          },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          totalCalls: { $sum: '$count' },
          totalDuration: { $sum: '$totalDuration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get call outcomes
    const callOutcomes = await Call.aggregate([
      {
        $match: {
          ...baseQuery,
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$outcome',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $project: {
          outcome: '$_id',
          count: 1,
          totalDuration: 1,
          averageDuration: { $avg: '$totalDuration' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get call quality distribution
    const callQuality = await Call.aggregate([
      {
        $match: {
          ...baseQuery,
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$callQuality',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      trends: callTrends,
      outcomes: callOutcomes,
      quality: callQuality
    });

  } catch (error) {
    console.error('Get call charts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/charts/performance
// @desc    Get performance data for charts
// @access  Private
router.get('/charts/performance', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Build base query based on user role
    let userQuery = {};
    if (req.user.role === 'supervisor') {
      userQuery = { _id: { $in: req.user.teamMembers } };
    } else if (req.user.role === 'admin') {
      userQuery = { role: 'telecaller' };
    } else {
      userQuery = { _id: req.user._id };
    }

    // Get user performance
    const userPerformance = await User.aggregate([
      {
        $match: {
          ...userQuery,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'calls',
          localField: '_id',
          foreignField: 'telecaller',
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
          email: 1,
          totalCalls: { $size: '$calls' },
          completedCalls: {
            $size: {
              $filter: {
                input: '$calls',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          successfulCalls: {
            $size: {
              $filter: {
                input: '$calls',
                cond: { $eq: ['$$this.isSuccessful', true] }
              }
            }
          },
          totalLeads: { $size: '$leads' },
          convertedLeads: {
            $size: {
              $filter: {
                input: '$leads',
                cond: { $eq: ['$$this.status', 'converted'] }
              }
            }
          },
          totalDuration: {
            $sum: '$calls.duration'
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalCalls: 1,
          completedCalls: 1,
          successfulCalls: 1,
          totalLeads: 1,
          convertedLeads: 1,
          totalDuration: 1,
          successRate: {
            $cond: [
              { $eq: ['$totalCalls', 0] },
              0,
              { $multiply: [{ $divide: ['$successfulCalls', '$totalCalls'] }, 100] }
            ]
          },
          conversionRate: {
            $cond: [
              { $eq: ['$totalLeads', 0] },
              0,
              { $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100] }
            ]
          },
          averageDuration: {
            $cond: [
              { $eq: ['$totalCalls', 0] },
              0,
              { $divide: ['$totalDuration', '$totalCalls'] }
            ]
          }
        }
      },
      { $sort: { successRate: -1 } }
    ]);

    // Get daily performance trends
    const dailyPerformance = await Call.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            telecaller: '$telecaller'
          },
          calls: { $sum: 1 },
          successfulCalls: { $sum: { $cond: ['$isSuccessful', 1, 0] } },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalCalls: { $sum: '$calls' },
          totalSuccessful: { $sum: '$successfulCalls' },
          totalDuration: { $sum: '$totalDuration' },
          avgSuccessRate: {
            $avg: {
              $cond: [
                { $eq: ['$calls', 0] },
                0,
                { $multiply: [{ $divide: ['$successfulCalls', '$calls'] }, 100] }
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      userPerformance,
      dailyPerformance
    });

  } catch (error) {
    console.error('Get performance charts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity for dashboard
// @access  Private
router.get('/recent-activity', [
  verifyToken,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Build base query based on user role
    let baseQuery = {};
    if (req.user.role === 'telecaller') {
      baseQuery = { assignedTo: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      baseQuery = { assignedTo: { $in: teamMemberIds } };
    }

    // Get recent leads
    const recentLeads = await Lead.find(baseQuery)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get recent calls
    let callQuery = {};
    if (req.user.role === 'telecaller') {
      callQuery = { telecaller: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      callQuery = { telecaller: { $in: teamMemberIds } };
    }

    const recentCalls = await Call.find(callQuery)
      .populate('telecaller', 'name email')
      .populate('lead', 'name phone')
      .sort({ startTime: -1 })
      .limit(parseInt(limit));

    // Get recent reports
    let reportQuery = {};
    if (req.user.role === 'telecaller') {
      reportQuery = { user: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      reportQuery = { user: { $in: teamMemberIds } };
    }

    const recentReports = await Report.find(reportQuery)
      .populate('user', 'name email')
      .sort({ reportDate: -1 })
      .limit(parseInt(limit));

    // Get active users
    let userQuery = {};
    if (req.user.role === 'supervisor') {
      userQuery = { _id: { $in: req.user.teamMembers } };
    } else if (req.user.role === 'admin') {
      userQuery = { role: 'telecaller' };
    }

    const activeUsers = await User.find({
      ...userQuery,
      isActive: true,
      currentStatus: { $in: ['available', 'busy'] }
    })
    .select('name email currentStatus lastActive')
    .sort({ lastActive: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      recentLeads,
      recentCalls,
      recentReports,
      activeUsers
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/alerts
// @desc    Get system alerts and notifications
// @access  Private
router.get('/alerts', verifyToken, async (req, res) => {
  try {
    const alerts = [];

    // Check for overdue follow-ups
    const overdueFollowups = await Lead.find({
      nextFollowupDate: { $lt: new Date() },
      status: { $nin: ['converted', 'closed'] }
    }).populate('assignedTo', 'name email');

    if (overdueFollowups.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Overdue Follow-ups',
        message: `${overdueFollowups.length} leads have overdue follow-ups`,
        count: overdueFollowups.length,
        data: overdueFollowups
      });
    }

    // Check for unassigned leads
    const unassignedLeads = await Lead.find({
      assignedTo: { $exists: false }
    });

    if (unassignedLeads.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Unassigned Leads',
        message: `${unassignedLeads.length} leads are waiting for assignment`,
        count: unassignedLeads.length,
        data: unassignedLeads
      });
    }

    // Check for inactive users
    const inactiveUsers = await User.find({
      role: 'telecaller',
      isActive: true,
      lastActive: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours
    });

    if (inactiveUsers.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Inactive Users',
        message: `${inactiveUsers.length} telecallers have been inactive for 24+ hours`,
        count: inactiveUsers.length,
        data: inactiveUsers
      });
    }

    // Check for pending reports
    let reportQuery = {};
    if (req.user.role === 'telecaller') {
      reportQuery = { user: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      reportQuery = { user: { $in: teamMemberIds } };
    }

    const pendingReports = await Report.find({
      ...reportQuery,
      status: 'draft',
      reportDate: { $lt: new Date() }
    }).populate('user', 'name email');

    if (pendingReports.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Pending Reports',
        message: `${pendingReports.length} reports are pending submission`,
        count: pendingReports.length,
        data: pendingReports
      });
    }

    res.json({
      success: true,
      alerts
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;