const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'telecaller'],
    default: 'telecaller'
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['sales', 'marketing', 'support', 'lead_generation', 'follow_up']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  // Performance metrics
  totalCalls: {
    type: Number,
    default: 0
  },
  successfulCalls: {
    type: Number,
    default: 0
  },
  totalLeads: {
    type: Number,
    default: 0
  },
  convertedLeads: {
    type: Number,
    default: 0
  },
  // Availability status
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentStatus: {
    type: String,
    enum: ['available', 'busy', 'break', 'offline'],
    default: 'offline'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Preferences
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '18:00'
    }
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  // Supervisor assignment (for telecallers)
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Team members (for supervisors)
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ department: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate success rate
userSchema.virtual('successRate').get(function() {
  if (this.totalCalls === 0) return 0;
  return Math.round((this.successfulCalls / this.totalCalls) * 100);
});

// Calculate conversion rate
userSchema.virtual('conversionRate').get(function() {
  if (this.totalLeads === 0) return 0;
  return Math.round((this.convertedLeads / this.totalLeads) * 100);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);