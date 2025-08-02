const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Report = require('../models/Report');
const { verifyToken, requireRole, canManageUser } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin/Supervisor)
router.get('/', [
  verifyToken,
  requireRole('admin', 'supervisor'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'supervisor', 'telecaller']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('department').optional().isIn(['sales', 'marketing', 'support', 'lead_generation', 'follow_up']).withMessage('Invalid department'),
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
      role,
      status,
      department,
      search
    } = req.query;

    // Build query
    const query = {};

    // Role-based filtering
    if (req.user.role === 'supervisor') {
      // Supervisor can only see their team members
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query._id = { $in: teamMemberIds };
    }

    // Apply filters
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';
    if (department) query.department = department;

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with population
    const users = await User.find(query)
      .populate('supervisor', 'name email')
      .populate('teamMembers', 'name email role')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    // Calculate pagination info
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get specific user
// @access  Private
router.get('/:id', [
  verifyToken,
  body('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('supervisor', 'name email')
      .populate('teamMembers', 'name email role')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  verifyToken,
  canManageUser,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('department').optional().isIn(['sales', 'marketing', 'support', 'lead_generation', 'follow_up']).withMessage('Invalid department'),
  body('role').optional().isIn(['admin', 'supervisor', 'telecaller']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('supervisor').optional().isMongoId().withMessage('Invalid supervisor ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('supervisor', 'name email')
    .populate('teamMembers', 'name email role')
    .select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', [
  verifyToken,
  requireRole('admin')
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any assigned leads
    const assignedLeads = await Lead.countDocuments({ assignedTo: req.params.id });
    if (assignedLeads > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with assigned leads. Please reassign leads first.' 
      });
    }

    // Check if user has any calls
    const userCalls = await Call.countDocuments({ telecaller: req.params.id });
    if (userCalls > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with call history. Please archive user instead.' 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/team/:supervisorId
// @desc    Get team members for a supervisor
// @access  Private
router.get('/team/:supervisorId', [
  verifyToken,
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { status } = req.query;
    const { supervisorId } = req.params;

    // Check access permissions
    if (req.user.role === 'telecaller') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'supervisor' && supervisorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only view own team' });
    }

    const query = { supervisor: supervisorId };
    if (status) query.isActive = status === 'active';

    const teamMembers = await User.find(query)
      .populate('supervisor', 'name email')
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      teamMembers
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/status
// @desc    Update user status (active/inactive)
// @access  Private (Admin/Supervisor)
router.post('/:id/status', [
  verifyToken,
  requireRole('admin', 'supervisor'),
  canManageUser,
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private
router.get('/:id/stats', [
  verifyToken,
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { id } = req.params;

    // Check access permissions
    if (req.user.role === 'telecaller' && id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Get lead statistics
    const leadStats = await Lead.aggregate([
      {
        $match: {
          assignedTo: id,
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
          convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
        }
      }
    ]);

    // Get call statistics
    const callStats = await Call.aggregate([
      {
        $match: {
          telecaller: id,
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

    // Get report statistics
    const reportStats = await Report.aggregate([
      {
        $match: {
          user: id,
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

    const stats = {
      period: {
        startDate,
        endDate
      },
      leads: leadStats[0] || {
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        interestedLeads: 0,
        convertedLeads: 0
      },
      calls: callStats[0] || {
        totalCalls: 0,
        completedCalls: 0,
        successfulCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
        missedCalls: 0,
        failedCalls: 0
      },
      reports: reportStats[0] || {
        totalReports: 0,
        submittedReports: 0,
        approvedReports: 0,
        avgEnergy: 0,
        avgMood: 0
      }
    };

    // Calculate rates
    stats.leads.conversionRate = stats.leads.totalLeads > 0 ? 
      Math.round((stats.leads.convertedLeads / stats.leads.totalLeads) * 100) : 0;
    stats.calls.successRate = stats.calls.totalCalls > 0 ? 
      Math.round((stats.calls.successfulCalls / stats.calls.totalCalls) * 100) : 0;
    stats.calls.completionRate = stats.calls.totalCalls > 0 ? 
      Math.round((stats.calls.completedCalls / stats.calls.totalCalls) * 100) : 0;

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/telecallers/available
// @desc    Get available telecallers
// @access  Private (Admin/Supervisor)
router.get('/telecallers/available', [
  verifyToken,
  requireRole('admin', 'supervisor')
], async (req, res) => {
  try {
    const availableTelecallers = await User.find({
      role: 'telecaller',
      isActive: true,
      currentStatus: { $in: ['available', 'online'] }
    })
    .select('name email department currentStatus lastActive')
    .sort({ lastActive: -1 });

    res.json({
      success: true,
      telecallers: availableTelecallers
    });

  } catch (error) {
    console.error('Get available telecallers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/status-update
// @desc    Update user's current status
// @access  Private
router.post('/:id/status-update', [
  verifyToken,
  body('currentStatus').isIn(['available', 'busy', 'break', 'offline']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentStatus } = req.body;

    // Users can only update their own status
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only update own status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        currentStatus,
        lastActive: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Emit real-time update
    if (global.io) {
      global.io.emit('user-status-updated', {
        userId: user._id,
        status: currentStatus,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('supervisor', 'name email')
      .populate('teamMembers', 'name email role')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', [
  verifyToken,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('department').optional().isIn(['sales', 'marketing', 'support', 'lead_generation', 'follow_up']).withMessage('Invalid department'),
  body('avatar').optional().isString().withMessage('Avatar must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('supervisor', 'name email')
    .populate('teamMembers', 'name email role')
    .select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;