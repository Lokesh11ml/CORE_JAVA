const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  // Call basic information
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  telecallerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Call details
  phoneNumber: {
    type: String,
    required: true
  },
  callType: {
    type: String,
    enum: ['outbound', 'inbound'],
    default: 'outbound'
  },
  callPurpose: {
    type: String,
    enum: ['initial_contact', 'follow_up', 'closure', 'support', 'survey', 'other'],
    required: true
  },
  
  // Call timing
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Call status and outcome
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'failed'],
    default: 'scheduled'
  },
  outcome: {
    type: String,
    enum: ['connected', 'no_answer', 'busy', 'invalid_number', 'voicemail', 'callback_requested', 'not_interested', 'interested', 'converted'],
    required: function() { return this.status === 'completed'; }
  },
  
  // Call content and notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  summary: {
    type: String,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  
  // Follow-up information
  nextFollowupDate: Date,
  nextFollowupReason: String,
  
  // Lead status after call
  leadStatusBefore: String,
  leadStatusAfter: String,
  
  // Quality and performance
  callQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  customerSatisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Recording and attachments
  recordingUrl: String,
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  
  // Automated fields
  isSuccessful: {
    type: Boolean,
    default: false
  },
  
  // Supervisor review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  reviewDate: Date,
  reviewRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // System fields
  callSource: {
    type: String,
    enum: ['manual', 'auto_dialer', 'callback', 'inbound'],
    default: 'manual'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  }
}, {
  timestamps: true
});

// Indexes for better performance
callSchema.index({ telecallerId: 1, createdAt: -1 });
callSchema.index({ leadId: 1, createdAt: -1 });
callSchema.index({ startTime: 1 });
callSchema.index({ status: 1, outcome: 1 });
callSchema.index({ nextFollowupDate: 1 });

// Pre-save middleware to calculate duration
callSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  // Determine if call was successful
  if (this.outcome) {
    this.isSuccessful = ['connected', 'interested', 'converted', 'callback_requested'].includes(this.outcome);
  }
  
  next();
});

// Virtual for formatted duration
callSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '00:00';
  
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for call date
callSchema.virtual('callDate').get(function() {
  return this.startTime ? this.startTime.toDateString() : null;
});

// Method to check if call is overdue
callSchema.methods.isOverdue = function() {
  if (!this.nextFollowupDate) return false;
  return this.nextFollowupDate < new Date();
};

// Static method to get call statistics for a user
callSchema.statics.getCallStats = async function(userId, startDate, endDate) {
  const match = { telecallerId: userId };
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        successfulCalls: {
          $sum: { $cond: ['$isSuccessful', 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        averageDuration: { $avg: '$duration' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCalls: 0,
    completedCalls: 0,
    successfulCalls: 0,
    totalDuration: 0,
    averageDuration: 0
  };
};

// Ensure virtual fields are serialized
callSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Call', callSchema);