const express = require('express');
const { body, validationResult } = require('express-validator');
const metaAdsService = require('../services/metaAdsService');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/meta/webhook
// @desc    Meta Ads webhook for lead capture
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
      return res.status(401).json({ message: 'Missing signature' });
    }

    const body = JSON.stringify(req.body);
    if (!metaAdsService.verifyWebhookSignature(signature, body)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Handle different webhook types
    const { object, entry } = req.body;

    if (object === 'page' && entry && entry.length > 0) {
      for (const pageEntry of entry) {
        if (pageEntry.messaging && pageEntry.messaging.length > 0) {
          // Handle messaging events
          for (const messagingEvent of pageEntry.messaging) {
            await handleMessagingEvent(messagingEvent);
          }
        } else if (pageEntry.changes && pageEntry.changes.length > 0) {
          // Handle lead form submissions
          for (const change of pageEntry.changes) {
            if (change.value && change.value.leadgen_id) {
              await handleLeadFormSubmission(change.value);
            }
          }
        }
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Meta webhook error:', error);
    res.status(500).send('Error');
  }
});

// Handle messaging events
async function handleMessagingEvent(messagingEvent) {
  try {
    const { sender, message, postback } = messagingEvent;

    if (message && message.text) {
      // Handle text messages
      console.log('Received message:', message.text);
    } else if (postback && postback.payload) {
      // Handle postback events
      console.log('Received postback:', postback.payload);
    }

  } catch (error) {
    console.error('Handle messaging event error:', error);
  }
}

// Handle lead form submissions
async function handleLeadFormSubmission(leadData) {
  try {
    // Process the lead through Meta Ads service
    const result = await metaAdsService.processMetaLead(leadData);

    if (result.success) {
      console.log('Lead processed successfully:', result.lead._id);
    } else {
      console.log('Lead processing failed:', result.message);
    }

  } catch (error) {
    console.error('Handle lead form submission error:', error);
  }
}

// @route   GET /api/meta/webhook
// @desc    Meta Ads webhook verification
// @access  Public
router.get('/webhook', async (req, res) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('Webhook verification failed');
      res.status(403).send('Forbidden');
    }

  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).send('Error');
  }
});

// @route   GET /api/meta/stats
// @desc    Get Meta Ads statistics
// @access  Private (Admin/Supervisor)
router.get('/stats', [
  verifyToken,
  requireRole('admin', 'supervisor')
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await metaAdsService.getMetaAdsStats(start, end);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get Meta Ads stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meta/campaigns/:campaignId
// @desc    Get leads by campaign
// @access  Private (Admin/Supervisor)
router.get('/campaigns/:campaignId', [
  verifyToken,
  requireRole('admin', 'supervisor')
], async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const leads = await metaAdsService.getLeadsByCampaign(campaignId, start, end);

    res.json({
      success: true,
      leads
    });

  } catch (error) {
    console.error('Get campaign leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meta/campaigns
// @desc    Get campaign performance
// @access  Private (Admin/Supervisor)
router.get('/campaigns', [
  verifyToken,
  requireRole('admin', 'supervisor')
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const performance = await metaAdsService.getCampaignPerformance(start, end);

    res.json({
      success: true,
      performance
    });

  } catch (error) {
    console.error('Get campaign performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/meta/sync
// @desc    Manually sync leads with Meta Ads
// @access  Private (Admin)
router.post('/sync', [
  verifyToken,
  requireRole('admin')
], async (req, res) => {
  try {
    const result = await metaAdsService.syncLeadsWithMeta();

    res.json({
      success: true,
      message: 'Meta Ads sync initiated',
      result
    });

  } catch (error) {
    console.error('Meta Ads sync error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meta/leads
// @desc    Get Meta Ads leads with filtering
// @access  Private (Admin/Supervisor)
router.get('/leads', [
  verifyToken,
  requireRole('admin', 'supervisor')
], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, quality, priority, dateFrom, dateTo } = req.query;

    // Build query
    const query = { source: 'facebook' };

    // Apply filters
    if (status) query.status = status;
    if (quality) query.quality = quality;
    if (priority) query.priority = priority;

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get leads
    const Lead = require('../models/Lead');
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role')
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
    console.error('Get Meta Ads leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meta/leads/stats
// @desc    Get Meta Ads leads statistics
// @access  Private (Admin/Supervisor)
router.get('/leads/stats', [
  verifyToken,
  requireRole('admin', 'supervisor')
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const Lead = require('../models/Lead');
    const stats = await Lead.aggregate([
      {
        $match: {
          source: 'facebook',
          createdAt: { $gte: start, $lte: end }
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
          coldLeads: { $sum: { $cond: [{ $eq: ['$quality', 'cold'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgentPriority: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
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
      coldLeads: 0,
      highPriority: 0,
      urgentPriority: 0
    };

    // Calculate conversion rate
    overview.conversionRate = overview.totalLeads > 0 ? 
      Math.round((overview.convertedLeads / overview.totalLeads) * 100) : 0;

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Get Meta Ads leads stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/meta/test-webhook
// @desc    Test webhook endpoint (for development)
// @access  Private (Admin)
router.post('/test-webhook', [
  verifyToken,
  requireRole('admin'),
  body('full_name').isString().withMessage('Full name is required'),
  body('phone_number').isString().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('lead_id').isString().withMessage('Lead ID is required'),
  body('campaign_id').optional().isString().withMessage('Campaign ID must be a string'),
  body('ad_id').optional().isString().withMessage('Ad ID must be a string'),
  body('form_id').optional().isString().withMessage('Form ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create test lead data
    const testLeadData = {
      full_name: req.body.full_name,
      phone_number: req.body.phone_number,
      email: req.body.email,
      lead_id: req.body.lead_id,
      campaign_id: req.body.campaign_id || 'test_campaign',
      ad_id: req.body.ad_id || 'test_ad',
      form_id: req.body.form_id || 'test_form',
      created_time: Math.floor(Date.now() / 1000),
      field_data: [
        { name: 'full_name', values: [req.body.full_name] },
        { name: 'phone_number', values: [req.body.phone_number] },
        { name: 'email', values: [req.body.email] }
      ]
    };

    // Process the test lead
    const result = await metaAdsService.processMetaLead(testLeadData);

    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      result
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;