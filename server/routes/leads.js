const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Call = require('../models/Call');
const { verifyToken, requireSupervisor, canManageUser } = require('../middleware/auth');

const router = express.Router();

// Auto-assignment algorithm
const autoAssignLead = async (lead) => {
  try {
    // Find available telecallers in the same department or any department
    const availableTelecallers = await User.find({
      role: 'telecaller',
      isActive: true,
      isAvailable: true,
      currentStatus: { $in: ['available', 'break'] }
    }).sort({ totalLeads: 1, lastActive: 1 }); // Sort by workload and activity

    if (availableTelecallers.length === 0) {
      // If no available telecallers, assign to the one with least workload
      const telecallers = await User.find({
        role: 'telecaller',
        isActive: true
      }).sort({ totalLeads: 1 });

      if (telecallers.length > 0) {
        return telecallers[0]._id;
      }
      return null;
    }

    // Round-robin assignment among available telecallers
    return availableTelecallers[0]._id;
  } catch (error) {
    console.error('Auto-assignment error:', error);
    return null;
  }
};

// @route   GET /api/leads
// @desc    Get leads with filtering and pagination
// @access  Private
router.get('/', [
  verifyToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted', 'closed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('source').optional().isIn(['facebook', 'instagram', 'manual', 'website', 'referral', 'other'])
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
      priority,
      source,
      assignedTo,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisor can see their team's leads
      const teamMemberIds = [...req.user.teamMembers, req.user._id];
      filter.assignedTo = { $in: teamMemberIds };
    }
    // Admin can see all leads (no additional filter)

    // Apply query filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (source) filter.source = source;
    if (assignedTo && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
      filter.assignedTo = assignedTo;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email role currentStatus')
      .populate('assignedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lead.countDocuments(filter);

    // Calculate statistics
    const stats = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
        avgScore: 0
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Server error fetching leads' });
  }
});

// @route   GET /api/leads/:id
// @desc    Get single lead by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email role phone currentStatus')
      .populate('assignedBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(lead.assignedTo._id)) ||
                     (req.user.role === 'telecaller' && lead.assignedTo._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied to this lead' });
    }

    // Get call history for this lead
    const calls = await Call.find({ leadId: lead._id })
      .populate('telecallerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ lead, calls });

  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error fetching lead' });
  }
});

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private
router.post('/', [
  verifyToken,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^[0-9+\-\s()]+$/).withMessage('Please provide a valid phone number'),
  body('source').isIn(['facebook', 'instagram', 'manual', 'website', 'referral', 'other']).withMessage('Invalid source'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const leadData = req.body;
    
    // Auto-assign if not specified
    if (!leadData.assignedTo) {
      const assignedUserId = await autoAssignLead(leadData);
      if (assignedUserId) {
        leadData.assignedTo = assignedUserId;
        leadData.autoAssigned = true;
      } else {
        return res.status(400).json({ message: 'No available telecallers for assignment' });
      }
    }

    // Set assignedBy
    leadData.assignedBy = req.user._id;

    // Create lead
    const lead = new Lead(leadData);
    
    // Calculate initial score
    lead.calculateScore();
    
    await lead.save();

    // Update assigned user's lead count
    await User.findByIdAndUpdate(leadData.assignedTo, {
      $inc: { totalLeads: 1 }
    });

    // Populate and return the created lead
    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email');

    // Notify assigned user via socket
    if (req.io) {
      req.io.to(`user-${leadData.assignedTo}`).emit('new-lead-assigned', {
        lead: populatedLead,
        message: 'New lead assigned to you',
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Lead created successfully',
      lead: populatedLead
    });

  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error creating lead' });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
router.put('/:id', [
  verifyToken,
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9+\-\s()]+$/),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted', 'closed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
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
    const canUpdate = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(lead.assignedTo)) ||
                     (req.user.role === 'telecaller' && lead.assignedTo.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied to update this lead' });
    }

    // Track status changes for conversion
    const oldStatus = lead.status;
    const newStatus = req.body.status;

    // Update lead
    Object.assign(lead, req.body);
    
    // Handle conversion
    if (newStatus === 'converted' && oldStatus !== 'converted') {
      lead.isConverted = true;
      lead.conversionDate = new Date();
      
      // Update user's conversion count
      await User.findByIdAndUpdate(lead.assignedTo, {
        $inc: { convertedLeads: 1 }
      });
    }

    // Recalculate score
    lead.calculateScore();
    
    await lead.save();

    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email');

    res.json({
      message: 'Lead updated successfully',
      lead: updatedLead
    });

  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error updating lead' });
  }
});

// @route   PUT /api/leads/:id/assign
// @desc    Reassign lead to another user
// @access  Private (Supervisor/Admin)
router.put('/:id/assign', [
  verifyToken,
  requireSupervisor,
  body('assignedTo').isMongoId().withMessage('Valid assignedTo ID is required'),
  body('reason').optional().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo, reason } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify new assignee exists and is active
    const newAssignee = await User.findOne({ _id: assignedTo, isActive: true, role: 'telecaller' });
    if (!newAssignee) {
      return res.status(400).json({ message: 'Invalid assignee or user not active' });
    }

    const oldAssignee = lead.assignedTo;

    // Update lead
    lead.assignedTo = assignedTo;
    lead.assignedBy = req.user._id;
    lead.reassignmentCount += 1;
    if (reason) lead.notes = (lead.notes || '') + `\nReassigned: ${reason}`;
    
    await lead.save();

    // Update user statistics
    await User.findByIdAndUpdate(oldAssignee, { $inc: { totalLeads: -1 } });
    await User.findByIdAndUpdate(assignedTo, { $inc: { totalLeads: 1 } });

    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email');

    // Notify both users via socket
    if (req.io) {
      req.io.to(`user-${assignedTo}`).emit('new-lead-assigned', {
        lead: updatedLead,
        message: 'Lead reassigned to you',
        timestamp: new Date()
      });
      
      req.io.to(`user-${oldAssignee}`).emit('lead-reassigned', {
        leadId: lead._id,
        message: 'Lead has been reassigned',
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Lead reassigned successfully',
      lead: updatedLead
    });

  } catch (error) {
    console.error('Reassign lead error:', error);
    res.status(500).json({ message: 'Server error reassigning lead' });
  }
});

// @route   GET /api/leads/my/dashboard
// @desc    Get user's lead dashboard
// @access  Private
router.get('/my/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's leads summary
    const leadStats = await Lead.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    // Get overdue follow-ups
    const overdueFollowups = await Lead.find({
      assignedTo: userId,
      nextFollowupDate: { $lt: new Date() },
      status: { $nin: ['converted', 'closed'] }
    }).populate('assignedTo', 'name email').limit(10);

    // Get recent leads (last 7 days)
    const recentLeads = await Lead.find({
      assignedTo: userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).limit(5);

    // Get high priority leads
    const priorityLeads = await Lead.find({
      assignedTo: userId,
      priority: { $in: ['high', 'urgent'] },
      status: { $nin: ['converted', 'closed'] }
    }).limit(10);

    res.json({
      leadStats,
      overdueFollowups,
      recentLeads,
      priorityLeads,
      summary: {
        totalLeads: leadStats.reduce((sum, stat) => sum + stat.count, 0),
        overdueCount: overdueFollowups.length,
        recentCount: recentLeads.length,
        priorityCount: priorityLeads.length
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete lead (Admin only)
// @access  Private (Admin)
router.delete('/:id', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Update assigned user's lead count
    await User.findByIdAndUpdate(lead.assignedTo, {
      $inc: { totalLeads: -1 }
    });

    await Lead.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lead deleted successfully' });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error deleting lead' });
  }
});

module.exports = router;