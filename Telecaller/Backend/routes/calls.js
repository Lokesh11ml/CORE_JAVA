const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { verifyToken, requireSupervisor } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/calls
// @desc    Get calls with filtering and pagination
// @access  Private
router.get('/', [
  verifyToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'failed']),
  query('outcome').optional().isIn(['connected', 'no_answer', 'busy', 'invalid_number', 'voicemail', 'callback_requested', 'not_interested', 'interested', 'converted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      status,
      outcome,
      telecallerId,
      leadId,
      startDate,
      endDate,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      filter.telecallerId = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisor can see their team's calls
      const teamMemberIds = [...req.user.teamMembers, req.user._id];
      filter.telecallerId = { $in: teamMemberIds };
    }
    // Admin can see all calls (no additional filter)

    // Apply query filters
    if (status) filter.status = status;
    if (outcome) filter.outcome = outcome;
    if (telecallerId && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
      filter.telecallerId = telecallerId;
    }
    if (leadId) filter.leadId = leadId;

    // Date range filter
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const calls = await Call.find(filter)
      .populate('telecallerId', 'name email role')
      .populate('leadId', 'name email phone status priority')
      .populate('reviewedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Call.countDocuments(filter);

    // Calculate statistics
    const stats = await Call.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          completedCalls: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          successfulCalls: { $sum: { $cond: ['$isSuccessful', 1, 0] } },
          totalDuration: { $sum: '$duration' },
          averageDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalCalls: 0,
        completedCalls: 0,
        successfulCalls: 0,
        totalDuration: 0,
        averageDuration: 0
      }
    });

  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ message: 'Server error fetching calls' });
  }
});

// @route   GET /api/calls/:id
// @desc    Get single call by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('telecallerId', 'name email role phone')
      .populate('leadId', 'name email phone status priority assignedTo')
      .populate('reviewedBy', 'name email');

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(call.telecallerId._id)) ||
                     (req.user.role === 'telecaller' && call.telecallerId._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied to this call' });
    }

    res.json({ call });

  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({ message: 'Server error fetching call' });
  }
});

// @route   POST /api/calls
// @desc    Create new call log
// @access  Private
router.post('/', [
  verifyToken,
  body('leadId').isMongoId().withMessage('Valid lead ID is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('callPurpose').isIn(['initial_contact', 'follow_up', 'closure', 'support', 'survey', 'other']).withMessage('Invalid call purpose'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time required'),
  body('status').isIn(['scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'failed']).withMessage('Invalid status'),
  body('outcome').optional().isIn(['connected', 'no_answer', 'busy', 'invalid_number', 'voicemail', 'callback_requested', 'not_interested', 'interested', 'converted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const callData = {
      ...req.body,
      telecallerId: req.user._id
    };

    // Verify lead exists and user has access
    const lead = await Lead.findById(callData.leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if user can make calls for this lead
    const canCall = req.user.role === 'admin' ||
                   (req.user.role === 'supervisor' && req.user.teamMembers.includes(lead.assignedTo)) ||
                   (req.user.role === 'telecaller' && lead.assignedTo.toString() === req.user._id.toString());

    if (!canCall) {
      return res.status(403).json({ message: 'Access denied to call this lead' });
    }

    // Store lead status before call
    callData.leadStatusBefore = lead.status;

    // Create call
    const call = new Call(callData);
    await call.save();

    // Update lead's last contact date if call is completed
    if (call.status === 'completed') {
      lead.lastContactDate = call.endTime || call.startTime;
      lead.followupCount += 1;

      // Update lead status if provided in call data
      if (req.body.leadStatusAfter) {
        lead.status = req.body.leadStatusAfter;
        call.leadStatusAfter = req.body.leadStatusAfter;
      }

      await lead.save();
      await call.save();

      // Update user statistics
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 
          totalCalls: 1,
          successfulCalls: call.isSuccessful ? 1 : 0
        }
      });
    }

    const populatedCall = await Call.findById(call._id)
      .populate('telecallerId', 'name email')
      .populate('leadId', 'name email phone status');

    res.status(201).json({
      message: 'Call logged successfully',
      call: populatedCall
    });

  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({ message: 'Server error creating call' });
  }
});

// @route   PUT /api/calls/:id
// @desc    Update call
// @access  Private
router.put('/:id', [
  verifyToken,
  body('endTime').optional().isISO8601().withMessage('Valid end time required'),
  body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'failed']),
  body('outcome').optional().isIn(['connected', 'no_answer', 'busy', 'invalid_number', 'voicemail', 'callback_requested', 'not_interested', 'interested', 'converted']),
  body('callQuality').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  body('customerSatisfaction').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check access permissions
    const canUpdate = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(call.telecallerId)) ||
                     (req.user.role === 'telecaller' && call.telecallerId.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied to update this call' });
    }

    // Update call
    const oldStatus = call.status;
    Object.assign(call, req.body);

    // If call is being marked as completed for the first time
    if (call.status === 'completed' && oldStatus !== 'completed') {
      // Update lead's last contact date
      const lead = await Lead.findById(call.leadId);
      if (lead) {
        lead.lastContactDate = call.endTime || call.startTime || new Date();
        
        // Update lead status if provided
        if (req.body.leadStatusAfter) {
          lead.status = req.body.leadStatusAfter;
          call.leadStatusAfter = req.body.leadStatusAfter;
        }
        
        await lead.save();

        // Update user statistics
        await User.findByIdAndUpdate(call.telecallerId, {
          $inc: { 
            totalCalls: 1,
            successfulCalls: call.isSuccessful ? 1 : 0
          }
        });
      }
    }

    await call.save();

    const updatedCall = await Call.findById(call._id)
      .populate('telecallerId', 'name email')
      .populate('leadId', 'name email phone status');

    // Notify via socket if needed
    if (req.io && call.status === 'completed') {
      req.io.emit('call-completed', {
        call: updatedCall,
        telecaller: call.telecallerId,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Call updated successfully',
      call: updatedCall
    });

  } catch (error) {
    console.error('Update call error:', error);
    res.status(500).json({ message: 'Server error updating call' });
  }
});

// @route   PUT /api/calls/:id/review
// @desc    Review call (Supervisor/Admin)
// @access  Private (Supervisor/Admin)
router.put('/:id/review', [
  verifyToken,
  requireSupervisor,
  body('reviewRating').isInt({ min: 1, max: 5 }).withMessage('Review rating must be between 1 and 5'),
  body('reviewNotes').optional().isLength({ max: 500 }).withMessage('Review notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewRating, reviewNotes } = req.body;

    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Update call with review
    call.reviewedBy = req.user._id;
    call.reviewDate = new Date();
    call.reviewRating = reviewRating;
    call.reviewNotes = reviewNotes;

    await call.save();

    const updatedCall = await Call.findById(call._id)
      .populate('telecallerId', 'name email')
      .populate('leadId', 'name email phone')
      .populate('reviewedBy', 'name email');

    res.json({
      message: 'Call reviewed successfully',
      call: updatedCall
    });

  } catch (error) {
    console.error('Review call error:', error);
    res.status(500).json({ message: 'Server error reviewing call' });
  }
});

// @route   GET /api/calls/my/dashboard
// @desc    Get user's call dashboard
// @access  Private
router.get('/my/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's call stats
    const todayStats = await Call.getCallStats(userId, today, tomorrow);

    // Get this week's stats
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStats = await Call.getCallStats(userId, weekStart, tomorrow);

    // Get upcoming scheduled calls
    const upcomingCalls = await Call.find({
      telecallerId: userId,
      status: 'scheduled',
      startTime: { $gte: new Date() }
    })
    .populate('leadId', 'name email phone priority')
    .sort({ startTime: 1 })
    .limit(10);

    // Get recent completed calls
    const recentCalls = await Call.find({
      telecallerId: userId,
      status: 'completed'
    })
    .populate('leadId', 'name email phone')
    .sort({ endTime: -1 })
    .limit(5);

    // Get overdue follow-ups
    const overdueFollowups = await Call.find({
      telecallerId: userId,
      nextFollowupDate: { $lt: new Date() },
      status: 'completed'
    })
    .populate('leadId', 'name email phone')
    .limit(10);

    res.json({
      todayStats,
      weekStats,
      upcomingCalls,
      recentCalls,
      overdueFollowups,
      summary: {
        upcomingCount: upcomingCalls.length,
        recentCount: recentCalls.length,
        overdueCount: overdueFollowups.length
      }
    });

  } catch (error) {
    console.error('Call dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching call dashboard' });
  }
});

// @route   GET /api/calls/stats/:userId
// @desc    Get call statistics for a specific user
// @access  Private (Supervisor/Admin)
router.get('/stats/:userId', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify user exists and access permissions
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Call.getCallStats(userId, start, end);

    // Get detailed breakdown by outcome
    const outcomeBreakdown = await Call.aggregate([
      {
        $match: {
          telecallerId: targetUser._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$outcome',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get daily call counts
    const dailyStats = await Call.aggregate([
      {
        $match: {
          telecallerId: targetUser._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          calls: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          successful: { $sum: { $cond: ['$isSuccessful', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      user: { name: targetUser.name, email: targetUser.email },
      period: { start, end },
      overallStats: stats,
      outcomeBreakdown,
      dailyStats
    });

  } catch (error) {
    console.error('Call stats error:', error);
    res.status(500).json({ message: 'Server error fetching call statistics' });
  }
});

// @route   DELETE /api/calls/:id
// @desc    Delete call (Admin only)
// @access  Private (Admin)
router.delete('/:id', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    await Call.findByIdAndDelete(req.params.id);

    res.json({ message: 'Call deleted successfully' });

  } catch (error) {
    console.error('Delete call error:', error);
    res.status(500).json({ message: 'Server error deleting call' });
  }
});

module.exports = router;