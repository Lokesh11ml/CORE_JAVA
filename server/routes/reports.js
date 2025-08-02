const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const reportService = require('../services/reportService');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports with filtering and pagination
// @access  Private
router.get('/', [
  verifyToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'submitted', 'reviewed', 'approved', 'rejected']).withMessage('Invalid status'),
  query('reportType').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid report type'),
  query('user').optional().isMongoId().withMessage('Invalid user ID'),
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
      reportType,
      user,
      dateFrom,
      dateTo
    } = req.query;

    // Build query
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.user = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisor can see their team's reports
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.user = { $in: teamMemberIds };
    }

    // Apply filters
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;
    if (user) query.user = user;

    // Date range filter
    if (dateFrom || dateTo) {
      query.reportDate = {};
      if (dateFrom) query.reportDate.$gte = new Date(dateFrom);
      if (dateTo) query.reportDate.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reports with population
    const reports = await Report.find(query)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Report.countDocuments(query);

    // Calculate pagination info
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private
router.post('/', [
  verifyToken,
  body('reportType').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid report type'),
  body('reportDate').isISO8601().withMessage('Invalid report date'),
  body('totalCalls').optional().isInt({ min: 0 }).withMessage('Total calls must be a non-negative integer'),
  body('completedCalls').optional().isInt({ min: 0 }).withMessage('Completed calls must be a non-negative integer'),
  body('successfulCalls').optional().isInt({ min: 0 }).withMessage('Successful calls must be a non-negative integer'),
  body('contactedLeads').optional().isInt({ min: 0 }).withMessage('Contacted leads must be a non-negative integer'),
  body('convertedLeads').optional().isInt({ min: 0 }).withMessage('Converted leads must be a non-negative integer'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('challenges').optional().isString().withMessage('Challenges must be a string'),
  body('improvements').optional().isString().withMessage('Improvements must be a string'),
  body('blockers').optional().isString().withMessage('Blockers must be a string'),
  body('mood').optional().isIn(['excellent', 'good', 'average', 'poor', 'terrible']).withMessage('Invalid mood'),
  body('energy').optional().isInt({ min: 1, max: 10 }).withMessage('Energy must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      reportType,
      reportDate,
      totalCalls = 0,
      completedCalls = 0,
      successfulCalls = 0,
      contactedLeads = 0,
      convertedLeads = 0,
      notes,
      challenges,
      improvements,
      blockers,
      mood = 'good',
      energy = 7,
      activities = []
    } = req.body;

    // Check if report already exists for this date and user
    const existingReport = await Report.findOne({
      user: req.user._id,
      reportDate: new Date(reportDate),
      reportType
    });

    if (existingReport) {
      return res.status(400).json({ 
        message: 'Report already exists for this date' 
      });
    }

    // Create new report
    const report = new Report({
      user: req.user._id,
      reportType,
      reportDate: new Date(reportDate),
      totalCalls,
      completedCalls,
      successfulCalls,
      contactedLeads,
      convertedLeads,
      notes,
      challenges,
      improvements,
      blockers,
      mood,
      energy,
      activities,
      status: 'draft'
    });

    await report.save();

    // Populate user
    await report.populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get specific report
// @access  Private
router.get('/:id', [
  verifyToken,
  body('id').isMongoId().withMessage('Invalid report ID')
], async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && report.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', [
  verifyToken,
  body('totalCalls').optional().isInt({ min: 0 }).withMessage('Total calls must be a non-negative integer'),
  body('completedCalls').optional().isInt({ min: 0 }).withMessage('Completed calls must be a non-negative integer'),
  body('successfulCalls').optional().isInt({ min: 0 }).withMessage('Successful calls must be a non-negative integer'),
  body('contactedLeads').optional().isInt({ min: 0 }).withMessage('Contacted leads must be a non-negative integer'),
  body('convertedLeads').optional().isInt({ min: 0 }).withMessage('Converted leads must be a non-negative integer'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('challenges').optional().isString().withMessage('Challenges must be a string'),
  body('improvements').optional().isString().withMessage('Improvements must be a string'),
  body('blockers').optional().isString().withMessage('Blockers must be a string'),
  body('mood').optional().isIn(['excellent', 'good', 'average', 'poor', 'terrible']).withMessage('Invalid mood'),
  body('energy').optional().isInt({ min: 1, max: 10 }).withMessage('Energy must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates if report is in draft status
    if (report.status !== 'draft') {
      return res.status(400).json({ message: 'Can only update draft reports' });
    }

    // Update report
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    res.json({
      success: true,
      message: 'Report updated successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/submit
// @desc    Submit report for review
// @access  Private
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check access permissions
    if (req.user.role === 'telecaller' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow submission if report is in draft status
    if (report.status !== 'draft') {
      return res.status(400).json({ message: 'Report is not in draft status' });
    }

    // Update report status
    report.status = 'submitted';
    await report.save();

    res.json({
      success: true,
      message: 'Report submitted successfully',
      report
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/review
// @desc    Review report (Supervisor/Admin)
// @access  Private (Supervisor/Admin)
router.post('/:id/review', [
  verifyToken,
  requireRole('admin', 'supervisor'),
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid review status'),
  body('reviewNotes').optional().isString().withMessage('Review notes must be a string'),
  body('reviewRating').optional().isInt({ min: 1, max: 5 }).withMessage('Review rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reviewNotes, reviewRating } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if supervisor is reviewing their team member's report
    if (req.user.role === 'supervisor') {
      const isTeamMember = req.user.teamMembers.includes(report.user);
      if (!isTeamMember) {
        return res.status(403).json({ message: 'Can only review team member reports' });
      }
    }

    // Update report with review
    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewDate = new Date();
    if (reviewNotes) report.reviewNotes = reviewNotes;
    if (reviewRating) report.reviewRating = reviewRating;

    await report.save();

    await report.populate('user', 'name email role');
    await report.populate('reviewedBy', 'name email');

    res.json({
      success: true,
      message: 'Report reviewed successfully',
      report
    });

  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/user/:userId
// @desc    Get reports for specific user
// @access  Private
router.get('/user/:userId', [
  verifyToken,
  query('status').optional().isIn(['draft', 'submitted', 'reviewed', 'approved', 'rejected']).withMessage('Invalid status'),
  query('reportType').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid report type'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
], async (req, res) => {
  try {
    const { status, reportType, dateFrom, dateTo } = req.query;
    const { userId } = req.params;

    // Check access permissions
    if (req.user.role === 'telecaller' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { user: userId };
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;

    // Date range filter
    if (dateFrom || dateTo) {
      query.reportDate = {};
      if (dateFrom) query.reportDate.$gte = new Date(dateFrom);
      if (dateTo) query.reportDate.$lte = new Date(dateTo);
    }

    const reports = await Report.find(query)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort({ reportDate: -1 });

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/stats/overview
// @desc    Get report statistics overview
// @access  Private
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const query = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      query.user = req.user._id;
    } else if (req.user.role === 'supervisor') {
      const teamMemberIds = req.user.teamMembers.map(member => member._id);
      query.user = { $in: teamMemberIds };
    }

    const stats = await Report.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          submittedReports: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          approvedReports: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedReports: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          totalCalls: { $sum: '$totalCalls' },
          totalLeads: { $sum: '$contactedLeads' },
          totalConversions: { $sum: '$convertedLeads' },
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

    const overview = stats[0] || {
      totalReports: 0,
      submittedReports: 0,
      approvedReports: 0,
      rejectedReports: 0,
      totalCalls: 0,
      totalLeads: 0,
      totalConversions: 0,
      avgEnergy: 0,
      avgMood: 0
    };

    // Calculate rates
    overview.submissionRate = overview.totalReports > 0 ? 
      Math.round((overview.submittedReports / overview.totalReports) * 100) : 0;
    overview.approvalRate = overview.submittedReports > 0 ? 
      Math.round((overview.approvedReports / overview.submittedReports) * 100) : 0;

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/generate/:type
// @desc    Generate Excel/PDF report
// @access  Private
router.post('/generate/:type', [
  verifyToken,
  body('reportType').isIn(['leads', 'calls', 'performance', 'meta_ads']).withMessage('Invalid report type'),
  body('format').isIn(['excel', 'pdf']).withMessage('Invalid format'),
  body('filters').optional().isObject().withMessage('Filters must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportType, format, filters = {} } = req.body;
    const { type } = req.params; // 'excel' or 'pdf'

    let result;
    if (type === 'excel') {
      result = await reportService.generateExcelReport(reportType, filters, req.user._id);
    } else if (type === 'pdf') {
      result = await reportService.generatePDFReport(reportType, filters, req.user._id);
    } else {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      success: true,
      message: 'Report generated successfully',
      ...result
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/download/:filename
// @desc    Download generated report file
// @access  Private
router.get('/download/:filename', verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = require('path').join(__dirname, '../reports', filename);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report (Admin only)
// @access  Private (Admin)
router.delete('/:id', [
  verifyToken,
  requireRole('admin')
], async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;