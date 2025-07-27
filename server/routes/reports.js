const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { verifyToken, requireSupervisor } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get reports with filtering and pagination
// @access  Private
router.get('/', [
  verifyToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('reportType').optional().isIn(['daily', 'weekly', 'monthly', 'custom']),
  query('status').optional().isIn(['draft', 'submitted', 'reviewed', 'approved'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      reportType,
      status,
      userId,
      startDate,
      endDate,
      sortBy = 'reportDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'telecaller') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisor can see their team's reports
      const teamMemberIds = [...req.user.teamMembers, req.user._id];
      filter.userId = { $in: teamMemberIds };
    }
    // Admin can see all reports (no additional filter)

    // Apply query filters
    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;
    if (userId && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
      filter.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) filter.reportDate.$gte = new Date(startDate);
      if (endDate) filter.reportDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const reports = await Report.find(filter)
      .populate('userId', 'name email role department')
      .populate('supervisorReview.reviewedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email role department phone')
      .populate('supervisorReview.reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(report.userId._id)) ||
                     (req.user.role === 'telecaller' && report.userId._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    res.json({ report });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error fetching report' });
  }
});

// @route   POST /api/reports
// @desc    Create or update daily report
// @access  Private
router.post('/', [
  verifyToken,
  body('reportDate').isISO8601().withMessage('Valid report date is required'),
  body('reportType').isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('Invalid report type'),
  body('callMetrics.totalCalls').optional().isInt({ min: 0 }),
  body('callMetrics.completedCalls').optional().isInt({ min: 0 }),
  body('leadMetrics.newLeads').optional().isInt({ min: 0 }),
  body('leadMetrics.convertedLeads').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reportData = {
      ...req.body,
      userId: req.user._id
    };

    const reportDate = new Date(reportData.reportDate);
    reportDate.setHours(0, 0, 0, 0);

    // Check if report already exists for this date
    const existingReport = await Report.findOne({
      userId: req.user._id,
      reportDate: reportDate
    });

    let report;
    if (existingReport) {
      // Update existing report if it's still editable
      if (!existingReport.isEditable()) {
        return res.status(400).json({ message: 'Report has been submitted and cannot be modified' });
      }

      Object.assign(existingReport, reportData);
      report = await existingReport.save();
    } else {
      // Create new report
      reportData.reportDate = reportDate;
      report = new Report(reportData);
      await report.save();
    }

    const populatedReport = await Report.findById(report._id)
      .populate('userId', 'name email role department');

    res.status(existingReport ? 200 : 201).json({
      message: existingReport ? 'Report updated successfully' : 'Report created successfully',
      report: populatedReport
    });

  } catch (error) {
    console.error('Create/Update report error:', error);
    res.status(500).json({ message: 'Server error creating/updating report' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', [
  verifyToken,
  body('status').optional().isIn(['draft', 'submitted', 'reviewed', 'approved'])
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
    const canUpdate = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(report.userId)) ||
                     (req.user.role === 'telecaller' && report.userId.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied to update this report' });
    }

    // Telecallers can only edit draft reports
    if (req.user.role === 'telecaller' && !report.isEditable()) {
      return res.status(400).json({ message: 'Report has been submitted and cannot be modified' });
    }

    // Update report
    Object.assign(report, req.body);
    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate('userId', 'name email role department')
      .populate('supervisorReview.reviewedBy', 'name email');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error updating report' });
  }
});

// @route   PUT /api/reports/:id/submit
// @desc    Submit report for review
// @access  Private
router.put('/:id/submit', verifyToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only the report owner can submit
    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the report owner can submit it' });
    }

    if (report.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft reports can be submitted' });
    }

    report.status = 'submitted';
    report.submittedAt = new Date();
    await report.save();

    res.json({
      message: 'Report submitted successfully',
      report
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error submitting report' });
  }
});

// @route   PUT /api/reports/:id/review
// @desc    Review report (Supervisor/Admin)
// @access  Private (Supervisor/Admin)
router.put('/:id/review', [
  verifyToken,
  requireSupervisor,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters'),
  body('status').isIn(['reviewed', 'approved']).withMessage('Status must be reviewed or approved')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, feedback, recommendations, status } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted reports can be reviewed' });
    }

    // Update report with review
    report.supervisorReview = {
      reviewedBy: req.user._id,
      reviewDate: new Date(),
      rating,
      feedback,
      recommendations
    };
    report.status = status;

    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate('userId', 'name email role department')
      .populate('supervisorReview.reviewedBy', 'name email');

    res.json({
      message: 'Report reviewed successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({ message: 'Server error reviewing report' });
  }
});

// @route   GET /api/reports/my/today
// @desc    Get or create today's report for current user
// @access  Private
router.get('/my/today', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let report = await Report.findOne({
      userId: req.user._id,
      reportDate: today
    }).populate('userId', 'name email role department');

    if (!report) {
      // Generate report from actual data
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get call metrics
      const callStats = await Call.aggregate([
        {
          $match: {
            telecallerId: req.user._id,
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            completedCalls: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            missedCalls: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
            successfulCalls: { $sum: { $cond: ['$isSuccessful', 1, 0] } },
            totalCallDuration: { $sum: '$duration' }
          }
        }
      ]);

      // Get lead metrics
      const leadStats = await Lead.aggregate([
        {
          $match: {
            assignedTo: req.user._id,
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            newLeads: { $sum: 1 },
            contactedLeads: { $sum: { $cond: [{ $ne: ['$lastContactDate', null] }, 1, 0] } },
            qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
            interestedLeads: { $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] } },
            convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
          }
        }
      ]);

      const callMetrics = callStats[0] || {
        totalCalls: 0,
        completedCalls: 0,
        missedCalls: 0,
        successfulCalls: 0,
        totalCallDuration: 0
      };

      const leadMetrics = leadStats[0] || {
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        interestedLeads: 0,
        convertedLeads: 0
      };

      // Create new report with auto-generated data
      report = new Report({
        userId: req.user._id,
        reportDate: today,
        reportType: 'daily',
        callMetrics,
        leadMetrics,
        status: 'draft'
      });

      await report.save();
      report = await Report.findById(report._id).populate('userId', 'name email role department');
    }

    res.json({ report });

  } catch (error) {
    console.error('Get today report error:', error);
    res.status(500).json({ message: 'Server error fetching today\'s report' });
  }
});

// @route   GET /api/reports/analytics/team
// @desc    Get team analytics
// @access  Private (Supervisor/Admin)
router.get('/analytics/team', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let teamMemberIds = [];
    if (req.user.role === 'supervisor') {
      teamMemberIds = req.user.teamMembers;
    } else if (req.user.role === 'admin') {
      const allTelecallers = await User.find({ role: 'telecaller' }, '_id');
      teamMemberIds = allTelecallers.map(t => t._id);
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get team report analytics
    const teamStats = await Report.generateTeamReport(teamMemberIds, start, end);

    // Get individual member performance
    const memberPerformance = await Report.aggregate([
      {
        $match: {
          userId: { $in: teamMemberIds },
          reportDate: { $gte: start, $lte: end },
          status: { $in: ['submitted', 'reviewed', 'approved'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$userId',
          name: { $first: '$user.name' },
          email: { $first: '$user.email' },
          totalReports: { $sum: 1 },
          avgCalls: { $avg: '$callMetrics.totalCalls' },
          avgLeads: { $avg: '$leadMetrics.newLeads' },
          avgConversions: { $avg: '$leadMetrics.convertedLeads' },
          avgRating: { $avg: '$supervisorReview.rating' }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    res.json({
      period: { start, end },
      teamStats,
      memberPerformance
    });

  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({ message: 'Server error fetching team analytics' });
  }
});

// @route   GET /api/reports/:id/export
// @desc    Export report as Excel or PDF
// @access  Private
router.get('/:id/export', [
  verifyToken,
  query('format').isIn(['excel', 'pdf']).withMessage('Format must be excel or pdf')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { format } = req.query;
    
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email role department phone');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' ||
                     (req.user.role === 'supervisor' && req.user.teamMembers.includes(report.userId._id)) ||
                     (req.user.role === 'telecaller' && report.userId._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied to export this report' });
    }

    if (format === 'excel') {
      // Generate Excel file
      const workbook = XLSX.utils.book_new();
      
      const reportData = [
        ['Report Details'],
        ['User', report.userId.name],
        ['Email', report.userId.email],
        ['Department', report.userId.department],
        ['Report Date', report.reportDate.toDateString()],
        ['Report Type', report.reportType],
        ['Status', report.status],
        [],
        ['Call Metrics'],
        ['Total Calls', report.callMetrics.totalCalls],
        ['Completed Calls', report.callMetrics.completedCalls],
        ['Missed Calls', report.callMetrics.missedCalls],
        ['Successful Calls', report.callMetrics.successfulCalls],
        ['Total Duration (seconds)', report.callMetrics.totalCallDuration],
        [],
        ['Lead Metrics'],
        ['New Leads', report.leadMetrics.newLeads],
        ['Contacted Leads', report.leadMetrics.contactedLeads],
        ['Qualified Leads', report.leadMetrics.qualifiedLeads],
        ['Interested Leads', report.leadMetrics.interestedLeads],
        ['Converted Leads', report.leadMetrics.convertedLeads],
        [],
        ['Performance Metrics'],
        ['Connection Rate (%)', report.performanceMetrics.connectionRate],
        ['Conversion Rate (%)', report.performanceMetrics.conversionRate],
        ['Customer Satisfaction', report.performanceMetrics.customerSatisfactionAvg]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(reportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.xlsx"`);
      res.send(buffer);

    } else if (format === 'pdf') {
      // Generate PDF file
      const doc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.pdf"`);
      
      doc.pipe(res);

      // PDF content
      doc.fontSize(20).text('Daily Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`User: ${report.userId.name}`);
      doc.text(`Email: ${report.userId.email}`);
      doc.text(`Department: ${report.userId.department}`);
      doc.text(`Report Date: ${report.reportDate.toDateString()}`);
      doc.text(`Status: ${report.status}`);
      doc.moveDown();

      doc.fontSize(16).text('Call Metrics');
      doc.fontSize(12)
        .text(`Total Calls: ${report.callMetrics.totalCalls}`)
        .text(`Completed Calls: ${report.callMetrics.completedCalls}`)
        .text(`Successful Calls: ${report.callMetrics.successfulCalls}`)
        .text(`Total Duration: ${Math.floor(report.callMetrics.totalCallDuration / 60)} minutes`);
      doc.moveDown();

      doc.fontSize(16).text('Lead Metrics');
      doc.fontSize(12)
        .text(`New Leads: ${report.leadMetrics.newLeads}`)
        .text(`Contacted Leads: ${report.leadMetrics.contactedLeads}`)
        .text(`Converted Leads: ${report.leadMetrics.convertedLeads}`);
      doc.moveDown();

      doc.fontSize(16).text('Performance');
      doc.fontSize(12)
        .text(`Connection Rate: ${report.performanceMetrics.connectionRate}%`)
        .text(`Conversion Rate: ${report.performanceMetrics.conversionRate}%`);

      if (report.notes) {
        doc.moveDown();
        doc.fontSize(16).text('Notes');
        doc.fontSize(12).text(report.notes);
      }

      doc.end();
    }

    // Log export
    report.exports.push({
      format,
      exportedAt: new Date(),
      exportedBy: req.user._id
    });
    await report.save();

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error exporting report' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report (Admin only)
// @access  Private (Admin)
router.delete('/:id', [verifyToken, requireSupervisor], async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error deleting report' });
  }
});

module.exports = router;