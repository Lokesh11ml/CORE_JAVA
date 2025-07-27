const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Auto-assignment algorithm (same as in leads.js)
const autoAssignLead = async (leadData) => {
  try {
    const availableTelecallers = await User.find({
      role: 'telecaller',
      isActive: true,
      isAvailable: true,
      currentStatus: { $in: ['available', 'break'] }
    }).sort({ totalLeads: 1, lastActive: 1 });

    if (availableTelecallers.length === 0) {
      const telecallers = await User.find({
        role: 'telecaller',
        isActive: true
      }).sort({ totalLeads: 1 });

      if (telecallers.length > 0) {
        return telecallers[0]._id;
      }
      return null;
    }

    return availableTelecallers[0]._id;
  } catch (error) {
    console.error('Auto-assignment error:', error);
    return null;
  }
};

// @route   POST /api/meta/webhook
// @desc    Facebook webhook for receiving leads
// @access  Public (but verified)
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Verify webhook signature (Facebook security)
    // In production, you should verify the X-Hub-Signature-256 header

    if (body.object === 'page') {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes;
        
        changes.forEach(async (change) => {
          if (change.field === 'leadgen') {
            const leadgenData = change.value;
            
            try {
              // Fetch lead data from Facebook API
              const leadData = await fetchLeadFromFacebook(leadgenData.leadgen_id);
              
              if (leadData) {
                await processMetaLead(leadData, leadgenData);
              }
            } catch (error) {
              console.error('Error processing Meta lead:', error);
            }
          }
        });
      });

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// @route   GET /api/meta/webhook
// @desc    Facebook webhook verification
// @access  Public
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Function to fetch lead data from Facebook API
const fetchLeadFromFacebook = async (leadId) => {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    const response = await axios.get(`https://graph.facebook.com/v18.0/${leadId}`, {
      params: {
        access_token: accessToken,
        fields: 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,field_data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching lead from Facebook:', error.response?.data || error.message);
    return null;
  }
};

// Function to process Meta lead and create in database
const processMetaLead = async (metaLead, webhookData) => {
  try {
    // Extract lead information from Meta data
    const fieldData = metaLead.field_data || [];
    const leadInfo = {};

    // Parse field data
    fieldData.forEach(field => {
      const fieldName = field.name.toLowerCase();
      const fieldValue = field.values[0];

      switch (fieldName) {
        case 'email':
          leadInfo.email = fieldValue;
          break;
        case 'phone_number':
        case 'phone':
          leadInfo.phone = fieldValue;
          break;
        case 'full_name':
        case 'name':
          leadInfo.name = fieldValue;
          break;
        case 'city':
          leadInfo.city = fieldValue;
          break;
        case 'state':
          leadInfo.state = fieldValue;
          break;
        case 'job_title':
          leadInfo.jobTitle = fieldValue;
          break;
        case 'company_name':
          leadInfo.company = fieldValue;
          break;
        default:
          // Store custom fields
          if (!leadInfo.customFields) leadInfo.customFields = [];
          leadInfo.customFields.push({
            name: field.name,
            value: fieldValue
          });
      }
    });

    // Validate required fields
    if (!leadInfo.email || !leadInfo.phone || !leadInfo.name) {
      console.error('Missing required fields in Meta lead:', leadInfo);
      return;
    }

    // Check if lead already exists
    const existingLead = await Lead.findOne({
      $or: [
        { metaLeadId: metaLead.id },
        { email: leadInfo.email, phone: leadInfo.phone }
      ]
    });

    if (existingLead) {
      console.log('Lead already exists:', existingLead._id);
      return;
    }

    // Determine source based on platform
    let source = 'facebook';
    if (metaLead.ad_name && metaLead.ad_name.toLowerCase().includes('instagram')) {
      source = 'instagram';
    }

    // Auto-assign lead
    const assignedTo = await autoAssignLead(leadInfo);
    if (!assignedTo) {
      console.error('No available telecaller for Meta lead assignment');
      return;
    }

    // Create new lead
    const newLead = new Lead({
      name: leadInfo.name,
      email: leadInfo.email,
      phone: leadInfo.phone,
      source,
      metaLeadId: metaLead.id,
      metaAdId: metaLead.ad_id,
      metaCampaignId: metaLead.campaign_id,
      metaAdSetId: metaLead.adset_id,
      metaFormId: metaLead.form_id,
      assignedTo,
      autoAssigned: true,
      priority: 'high', // Meta leads are typically high priority
      status: 'new',
      location: {
        city: leadInfo.city,
        state: leadInfo.state
      },
      metaData: {
        adName: metaLead.ad_name,
        campaignName: metaLead.campaign_name,
        adSetName: metaLead.adset_name,
        leadGenFormName: metaLead.form_name,
        customFields: leadInfo.customFields || []
      },
      notes: `Lead received from Meta Ads on ${new Date().toLocaleDateString()}`
    });

    // Calculate score and save
    newLead.calculateScore();
    await newLead.save();

    // Update assigned user's lead count
    await User.findByIdAndUpdate(assignedTo, {
      $inc: { totalLeads: 1 }
    });

    // Get populated lead for socket notification
    const populatedLead = await Lead.findById(newLead._id)
      .populate('assignedTo', 'name email role');

    console.log('Meta lead processed successfully:', newLead._id);

    // Note: Socket notification would be sent here if we had access to io
    // This would typically be done through a message queue or event system

  } catch (error) {
    console.error('Error processing Meta lead:', error);
  }
};

// @route   GET /api/meta/campaigns
// @desc    Get Facebook campaigns
// @access  Private (Admin)
router.get('/campaigns', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      return res.status(400).json({ 
        message: 'Facebook credentials not configured' 
      });
    }

    const response = await axios.get(`https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,status,objective,created_time,updated_time',
        limit: 50
      }
    });

    res.json({ campaigns: response.data.data });

  } catch (error) {
    console.error('Error fetching campaigns:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching campaigns from Facebook' });
  }
});

// @route   GET /api/meta/forms
// @desc    Get Facebook lead generation forms
// @access  Private (Admin)
router.get('/forms', [verifyToken, requireAdmin], async (req, res) => {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      return res.status(400).json({ 
        message: 'Facebook credentials not configured' 
      });
    }

    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/leadgen_forms`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,status,leads_count,created_time,expired_time',
        limit: 50
      }
    });

    res.json({ forms: response.data.data });

  } catch (error) {
    console.error('Error fetching forms:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching forms from Facebook' });
  }
});

// @route   POST /api/meta/test-lead
// @desc    Create test lead for development
// @access  Private (Admin)
router.post('/test-lead', [
  verifyToken,
  requireAdmin,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, adName = 'Test Ad', campaignName = 'Test Campaign' } = req.body;

    // Simulate Meta lead data
    const testMetaLead = {
      id: `test_${Date.now()}`,
      created_time: new Date().toISOString(),
      ad_id: 'test_ad_123',
      ad_name: adName,
      adset_id: 'test_adset_123',
      adset_name: 'Test AdSet',
      campaign_id: 'test_campaign_123',
      campaign_name: campaignName,
      form_id: 'test_form_123',
      form_name: 'Test Form',
      field_data: [
        { name: 'email', values: [email] },
        { name: 'phone_number', values: [phone] },
        { name: 'full_name', values: [name] }
      ]
    };

    await processMetaLead(testMetaLead, {});

    res.json({ 
      message: 'Test lead created successfully',
      leadData: testMetaLead
    });

  } catch (error) {
    console.error('Test lead creation error:', error);
    res.status(500).json({ message: 'Error creating test lead' });
  }
});

// @route   GET /api/meta/stats
// @desc    Get Meta leads statistics
// @access  Private
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { source: { $in: ['facebook', 'instagram'] } };
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            source: '$source',
            status: '$status'
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      {
        $group: {
          _id: '$_id.source',
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count',
              avgScore: '$avgScore'
            }
          },
          totalLeads: { $sum: '$count' }
        }
      }
    ]);

    res.json({ stats });

  } catch (error) {
    console.error('Meta stats error:', error);
    res.status(500).json({ message: 'Error fetching Meta statistics' });
  }
});

module.exports = router;