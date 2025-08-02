const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const twilioService = require('../services/twilioService');

const router = express.Router();

// @route   GET /api/calls
// @desc    Get all calls with filtering and pagination
// @access  Private
router.get('/', [
  verifyToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['initiated', 'ringing', 'answered', 'completed', 'busy', 'failed', 'no-answer', 'cancelled']).withMessage('Invalid status'),
  query('callType').optional().isIn(['outbound', 'inbound']).withMessage('Invalid call type'),
  query('telecaller').optional().isMongoId().withMessage('Invalid telecaller ID'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      status,
      callType,
      telecaller,
      dateFrom,
      dateTo
    } = req.query;

    // Build query
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.telecaller = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisor can see their team's calls
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.telecaller = { $in: teamMemberIds };
    }

    // Apply filters
    if (status) query.status = status;
    if (callType) query.callType = callType;
    if (telecaller) query.telecaller = telecaller;

    // Date range filter
    if (dateFrom || dateTo) {
      query.startTime = {};
      if (dateFrom) query.startTime.$gte = new Date(dateFrom);
      if (dateTo) query.startTime.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get calls with population
    const calls = await Call.find(query)
      .populate('telecaller', 'name email role')
      .populate('lead', 'name phone email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Call.countDocuments(query);

    // Calculate pagination info
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/calls/initiate
// @desc    Initiate a call to a lead
// @access  Private
router.post('/initiate', [
  verifyToken,
  body('leadId').isMongoId().withMessage('Invalid lead ID'),
  body('callType').optional().isIn(['outbound', 'inbound']).withMessage('Invalid call type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leadId, callType = 'outbound' } = req.body;

    // Check if lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if user can call this lead
    if (req.user.role === 'telecaller' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this lead' });
    }

    // Check if user is available
    if (req.user.currentStatus === 'offline' || req.user.currentStatus === 'busy') {
      return res.status(400).json({ message: 'You must be available to make calls' });
    }

    // Initiate call via Twilio
    const callResult = await twilioService.initiateCall(req.user._id, leadId, callType);

    res.json({
      success: true,
      message: 'Call initiated successfully',
      call: callResult.call,
      twilioCall: callResult.twilioCall
    });

  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/:id
// @desc    Get specific call details
// @access  Private
router.get('/:id', [
  verifyToken,
  body('id').isMongoId().withMessage('Invalid call ID')
], async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('telecaller', 'name email role')
      .populate('lead', 'name phone email status');

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && call.telecaller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      call
    });

  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calls/:id
// @desc    Update call details
// @access  Private
router.put('/:id', [
  verifyToken,
  body('status').optional().isIn(['initiated', 'ringing', 'answered', 'completed', 'busy', 'failed', 'no-answer', 'cancelled']).withMessage('Invalid status'),
  body('outcome').optional().isIn(['connected', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'disconnected']).withMessage('Invalid outcome'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('summary').optional().isString().withMessage('Summary must be a string'),
  body('callQuality').optional().isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Invalid call quality'),
  body('customerSatisfaction').optional().isInt({ min: 1, max: 5 }).withMessage('Customer satisfaction must be between 1 and 5')
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
    if (req.user.role === 'telecaller' && call.telecaller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update call
    const updatedCall = await Call.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('telecaller', 'name email role')
     .populate('lead', 'name phone email');

    res.json({
      success: true,
      message: 'Call updated successfully',
      call: updatedCall
    });

  } catch (error) {
    console.error('Update call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/calls/status-callback
// @desc    Twilio webhook for call status updates
// @access  Public
router.post('/status-callback', async (req, res) => {
  try {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      RecordingUrl,
      RecordingDuration
    } = req.body;

    // Verify webhook signature
    const signature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    if (!twilioService.verifyWebhookSignature(signature, url, req.body)) {
      return res.status(403).json({ message: 'Invalid webhook signature' });
    }

    // Handle call status update
    await twilioService.handleCallStatus(CallSid, CallStatus, CallDuration, RecordingUrl);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Call status callback error:', error);
    res.status(500).send('Error');
  }
});

// @route   POST /api/calls/recording-status
// @desc    Twilio webhook for recording status updates
// @access  Public
router.post('/recording-status', async (req, res) => {
  try {
    const {
      CallSid,
      RecordingUrl,
      RecordingDuration
    } = req.body;

    // Verify webhook signature
    const signature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    if (!twilioService.verifyWebhookSignature(signature, url, req.body)) {
      return res.status(403).json({ message: 'Invalid webhook signature' });
    }

    // Handle recording status update
    await twilioService.handleRecordingStatus(CallSid, RecordingUrl, RecordingDuration);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Recording status callback error:', error);
    res.status(500).send('Error');
  }
});

// @route   GET /api/calls/twiml/:callId
// @desc    Generate TwiML for call
// @access  Public
router.get('/twiml/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const twiml = twilioService.generateTwiML(callId);

    res.set('Content-Type', 'text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('Generate TwiML error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/user/:userId
// @desc    Get calls for specific user
// @access  Private
router.get('/user/:userId', [
  verifyToken,
  query('status').optional().isIn(['initiated', 'ringing', 'answered', 'completed', 'busy', 'failed', 'no-answer', 'cancelled']).withMessage('Invalid status'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const { userId } = req.params;

    // Check access permissions
    if (req.user.role === 'telecaller' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { telecaller: userId };
    if (status) query.status = status;

    // Date range filter
    if (dateFrom || dateTo) {
      query.startTime = {};
      if (dateFrom) query.startTime.$gte = new Date(dateFrom);
      if (dateTo) query.startTime.$lte = new Date(dateTo);
    }

    const calls = await Call.find(query)
      .populate('telecaller', 'name email role')
      .populate('lead', 'name phone email')
      .sort({ startTime: -1 });

    res.json({
      success: true,
      calls
    });

  } catch (error) {
    console.error('Get user calls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/stats/overview
// @desc    Get call statistics overview
// @access  Private
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.telecaller = req.user._id;
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.telecaller = { $in: teamMemberIds };
    }

    const stats = await Call.aggregate([
      { $match: query },
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

    const overview = stats[0] || {
      totalCalls: 0,
      completedCalls: 0,
      successfulCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
      missedCalls: 0,
      failedCalls: 0
    };

    // Calculate rates
    overview.successRate = overview.totalCalls > 0 ? 
      Math.round((overview.successfulCalls / overview.totalCalls) * 100) : 0;
    overview.completionRate = overview.totalCalls > 0 ? 
      Math.round((overview.completedCalls / overview.totalCalls) * 100) : 0;

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/stats/daily
// @desc    Get daily call statistics
// @access  Private
router.get('/stats/daily', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.telecaller = req.user._id;
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.telecaller = { $in: teamMemberIds };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.startTime = {};
      if (dateFrom) query.startTime.$gte = new Date(dateFrom);
      if (dateTo) query.startTime.$lte = new Date(dateTo);
    }

    const dailyStats = await Call.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            status: '$status'
          },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          calls: { $sum: '$count' },
          completedCalls: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'completed'] }, '$count', 0]
            }
          },
          totalDuration: { $sum: '$totalDuration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      dailyStats
    });

  } catch (error) {
    console.error('Get daily call stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/analytics/:userId
// @desc    Get call analytics for specific user
// @access  Private
router.get('/analytics/:userId', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { userId } = req.params;

    // Check access permissions
    if (req.user.role === 'telecaller' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const analytics = await twilioService.getCallAnalytics(userId, startDate, endDate);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get call analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;