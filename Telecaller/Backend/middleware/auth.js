const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole('admin');

// Check if user is admin or supervisor
const requireSupervisor = requireRole('admin', 'supervisor');

// Check if user can access resource (own resources or admin/supervisor can access all)
const canAccessResource = (resourceUserId) => {
  return (req, res, next) => {
    const isOwnResource = req.user._id.toString() === resourceUserId.toString();
    const isAdminOrSupervisor = ['admin', 'supervisor'].includes(req.user.role);
    
    if (!isOwnResource && !isAdminOrSupervisor) {
      return res.status(403).json({ 
        message: 'Access denied. Cannot access this resource.' 
      });
    }
    
    next();
  };
};

// Check if user can manage team member
const canManageUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    // Admin can manage everyone
    if (req.user.role === 'admin') {
      req.targetUser = targetUser;
      return next();
    }

    // Supervisor can manage their team members
    if (req.user.role === 'supervisor') {
      const canManage = req.user.teamMembers.includes(targetUserId) || 
                       targetUser.supervisor?.toString() === req.user._id.toString();
      
      if (canManage) {
        req.targetUser = targetUser;
        return next();
      }
    }

    // Users can only manage themselves
    if (req.user._id.toString() === targetUserId) {
      req.targetUser = targetUser;
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied. Cannot manage this user.' 
    });

  } catch (error) {
    console.error('User management check error:', error);
    return res.status(500).json({ message: 'Server error during authorization.' });
  }
};

// Update user activity
const updateActivity = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        lastActive: new Date(),
        currentStatus: 'available'
      });
    }
    next();
  } catch (error) {
    console.error('Activity update error:', error);
    next(); // Continue even if activity update fails
  }
};

// Rate limiting for sensitive operations
const sensitiveOperation = (req, res, next) => {
  // Additional security checks for sensitive operations
  const sensitiveRoutes = ['/auth/change-password', '/users/delete', '/admin/'];
  const isSensitive = sensitiveRoutes.some(route => req.path.includes(route));
  
  if (isSensitive) {
    // Add additional verification or logging here
    console.log(`Sensitive operation attempted by user ${req.user._id}: ${req.method} ${req.path}`);
  }
  
  next();
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireSupervisor,
  canAccessResource,
  canManageUser,
  updateActivity,
  sensitiveOperation
};