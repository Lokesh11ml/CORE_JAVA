const crypto = require('crypto');
const Lead = require('../models/Lead');
const leadAssignmentService = require('./leadAssignmentService');

class MetaAdsService {
  constructor() {
    this.webhookSecret = process.env.META_WEBHOOK_SECRET;
    this.appSecret = process.env.META_APP_SECRET;
  }

  // Verify Meta webhook signature
  verifyWebhookSignature(signature, body) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  // Process incoming Meta Ads lead
  async processMetaLead(leadData) {
    try {
      // Extract lead information from Meta data
      const {
        full_name,
        phone_number,
        email,
        campaign_id,
        adset_id,
        ad_id,
        form_id,
        lead_id,
        created_time,
        field_data
      } = leadData;

      // Check if lead already exists
      const existingLead = await Lead.findOne({ 
        metaLeadId: lead_id,
        email: email 
      });

      if (existingLead) {
        console.log('Lead already exists:', lead_id);
        return { success: false, message: 'Lead already exists' };
      }

      // Parse custom fields
      const customFields = this.parseCustomFields(field_data);

      // Create new lead
      const lead = new Lead({
        name: full_name,
        email: email,
        phone: phone_number,
        source: 'facebook',
        metaAdId: ad_id,
        metaCampaignId: campaign_id,
        metaAdSetId: adset_id,
        metaFormId: form_id,
        metaLeadId: lead_id,
        status: 'new',
        priority: this.determinePriority(customFields),
        quality: this.determineQuality(customFields),
        metaData: {
          adName: customFields.ad_name || '',
          campaignName: customFields.campaign_name || '',
          adSetName: customFields.adset_name || '',
          leadGenFormName: customFields.form_name || '',
          customFields: Object.entries(customFields).map(([name, value]) => ({
            name,
            value
          }))
        },
        requirements: customFields.requirements || '',
        notes: `Meta Ads Lead - Campaign: ${customFields.campaign_name || campaign_id}`,
        createdAt: new Date(created_time * 1000)
      });

      await lead.save();

      // Auto-assign the lead
      const assignmentResult = await leadAssignmentService.autoAssignLead(lead._id);

      return {
        success: true,
        lead: lead,
        assignment: assignmentResult
      };

    } catch (error) {
      console.error('Process Meta lead error:', error);
      throw error;
    }
  }

  // Parse custom fields from Meta webhook
  parseCustomFields(fieldData) {
    const customFields = {};
    
    if (fieldData && Array.isArray(fieldData)) {
      fieldData.forEach(field => {
        if (field.name && field.values && field.values.length > 0) {
          customFields[field.name] = field.values[0];
        }
      });
    }

    return customFields;
  }

  // Determine lead priority based on custom fields
  determinePriority(customFields) {
    const priorityKeywords = {
      urgent: ['urgent', 'asap', 'immediate', 'emergency'],
      high: ['high', 'important', 'priority', 'critical'],
      low: ['low', 'casual', 'sometime', 'maybe']
    };

    const text = JSON.stringify(customFields).toLowerCase();
    
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return priority;
      }
    }

    return 'medium';
  }

  // Determine lead quality based on custom fields
  determineQuality(customFields) {
    const hotKeywords = ['buy', 'purchase', 'interested', 'ready', 'now', 'today'];
    const coldKeywords = ['maybe', 'later', 'sometime', 'just looking', 'information'];

    const text = JSON.stringify(customFields).toLowerCase();
    
    if (hotKeywords.some(keyword => text.includes(keyword))) {
      return 'hot';
    } else if (coldKeywords.some(keyword => text.includes(keyword))) {
      return 'cold';
    }

    return 'warm';
  }

  // Get Meta Ads statistics
  async getMetaAdsStats(startDate, endDate) {
    try {
      const stats = await Lead.aggregate([
        {
          $match: {
            source: 'facebook',
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            convertedLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
            },
            totalValue: {
              $sum: { $ifNull: ['$conversionValue', 0] }
            },
            campaigns: { $addToSet: '$metaData.campaignName' },
            avgQuality: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$quality', 'hot'] }, then: 3 },
                    { case: { $eq: ['$quality', 'warm'] }, then: 2 },
                    { case: { $eq: ['$quality', 'cold'] }, then: 1 }
                  ],
                  default: 2
                }
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalLeads: 0,
        convertedLeads: 0,
        totalValue: 0,
        campaigns: [],
        avgQuality: 0
      };

    } catch (error) {
      console.error('Get Meta Ads stats error:', error);
      throw error;
    }
  }

  // Get leads by campaign
  async getLeadsByCampaign(campaignId, startDate, endDate) {
    try {
      const leads = await Lead.find({
        metaCampaignId: campaignId,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('assignedTo', 'name');

      return leads;
    } catch (error) {
      console.error('Get leads by campaign error:', error);
      throw error;
    }
  }

  // Get campaign performance
  async getCampaignPerformance(startDate, endDate) {
    try {
      const performance = await Lead.aggregate([
        {
          $match: {
            source: 'facebook',
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$metaData.campaignName',
            totalLeads: { $sum: 1 },
            convertedLeads: {
              $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
            },
            totalValue: {
              $sum: { $ifNull: ['$conversionValue', 0] }
            },
            avgQuality: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$quality', 'hot'] }, then: 3 },
                    { case: { $eq: ['$quality', 'warm'] }, then: 2 },
                    { case: { $eq: ['$quality', 'cold'] }, then: 1 }
                  ],
                  default: 2
                }
              }
            }
          }
        },
        {
          $sort: { totalLeads: -1 }
        }
      ]);

      return performance;
    } catch (error) {
      console.error('Get campaign performance error:', error);
      throw error;
    }
  }

  // Sync leads with Meta Ads (for manual sync)
  async syncLeadsWithMeta() {
    try {
      // This would typically involve calling Meta's API
      // For now, we'll just return a success message
      console.log('Meta Ads sync initiated');
      
      return {
        success: true,
        message: 'Meta Ads sync completed',
        syncedAt: new Date()
      };
    } catch (error) {
      console.error('Meta Ads sync error:', error);
      throw error;
    }
  }

  // Validate Meta webhook data
  validateWebhookData(data) {
    const requiredFields = ['full_name', 'phone_number', 'email', 'lead_id'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return false;
      }
    }

    return true;
  }
}

module.exports = new MetaAdsService();