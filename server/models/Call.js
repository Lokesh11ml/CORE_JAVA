const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  // Call identification
  telecaller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  
  // Twilio integration
  twilioCallSid: {
    type: String,
    unique: true,
    sparse: true
  },
  twilioRecordingSid: String,
  
  // Call details
  callType: {
    type: String,
    enum: ['outbound', 'inbound'],
    default: 'outbound'
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'completed', 'busy', 'failed', 'no-answer', 'cancelled'],
    default: 'initiated'
  },
  
  // Timing
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Recording
  recordingUrl: String,
  recordingDuration: Number,
  
  // Call outcome
  outcome: {
    type: String,
    enum: ['connected', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'disconnected'],
    default: 'connected'
  },
  
  // Lead status after call
  leadStatusBefore: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted'],
    default: 'new'
  },
  leadStatusAfter: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted'],
    default: 'new'
  },
  
  // Follow-up scheduling
  nextFollowupDate: Date,
  followupNotes: String,
  
  // Call quality assessment
  callQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  customerSatisfaction: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Call notes and summary
  notes: String,
  summary: String,
  
  // Call purpose
  callPurpose: {
    type: String,
    enum: ['initial_contact', 'follow_up', 'qualification', 'closing', 'support'],
    default: 'initial_contact'
  },
  
  // Call result
  isSuccessful: {
    type: Boolean,
    default: false
  },
  isConverted: {
    type: Boolean,
    default: false
  },
  
  // Call tags
  tags: [String],
  
  // Call location (if available)
  location: {
    city: String,
    state: String,
    country: String
  },
  
  // Call cost (for billing)
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Call metadata
  metadata: {
    deviceType: String,
    networkType: String,
    callDirection: String,
    twilioData: mongoose.Schema.Types.Mixed
  },
  
  // Call flags
  isRecorded: {
    type: Boolean,
    default: true
  },
  isTranscribed: {
    type: Boolean,
    default: false
  },
  transcriptionText: String,
  
  // Call analytics
  analytics: {
    talkTime: Number,
    holdTime: Number,
    transferCount: Number,
    conferenceTime: Number
  }
}, {
  timestamps: true
});

// Indexes for better performance
callSchema.index({ telecaller: 1, startTime: -1 });
callSchema.index({ lead: 1, startTime: -1 });
callSchema.index({ status: 1, startTime: -1 });
callSchema.index({ twilioCallSid: 1 }, { unique: true, sparse: true });
callSchema.index({ nextFollowupDate: 1 });
callSchema.index({ isSuccessful: 1, startTime: -1 });

// Virtual for formatted duration
callSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for call age in minutes
callSchema.virtual('ageInMinutes').get(function() {
  if (!this.startTime) return 0;
  return Math.floor((Date.now() - this.startTime) / (1000 * 60));
});

// Method to calculate call success
callSchema.methods.calculateSuccess = function() {
  const successfulStatuses = ['completed', 'answered'];
  const successfulOutcomes = ['connected', 'voicemail'];
  
  this.isSuccessful = successfulStatuses.includes(this.status) && 
                      successfulOutcomes.includes(this.outcome);
  
  return this.isSuccessful;
};

// Method to update lead status after call
callSchema.methods.updateLeadStatus = async function() {
  try {
    const Lead = mongoose.model('Lead');
    const lead = await Lead.findById(this.lead);
    
    if (!lead) return;
    
    // Update lead status based on call outcome
    switch (this.outcome) {
      case 'connected':
        if (this.leadStatusAfter === 'interested' || this.leadStatusAfter === 'qualified') {
          lead.status = this.leadStatusAfter;
        } else {
          lead.status = 'contacted';
        }
        break;
      case 'no_answer':
      case 'busy':
        lead.status = 'contacted';
        break;
      case 'wrong_number':
        lead.status = 'not_interested';
        break;
      case 'voicemail':
        lead.status = 'contacted';
        break;
    }
    
    // Update last contact date
    lead.lastContactDate = this.endTime || new Date();
    lead.followupCount += 1;
    
    // Set next follow-up date if provided
    if (this.nextFollowupDate) {
      lead.nextFollowupDate = this.nextFollowupDate;
    }
    
    await lead.save();
    
  } catch (error) {
    console.error('Error updating lead status:', error);
  }
};

// Pre-save middleware
callSchema.pre('save', function(next) {
  // Calculate success status
  this.calculateSuccess();
  
  // Calculate duration if end time is set
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  next();
});

// Post-save middleware
callSchema.post('save', async function() {
  // Update lead status after call is saved
  if (this.status === 'completed') {
    await this.updateLeadStatus();
  }
});

// Ensure virtual fields are serialized
callSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Call', callSchema);