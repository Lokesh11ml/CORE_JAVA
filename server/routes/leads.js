const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { verifyToken, requireRole, canAccessResource } = require('../middleware/auth');
const leadAssignmentService = require('../services/leadAssignmentService');

const router = express.Router();

// @route   GET /api/leads
// @desc    Get all leads with filtering and pagination
// @access  Private
router.get('/', [
  verifyToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted', 'closed']).withMessage('Invalid status'),
  query('source').optional().isIn(['facebook', 'instagram', 'manual', 'website', 'referral', 'other']).withMessage('Invalid source'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('quality').optional().isIn(['hot', 'warm', 'cold']).withMessage('Invalid quality'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('search').optional().isString().withMessage('Search must be a string')
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
      source,
      priority,
      quality,
      assignedTo,
      dateFrom,
      dateTo,
      search
    } = req.query;

    // Build query
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisor can see their team's leads
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.assignedTo = { $in: teamMemberIds };
    }
    // Admin can see all leads

    // Apply filters
    if (status) query.status = status;
    if (source) query.source = source;
    if (priority) query.priority = priority;
    if (quality) query.quality = quality;
    if (assignedTo) query.assignedTo = assignedTo;

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get leads with population
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Lead.countDocuments(query);

    // Calculate pagination info
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead
// @access  Private
router.post('/', [
  verifyToken,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^[0-9+\-\s()]+$/).withMessage('Please provide a valid phone number'),
  body('source').isIn(['facebook', 'instagram', 'manual', 'website', 'referral', 'other']).withMessage('Invalid source'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('quality').optional().isIn(['hot', 'warm', 'cold']).withMessage('Invalid quality'),
  body('requirements').optional().isString().withMessage('Requirements must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      source,
      priority = 'medium',
      quality = 'warm',
      requirements,
      notes,
      location,
      budget
    } = req.body;

    // Check if lead already exists
    const existingLead = await Lead.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingLead) {
      return res.status(400).json({ 
        message: 'Lead with this email or phone already exists' 
      });
    }

    // Create new lead
    const lead = new Lead({
      name,
      email,
      phone,
      source,
      priority,
      quality,
      requirements,
      notes,
      location,
      budget,
      assignedBy: req.user._id
    });

    await lead.save();

    // Auto-assign the lead
    const assignmentResult = await leadAssignmentService.autoAssignLead(lead._id);

    // Populate assigned user
    await lead.populate('assignedTo', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead,
      assignment: assignmentResult
    });

  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/:id
// @desc    Get specific lead
// @access  Private
router.get('/:id', [
  verifyToken,
  body('id').isMongoId().withMessage('Invalid lead ID')
], async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email role department')
      .populate('assignedBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && lead.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      lead
    });

  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
router.put('/:id', [
  verifyToken,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^[0-9+\-\s()]+$/).withMessage('Please provide a valid phone number'),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('quality').optional().isIn(['hot', 'warm', 'cold']).withMessage('Invalid quality'),
  body('requirements').optional().isString().withMessage('Requirements must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update lead
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email role');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead
    });

  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete lead (Admin only)
// @access  Private (Admin)
router.delete('/:id', [
  verifyToken,
  requireRole('admin')
], async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/assign
// @desc    Assign lead to telecaller
// @access  Private (Admin/Supervisor)
router.post('/:id/assign', [
  verifyToken,
  requireRole('admin', 'supervisor'),
  body('assignedTo').isMongoId().withMessage('Invalid telecaller ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo } = req.body;

    // Check if telecaller exists and is active
    const telecaller = await User.findById(assignedTo);
    if (!telecaller || telecaller.role !== 'telecaller' || !telecaller.isActive) {
      return res.status(400).json({ message: 'Invalid telecaller' });
    }

    // Check if supervisor is assigning to their team member
    if (req.user.role === 'supervisor') {
      const isTeamMember = req.user.teamMembers.includes(assignedTo);
      if (!isTeamMember) {
        return res.status(403).json({ message: 'Can only assign to team members' });
      }
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Manual assignment
    const assignmentResult = await leadAssignmentService.manualAssignLead(
      req.params.id,
      assignedTo,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      assignment: assignmentResult
    });

  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/assigned/:userId
// @desc    Get leads assigned to specific user
// @access  Private
router.get('/assigned/:userId', [
  verifyToken,
  query('status').optional().isIn(['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { status } = req.query;
    const { userId } = req.params;

    // Check access permissions
    if (req.user.role === 'telecaller' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { assignedTo: userId };
    if (status) query.status = status;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leads
    });

  } catch (error) {
    console.error('Get assigned leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/stats/overview
// @desc    Get lead statistics overview
// @access  Private
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.assignedTo = { $in: teamMemberIds };
    }

    const stats = await Lead.aggregate([
      { $match: query },
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

    const overview = stats[0] || {
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

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/stats/sources
// @desc    Get lead statistics by source
// @access  Private
router.get('/stats/sources', verifyToken, async (req, res) => {
  try {
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.assignedTo = { $in: teamMemberIds };
    }

    const sourceStats = await Lead.aggregate([
      { $match: query },
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

    res.json({
      success: true,
      sourceStats
    });

  } catch (error) {
    console.error('Get source stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;