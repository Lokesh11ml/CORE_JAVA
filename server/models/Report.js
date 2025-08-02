const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Report identification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report details
  reportDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  
  // Call metrics
  totalCalls: {
    type: Number,
    default: 0,
    min: 0
  },
  completedCalls: {
    type: Number,
    default: 0,
    min: 0
  },
  successfulCalls: {
    type: Number,
    default: 0,
    min: 0
  },
  missedCalls: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCallDuration: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  averageCallDuration: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  
  // Lead metrics
  newLeads: {
    type: Number,
    default: 0,
    min: 0
  },
  contactedLeads: {
    type: Number,
    default: 0,
    min: 0
  },
  qualifiedLeads: {
    type: Number,
    default: 0,
    min: 0
  },
  interestedLeads: {
    type: Number,
    default: 0,
    min: 0
  },
  convertedLeads: {
    type: Number,
    default: 0,
    min: 0
  },
  followUpsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  followUpsScheduled: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Performance metrics
  connectionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Work metrics
  startTime: {
    type: String,
    default: '09:00'
  },
  endTime: {
    type: String,
    default: '18:00'
  },
  totalWorkHours: {
    type: Number,
    default: 8,
    min: 0
  },
  breakTime: {
    type: Number, // in minutes
    default: 60,
    min: 0
  },
  productiveHours: {
    type: Number,
    default: 7,
    min: 0
  },
  
  // Activities breakdown
  activities: [{
    time: {
      type: String,
      required: true
    },
    activity: {
      type: String,
      required: true,
      enum: ['login', 'call_campaign', 'follow_up', 'lead_qualification', 'report_submission', 'break', 'training', 'meeting', 'other']
    },
    description: {
      type: String,
      maxlength: 500
    },
    outcome: {
      type: String,
      maxlength: 200
    },
    duration: {
      type: Number, // in minutes
      default: 0,
      min: 0
    },
    leadsContacted: {
      type: Number,
      default: 0,
      min: 0
    },
    callsMade: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  
  // Targets and achievements
  targets: {
    callTarget: {
      type: Number,
      default: 30,
      min: 0
    },
    leadTarget: {
      type: Number,
      default: 20,
      min: 0
    },
    conversionTarget: {
      type: Number,
      default: 3,
      min: 0
    },
    revenueTarget: {
      type: Number,
      default: 50000,
      min: 0
    }
  },
  achievements: {
    callsAchieved: {
      type: Number,
      default: 0,
      min: 0
    },
    leadsAchieved: {
      type: Number,
      default: 0,
      min: 0
    },
    conversionsAchieved: {
      type: Number,
      default: 0,
      min: 0
    },
    revenueAchieved: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Report content
  notes: {
    type: String,
    maxlength: 2000
  },
  challenges: {
    type: String,
    maxlength: 1000
  },
  improvements: {
    type: String,
    maxlength: 1000
  },
  blockers: {
    type: String,
    maxlength: 1000
  },
  
  // Daily specific fields
  dailyNotes: {
    type: String,
    maxlength: 1000
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor', 'terrible'],
    default: 'good'
  },
  energy: {
    type: Number,
    min: 1,
    max: 10,
    default: 7
  },
  
  // Report status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    default: 'draft'
  },
  
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String,
    maxlength: 1000
  },
  reviewDate: Date,
  reviewRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Goals and KPIs
  goals: {
    dailyCalls: {
      type: Number,
      default: 30
    },
    dailyLeads: {
      type: Number,
      default: 10
    },
    dailyConversions: {
      type: Number,
      default: 2
    },
    qualityScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100
    }
  },
  
  // Quality metrics
  qualityMetrics: {
    callQuality: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    customerSatisfaction: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    followUpRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseTime: {
      type: Number, // in minutes
      default: 0,
      min: 0
    }
  },
  
  // System fields
  isAutoGenerated: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Tags for categorization
  tags: [String],
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Indexes for better performance
reportSchema.index({ user: 1, reportDate: -1 });
reportSchema.index({ reportDate: 1 });
reportSchema.index({ status: 1, reportDate: -1 });
reportSchema.index({ reportType: 1, reportDate: -1 });
reportSchema.index({ reviewedBy: 1, reportDate: -1 });

// Virtual for achievement percentage
reportSchema.virtual('achievementPercentage').get(function() {
  if (this.targets.callTarget === 0) return 0;
  return Math.round((this.achievements.callsAchieved / this.targets.callTarget) * 100);
});

// Virtual for conversion rate
reportSchema.virtual('calculatedConversionRate').get(function() {
  if (this.contactedLeads === 0) return 0;
  return Math.round((this.convertedLeads / this.contactedLeads) * 100);
});

// Virtual for success rate
reportSchema.virtual('calculatedSuccessRate').get(function() {
  if (this.totalCalls === 0) return 0;
  return Math.round((this.successfulCalls / this.totalCalls) * 100);
});

// Virtual for connection rate
reportSchema.virtual('calculatedConnectionRate').get(function() {
  if (this.totalCalls === 0) return 0;
  return Math.round((this.completedCalls / this.totalCalls) * 100);
});

// Method to calculate metrics
reportSchema.methods.calculateMetrics = function() {
  // Calculate rates
  this.connectionRate = this.calculatedConnectionRate;
  this.conversionRate = this.calculatedConversionRate;
  this.successRate = this.calculatedSuccessRate;
  
  // Calculate average call duration
  if (this.completedCalls > 0) {
    this.averageCallDuration = Math.round(this.totalCallDuration / this.completedCalls);
  }
  
  // Calculate achievements
  this.achievements.callsAchieved = this.totalCalls;
  this.achievements.leadsAchieved = this.contactedLeads;
  this.achievements.conversionsAchieved = this.convertedLeads;
  
  return this;
};

// Method to add activity
reportSchema.methods.addActivity = function(activity) {
  this.activities.push(activity);
  this.lastUpdated = new Date();
  return this;
};

// Method to check if report is overdue
reportSchema.methods.isOverdue = function() {
  const today = new Date();
  const reportDay = new Date(this.reportDate);
  
  // For daily reports, check if it's more than 1 day old
  if (this.reportType === 'daily') {
    const diffTime = today - reportDay;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 1 && this.status === 'draft';
  }
  
  return false;
};

// Static method to get report statistics
reportSchema.statics.getReportStats = async function(userId, startDate, endDate) {
  const match = { user: userId };
  if (startDate && endDate) {
    match.reportDate = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalCalls: { $sum: '$totalCalls' },
        totalLeads: { $sum: '$contactedLeads' },
        totalConversions: { $sum: '$convertedLeads' },
        avgConnectionRate: { $avg: '$connectionRate' },
        avgConversionRate: { $avg: '$conversionRate' },
        avgSuccessRate: { $avg: '$successRate' },
        totalWorkHours: { $sum: '$totalWorkHours' }
      }
    }
  ]);
  
  return stats[0] || {
    totalReports: 0,
    totalCalls: 0,
    totalLeads: 0,
    totalConversions: 0,
    avgConnectionRate: 0,
    avgConversionRate: 0,
    avgSuccessRate: 0,
    totalWorkHours: 0
  };
};

// Pre-save middleware
reportSchema.pre('save', function(next) {
  // Calculate metrics before saving
  this.calculateMetrics();
  
  // Update last updated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Ensure virtual fields are serialized
reportSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);