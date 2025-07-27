const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const { verifyToken, requireAdmin, requireSupervisor, canManageUser } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin/Supervisor)
router.get('/', [
  verifyToken,
  requireSupervisor,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'supervisor', 'telecaller']),
  query('department').optional().isIn(['sales', 'marketing', 'support', 'lead_generation', 'follow_up']),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      role,
      department,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'supervisor') {
      // Supervisor can only see their team members and themselves
      filter.$or = [
        { _id: req.user._id },
        { supervisor: req.user._id },
        { _id: { $in: req.user.teamMembers } }
      ];
    }
    // Admin can see all users (no additional filter)

    // Apply query filters
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .populate('supervisor', 'name email role')
      .populate('teamMembers', 'name email role currentStatus')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private
router.get('/:id', [verifyToken, canManageUser], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('supervisor', 'name email role')
      .populate('teamMembers', 'name email role currentStatus');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const stats = {
      leads: await Lead.countDocuments({ assignedTo: user._id }),
      calls: await Call.countDocuments({ telecallerId: user._id }),
      conversions: await Lead.countDocuments({ assignedTo: user._id, isConverted: true })
    };

    res.json({ user, stats });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin/Supervisor)
router.put('/:id', [
  verifyToken,
  canManageUser,
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10}$/),
  body('role').optional().isIn(['admin', 'supervisor', 'telecaller']),
  body('department').optional().isIn(['sales', 'marketing', 'support', 'lead_generation', 'follow_up']),
  body('isActive').optional().isBoolean()
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

    // Check if email is being changed and if it's unique
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Handle role changes
    if (req.body.role && req.body.role !== user.role) {
      // Only admin can change roles
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can change user roles' });
      }

      // If changing from supervisor, remove them from team members' supervisor field
      if (user.role === 'supervisor') {
        await User.updateMany(
          { supervisor: user._id },
          { $unset: { supervisor: 1 } }
        );
      }

      // If changing to telecaller, clear team members
      if (req.body.role === 'telecaller') {
        user.teamMembers = [];
      }
    }

    // Handle supervisor assignment for telecallers
    if (req.body.supervisor !== undefined) {
      const oldSupervisor = user.supervisor;
      const newSupervisor = req.body.supervisor;

      // Remove from old supervisor's team
      if (oldSupervisor) {
        await User.findByIdAndUpdate(oldSupervisor, {
          $pull: { teamMembers: user._id }
        });
      }

      // Add to new supervisor's team
      if (newSupervisor) {
        await User.findByIdAndUpdate(newSupervisor, {
          $addToSet: { teamMembers: user._id }
        });
      }
    }

    // Update user
    Object.assign(user, req.body);
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('supervisor', 'name email role')
      .populate('teamMembers', 'name email role currentStatus');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user active status
// @access  Private (Admin/Supervisor)
router.put('/:id/status', [
  verifyToken,
  requireSupervisor,
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const userId = req.params.id;

    // Prevent self-deactivation
    if (userId === req.user._id.toString() && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isActive,
        currentStatus: isActive ? 'offline' : 'offline'
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If deactivating, reassign their leads
    if (!isActive) {
      const userLeads = await Lead.find({ 
        assignedTo: userId, 
        status: { $nin: ['converted', 'closed'] } 
      });

      if (userLeads.length > 0) {
        // Find available telecallers to reassign leads
        const availableTelecallers = await User.find({
          role: 'telecaller',
          isActive: true,
          _id: { $ne: userId }
        }).sort({ totalLeads: 1 });

        if (availableTelecallers.length > 0) {
          // Distribute leads among available telecallers
          for (let i = 0; i < userLeads.length; i++) {
            const assigneeIndex = i % availableTelecallers.length;
            const newAssignee = availableTelecallers[assigneeIndex];

            await Lead.findByIdAndUpdate(userLeads[i]._id, {
              assignedTo: newAssignee._id,
              reassignmentCount: userLeads[i].reassignmentCount + 1,
              notes: (userLeads[i].notes || '') + `\nReassigned due to user deactivation on ${new Date().toLocaleDateString()}`
            });

            // Update lead counts
            await User.findByIdAndUpdate(newAssignee._id, { $inc: { totalLeads: 1 } });
          }

          // Reset deactivated user's lead count
          await User.findByIdAndUpdate(userId, { totalLeads: 0 });
        }
      }
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// @route   GET /api/users/team/dashboard
// @desc    Get team dashboard for supervisors
// @access  Private (Supervisor)
router.get('/team/dashboard', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    let teamMemberIds = [];

    if (req.user.role === 'supervisor') {
      teamMemberIds = req.user.teamMembers;
    } else if (req.user.role === 'admin') {
      // Admin can see all telecallers
      const allTelecallers = await User.find({ role: 'telecaller' }, '_id');
      teamMemberIds = allTelecallers.map(t => t._id);
    }

    // Get team members with their stats
    const teamMembers = await User.find({ _id: { $in: teamMemberIds } })
      .select('-password')
      .lean();

    // Get performance stats for each team member
    const teamStats = await Promise.all(teamMembers.map(async (member) => {
      const leads = await Lead.countDocuments({ assignedTo: member._id });
      const calls = await Call.countDocuments({ telecallerId: member._id });
      const conversions = await Lead.countDocuments({ assignedTo: member._id, isConverted: true });
      
      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCalls = await Call.countDocuments({
        telecallerId: member._id,
        createdAt: { $gte: today, $lt: tomorrow }
      });

      return {
        ...member,
        stats: {
          totalLeads: leads,
          totalCalls: calls,
          conversions,
          todayCalls,
          conversionRate: leads > 0 ? Math.round((conversions / leads) * 100) : 0
        }
      };
    }));

    // Calculate team totals
    const teamTotals = teamStats.reduce((acc, member) => ({
      totalLeads: acc.totalLeads + member.stats.totalLeads,
      totalCalls: acc.totalCalls + member.stats.totalCalls,
      conversions: acc.conversions + member.stats.conversions,
      todayCalls: acc.todayCalls + member.stats.todayCalls
    }), { totalLeads: 0, totalCalls: 0, conversions: 0, todayCalls: 0 });

    // Get team activity (online/offline status)
    const onlineMembers = teamStats.filter(m => m.currentStatus !== 'offline').length;

    res.json({
      teamMembers: teamStats,
      teamTotals,
      teamActivity: {
        totalMembers: teamStats.length,
        onlineMembers,
        offlineMembers: teamStats.length - onlineMembers
      }
    });

  } catch (error) {
    console.error('Team dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching team dashboard' });
  }
});

// @route   GET /api/users/performance/:userId
// @desc    Get detailed performance analytics for a user
// @access  Private (Supervisor/Admin)
router.get('/performance/:userId', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get call performance
    const callStats = await Call.getCallStats(userId, start, end);

    // Get lead performance
    const leadStats = await Lead.aggregate([
      {
        $match: {
          assignedTo: user._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          conversions: { $sum: { $cond: ['$isConverted', 1, 0] } },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    // Get daily performance trend
    const dailyPerformance = await Call.aggregate([
      {
        $match: {
          telecallerId: user._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          calls: { $sum: 1 },
          successful: { $sum: { $cond: ['$isSuccessful', 1, 0] } },
          duration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      user: { name: user.name, email: user.email, role: user.role },
      period: { start, end },
      callStats,
      leadStats: leadStats[0] || { totalLeads: 0, conversions: 0, avgScore: 0 },
      dailyPerformance
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ message: 'Server error fetching performance analytics' });
  }
});

// @route   POST /api/users/:id/assign-supervisor
// @desc    Assign supervisor to telecaller
// @access  Private (Admin)
router.post('/:id/assign-supervisor', [
  verifyToken,
  requireAdmin,
  body('supervisorId').isMongoId().withMessage('Valid supervisor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supervisorId } = req.body;
    const telecallerId = req.params.id;

    // Verify telecaller exists
    const telecaller = await User.findOne({ _id: telecallerId, role: 'telecaller' });
    if (!telecaller) {
      return res.status(404).json({ message: 'Telecaller not found' });
    }

    // Verify supervisor exists
    const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor', isActive: true });
    if (!supervisor) {
      return res.status(404).json({ message: 'Supervisor not found or inactive' });
    }

    // Remove from old supervisor if exists
    if (telecaller.supervisor) {
      await User.findByIdAndUpdate(telecaller.supervisor, {
        $pull: { teamMembers: telecallerId }
      });
    }

    // Update telecaller's supervisor
    telecaller.supervisor = supervisorId;
    await telecaller.save();

    // Add to new supervisor's team
    await User.findByIdAndUpdate(supervisorId, {
      $addToSet: { teamMembers: telecallerId }
    });

    res.json({
      message: 'Supervisor assigned successfully',
      telecaller: telecaller.name,
      supervisor: supervisor.name
    });

  } catch (error) {
    console.error('Assign supervisor error:', error);
    res.status(500).json({ message: 'Server error assigning supervisor' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reassign user's leads before deletion
    const userLeads = await Lead.find({ assignedTo: userId, status: { $nin: ['converted', 'closed'] } });
    
    if (userLeads.length > 0) {
      const availableTelecallers = await User.find({
        role: 'telecaller',
        isActive: true,
        _id: { $ne: userId }
      }).sort({ totalLeads: 1 });

      if (availableTelecallers.length > 0) {
        // Distribute leads
        for (let i = 0; i < userLeads.length; i++) {
          const assigneeIndex = i % availableTelecallers.length;
          const newAssignee = availableTelecallers[assigneeIndex];

          await Lead.findByIdAndUpdate(userLeads[i]._id, {
            assignedTo: newAssignee._id,
            reassignmentCount: userLeads[i].reassignmentCount + 1,
            notes: (userLeads[i].notes || '') + `\nReassigned due to user deletion on ${new Date().toLocaleDateString()}`
          });

          await User.findByIdAndUpdate(newAssignee._id, { $inc: { totalLeads: 1 } });
        }
      }
    }

    // Remove from supervisor's team if telecaller
    if (user.supervisor) {
      await User.findByIdAndUpdate(user.supervisor, {
        $pull: { teamMembers: userId }
      });
    }

    // Remove supervisor assignment from team members if supervisor
    if (user.role === 'supervisor') {
      await User.updateMany(
        { supervisor: userId },
        { $unset: { supervisor: 1 } }
      );
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;