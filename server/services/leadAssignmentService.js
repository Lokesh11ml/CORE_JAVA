const User = require('../models/User');
const Lead = require('../models/Lead');
const cron = require('node-cron');

class LeadAssignmentService {
  constructor() {
    this.initializeCronJobs();
  }

  // Initialize cron jobs for automated reassignment
  initializeCronJobs() {
    // Check for leads that need reassignment every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.checkForReassignments();
      } catch (error) {
        console.error('Cron job error:', error);
      }
    });

    // Daily cleanup job at 9 AM
    cron.schedule('0 9 * * *', async () => {
      try {
        await this.dailyCleanup();
      } catch (error) {
        console.error('Daily cleanup error:', error);
      }
    });
  }

  // Automatically assign a new lead to the best available telecaller
  async autoAssignLead(leadId) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      // Find available telecallers
      const availableTelecallers = await this.getAvailableTelecallers();
      
      if (availableTelecallers.length === 0) {
        throw new Error('No available telecallers');
      }

      // Find telecaller with least pending leads
      const telecaller = await this.findBestTelecaller(availableTelecallers);
      
      // Assign the lead
      lead.assignedTo = telecaller._id;
      lead.assignedBy = null; // Auto-assigned
      lead.assignedAt = new Date();
      lead.autoAssigned = true;
      
      await lead.save();

      // Emit real-time notification
      if (global.io) {
        global.io.to(`user-${telecaller._id}`).emit('new-lead-assigned', {
          leadId: lead._id,
          leadName: lead.name,
          leadPhone: lead.phone,
          assignedAt: lead.assignedAt
        });
      }

      return {
        success: true,
        telecaller: {
          id: telecaller._id,
          name: telecaller.name
        },
        lead: {
          id: lead._id,
          name: lead.name
        }
      };

    } catch (error) {
      console.error('Auto assignment error:', error);
      throw error;
    }
  }

  // Get available telecallers
  async getAvailableTelecallers() {
    try {
      const telecallers = await User.find({
        role: 'telecaller',
        isActive: true,
        currentStatus: { $in: ['available', 'online'] }
      }).populate('supervisor', 'name');

      return telecallers;
    } catch (error) {
      console.error('Get available telecallers error:', error);
      throw error;
    }
  }

  // Find the best telecaller based on workload and performance
  async findBestTelecaller(telecallers) {
    try {
      let bestTelecaller = null;
      let lowestScore = Infinity;

      for (const telecaller of telecallers) {
        // Get telecaller's current workload
        const pendingLeads = await Lead.countDocuments({
          assignedTo: telecaller._id,
          status: { $in: ['new', 'contacted', 'callback'] }
        });

        // Get telecaller's performance metrics
        const performanceScore = await this.calculatePerformanceScore(telecaller._id);

        // Calculate overall score (lower is better)
        const score = (pendingLeads * 10) + (100 - performanceScore);

        if (score < lowestScore) {
          lowestScore = score;
          bestTelecaller = telecaller;
        }
      }

      return bestTelecaller;
    } catch (error) {
      console.error('Find best telecaller error:', error);
      throw error;
    }
  }

  // Calculate performance score for a telecaller
  async calculatePerformanceScore(telecallerId) {
    try {
      const user = await User.findById(telecallerId);
      if (!user) return 0;

      // Base score from user metrics
      let score = 50;

      // Add conversion rate bonus
      if (user.totalLeads > 0) {
        const conversionRate = (user.convertedLeads / user.totalLeads) * 100;
        score += conversionRate * 0.5; // Max 50 points for conversion
      }

      // Add success rate bonus
      if (user.totalCalls > 0) {
        const successRate = (user.successfulCalls / user.totalCalls) * 100;
        score += successRate * 0.3; // Max 30 points for success rate
      }

      // Add activity bonus (recent activity gets higher score)
      const daysSinceLastActive = Math.floor((Date.now() - user.lastActive) / (1000 * 60 * 60 * 24));
      if (daysSinceLastActive <= 1) score += 20;
      else if (daysSinceLastActive <= 3) score += 10;
      else if (daysSinceLastActive > 7) score -= 20;

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Calculate performance score error:', error);
      return 50; // Default score
    }
  }

  // Check for leads that need reassignment
  async checkForReassignments() {
    try {
      const reassignmentThreshold = 60; // 1 hour in minutes
      const cutoffTime = new Date(Date.now() - (reassignmentThreshold * 60 * 1000));

      // Find leads that haven't been contacted within threshold
      const leadsToReassign = await Lead.find({
        status: { $in: ['new', 'contacted'] },
        assignedAt: { $lt: cutoffTime },
        lastContactDate: { $exists: false },
        reassignmentCount: { $lt: 3 } // Max 3 reassignments
      }).populate('assignedTo', 'name role');

      for (const lead of leadsToReassign) {
        await this.reassignLead(lead._id);
      }

      console.log(`Reassigned ${leadsToReassign.length} leads`);
    } catch (error) {
      console.error('Check for reassignments error:', error);
    }
  }

  // Reassign a specific lead
  async reassignLead(leadId) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) return;

      const currentTelecaller = lead.assignedTo;
      const availableTelecallers = await this.getAvailableTelecallers();
      
      // Filter out current telecaller
      const otherTelecallers = availableTelecallers.filter(
        t => t._id.toString() !== currentTelecaller.toString()
      );

      if (otherTelecallers.length === 0) {
        console.log('No other telecallers available for reassignment');
        return;
      }

      // Find best alternative telecaller
      const newTelecaller = await this.findBestTelecaller(otherTelecallers);
      
      if (newTelecaller) {
        lead.assignedTo = newTelecaller._id;
        lead.assignedAt = new Date();
        lead.reassignmentCount += 1;
        
        await lead.save();

        // Notify new telecaller
        if (global.io) {
          global.io.to(`user-${newTelecaller._id}`).emit('lead-reassigned', {
            leadId: lead._id,
            leadName: lead.name,
            reassignedAt: lead.assignedAt
          });
        }

        console.log(`Lead ${lead.name} reassigned from ${currentTelecaller} to ${newTelecaller.name}`);
      }
    } catch (error) {
      console.error('Reassign lead error:', error);
    }
  }

  // Manual assignment by admin/supervisor
  async manualAssignLead(leadId, telecallerId, assignedBy) {
    try {
      const lead = await Lead.findById(leadId);
      const telecaller = await User.findById(telecallerId);

      if (!lead || !telecaller) {
        throw new Error('Lead or telecaller not found');
      }

      if (telecaller.role !== 'telecaller') {
        throw new Error('Can only assign to telecallers');
      }

      lead.assignedTo = telecallerId;
      lead.assignedBy = assignedBy;
      lead.assignedAt = new Date();
      lead.autoAssigned = false;

      await lead.save();

      // Notify telecaller
      if (global.io) {
        global.io.to(`user-${telecallerId}`).emit('new-lead-assigned', {
          leadId: lead._id,
          leadName: lead.name,
          leadPhone: lead.phone,
          assignedAt: lead.assignedAt,
          manuallyAssigned: true
        });
      }

      return {
        success: true,
        lead: lead,
        telecaller: telecaller
      };

    } catch (error) {
      console.error('Manual assignment error:', error);
      throw error;
    }
  }

  // Get assignment statistics
  async getAssignmentStats() {
    try {
      const stats = {
        totalLeads: await Lead.countDocuments(),
        assignedLeads: await Lead.countDocuments({ assignedTo: { $exists: true } }),
        unassignedLeads: await Lead.countDocuments({ assignedTo: { $exists: false } }),
        autoAssignedLeads: await Lead.countDocuments({ autoAssigned: true }),
        manuallyAssignedLeads: await Lead.countDocuments({ autoAssigned: false }),
        reassignedLeads: await Lead.countDocuments({ reassignmentCount: { $gt: 0 } })
      };

      return stats;
    } catch (error) {
      console.error('Get assignment stats error:', error);
      throw error;
    }
  }

  // Daily cleanup tasks
  async dailyCleanup() {
    try {
      // Reset daily counters
      await User.updateMany(
        { role: 'telecaller' },
        { 
          $set: { 
            dailyCalls: 0,
            dailyLeads: 0,
            dailyConversions: 0
          }
        }
      );

      // Archive old leads
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      await Lead.updateMany(
        { 
          createdAt: { $lt: thirtyDaysAgo },
          status: { $in: ['converted', 'closed'] }
        },
        { $set: { isActive: false } }
      );

      console.log('Daily cleanup completed');
    } catch (error) {
      console.error('Daily cleanup error:', error);
    }
  }
}

module.exports = new LeadAssignmentService();