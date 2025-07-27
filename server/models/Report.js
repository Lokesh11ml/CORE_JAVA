const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Report basic information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  
  // Call metrics
  callMetrics: {
    totalCalls: {
      type: Number,
      default: 0
    },
    completedCalls: {
      type: Number,
      default: 0
    },
    missedCalls: {
      type: Number,
      default: 0
    },
    successfulCalls: {
      type: Number,
      default: 0
    },
    totalCallDuration: {
      type: Number, // in seconds
      default: 0
    },
    averageCallDuration: {
      type: Number, // in seconds
      default: 0
    }
  },
  
  // Lead metrics
  leadMetrics: {
    newLeads: {
      type: Number,
      default: 0
    },
    contactedLeads: {
      type: Number,
      default: 0
    },
    qualifiedLeads: {
      type: Number,
      default: 0
    },
    interestedLeads: {
      type: Number,
      default: 0
    },
    convertedLeads: {
      type: Number,
      default: 0
    },
    followupsScheduled: {
      type: Number,
      default: 0
    },
    followupsCompleted: {
      type: Number,
      default: 0
    }
  },
  
  // Performance metrics
  performanceMetrics: {
    connectionRate: {
      type: Number, // percentage
      default: 0
    },
    conversionRate: {
      type: Number, // percentage
      default: 0
    },
    leadResponseTime: {
      type: Number, // average time in minutes
      default: 0
    },
    customerSatisfactionAvg: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  
  // Work hours and productivity
  workMetrics: {
    startTime: String,
    endTime: String,
    totalWorkHours: {
      type: Number, // in hours
      default: 0
    },
    breakTime: {
      type: Number, // in minutes
      default: 0
    },
    productiveHours: {
      type: Number, // in hours
      default: 0
    }
  },
  
  // Daily tasks and activities
  activities: [{
    time: String,
    activity: String,
    description: String,
    outcome: String,
    duration: Number // in minutes
  }],
  
  // Goals and targets
  targets: {
    callTarget: Number,
    leadTarget: Number,
    conversionTarget: Number,
    revenueTarget: Number
  },
  
  achievements: {
    callsAchieved: Number,
    leadsAchieved: Number,
    conversionsAchieved: Number,
    revenueAchieved: Number
  },
  
  // Notes and observations
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  challenges: {
    type: String,
    maxlength: [500, 'Challenges cannot exceed 500 characters']
  },
  improvements: {
    type: String,
    maxlength: [500, 'Improvements cannot exceed 500 characters']
  },
  
  // Supervisor review
  supervisorReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewDate: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    recommendations: String
  },
  
  // Report status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved'],
    default: 'draft'
  },
  submittedAt: Date,
  
  // Export information
  exports: [{
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv']
    },
    exportedAt: Date,
    exportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadUrl: String
  }]
}, {
  timestamps: true
});

// Compound index to ensure one report per user per date
reportSchema.index({ userId: 1, reportDate: 1 }, { unique: true });
reportSchema.index({ reportDate: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to calculate performance metrics
reportSchema.pre('save', function(next) {
  // Calculate connection rate
  if (this.callMetrics.totalCalls > 0) {
    this.performanceMetrics.connectionRate = Math.round(
      (this.callMetrics.completedCalls / this.callMetrics.totalCalls) * 100
    );
  }
  
  // Calculate conversion rate
  if (this.leadMetrics.contactedLeads > 0) {
    this.performanceMetrics.conversionRate = Math.round(
      (this.leadMetrics.convertedLeads / this.leadMetrics.contactedLeads) * 100
    );
  }
  
  // Calculate average call duration
  if (this.callMetrics.completedCalls > 0) {
    this.callMetrics.averageCallDuration = Math.round(
      this.callMetrics.totalCallDuration / this.callMetrics.completedCalls
    );
  }
  
  // Set submitted timestamp
  if (this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  next();
});

// Virtual for target achievement percentage
reportSchema.virtual('targetAchievement').get(function() {
  const achievements = {};
  
  if (this.targets.callTarget > 0) {
    achievements.calls = Math.round((this.achievements.callsAchieved / this.targets.callTarget) * 100);
  }
  
  if (this.targets.leadTarget > 0) {
    achievements.leads = Math.round((this.achievements.leadsAchieved / this.targets.leadTarget) * 100);
  }
  
  if (this.targets.conversionTarget > 0) {
    achievements.conversions = Math.round((this.achievements.conversionsAchieved / this.targets.conversionTarget) * 100);
  }
  
  return achievements;
});

// Virtual for formatted work hours
reportSchema.virtual('formattedWorkHours').get(function() {
  const hours = Math.floor(this.workMetrics.totalWorkHours);
  const minutes = Math.round((this.workMetrics.totalWorkHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Static method to generate team report
reportSchema.statics.generateTeamReport = async function(teamIds, startDate, endDate) {
  const match = {
    userId: { $in: teamIds },
    reportDate: { $gte: startDate, $lte: endDate },
    status: { $in: ['submitted', 'reviewed', 'approved'] }
  };
  
  const teamStats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalCalls: { $sum: '$callMetrics.totalCalls' },
        totalLeads: { $sum: '$leadMetrics.newLeads' },
        totalConversions: { $sum: '$leadMetrics.convertedLeads' },
        avgConnectionRate: { $avg: '$performanceMetrics.connectionRate' },
        avgConversionRate: { $avg: '$performanceMetrics.conversionRate' },
        totalWorkHours: { $sum: '$workMetrics.totalWorkHours' }
      }
    }
  ]);
  
  return teamStats[0] || {};
};

// Method to check if report is editable
reportSchema.methods.isEditable = function() {
  return this.status === 'draft';
};

// Ensure virtual fields are serialized
reportSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);