const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Lead basic information
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  location: {
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  
  // Lead source and Meta information
  source: {
    type: String,
    enum: ['facebook', 'instagram', 'manual', 'website', 'referral', 'other'],
    required: true
  },
  metaAdId: String,
  metaCampaignId: String,
  metaAdSetId: String,
  metaFormId: String,
  metaLeadId: String,
  
  // Lead qualification
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'interested', 'not_interested', 'callback', 'converted', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  quality: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'warm'
  },
  
  // Assignment and ownership
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  
  // Lead details
  product: String,
  service: String,
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  requirements: String,
  notes: String,
  
  // Interaction tracking
  lastContactDate: Date,
  nextFollowupDate: Date,
  followupCount: {
    type: Number,
    default: 0
  },
  
  // Lead scoring
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Tags and categories
  tags: [String],
  category: String,
  
  // Conversion tracking
  isConverted: {
    type: Boolean,
    default: false
  },
  conversionDate: Date,
  conversionValue: Number,
  
  // Meta-specific data
  metaData: {
    adName: String,
    campaignName: String,
    adSetName: String,
    leadGenFormName: String,
    customFields: [{
      name: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Auto-assignment settings
  autoAssigned: {
    type: Boolean,
    default: false
  },
  reassignmentCount: {
    type: Number,
    default: 0
  },
  
  // Lead lifecycle
  isActive: {
    type: Boolean,
    default: true
  },
  closedReason: String,
  closedDate: Date
}, {
  timestamps: true
});

// Indexes for better performance
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ source: 1, createdAt: -1 });
leadSchema.index({ metaLeadId: 1 }, { unique: true, sparse: true });
leadSchema.index({ email: 1, phone: 1 });
leadSchema.index({ nextFollowupDate: 1 });
leadSchema.index({ status: 1, priority: 1 });

// Virtual for lead age in days
leadSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time since last contact
leadSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContactDate) return null;
  return Math.floor((Date.now() - this.lastContactDate) / (1000 * 60 * 60 * 24));
});

// Method to calculate lead score based on various factors
leadSchema.methods.calculateScore = function() {
  let score = 50; // Base score
  
  // Age factor (newer leads get higher score)
  const ageInDays = this.ageInDays;
  if (ageInDays <= 1) score += 20;
  else if (ageInDays <= 3) score += 15;
  else if (ageInDays <= 7) score += 10;
  else if (ageInDays <= 14) score += 5;
  else score -= 10;
  
  // Source factor
  if (this.source === 'facebook' || this.source === 'instagram') score += 10;
  
  // Status factor
  if (this.status === 'interested') score += 15;
  else if (this.status === 'qualified') score += 20;
  else if (this.status === 'callback') score += 10;
  else if (this.status === 'not_interested') score -= 20;
  
  // Priority factor
  if (this.priority === 'urgent') score += 15;
  else if (this.priority === 'high') score += 10;
  else if (this.priority === 'low') score -= 5;
  
  // Follow-up factor
  if (this.followupCount > 5) score -= 10;
  
  this.score = Math.max(0, Math.min(100, score));
  return this.score;
};

// Ensure virtual fields are serialized
leadSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lead', leadSchema);