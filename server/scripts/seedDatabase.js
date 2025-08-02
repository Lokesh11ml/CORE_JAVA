const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Report = require('../models/Report');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telecaller-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@telecaller.com',
    password: 'admin123',
    role: 'admin',
    department: 'management',
    phone: '9876543210',
    isActive: true
  },
  {
    name: 'John Supervisor',
    email: 'supervisor@telecaller.com',
    password: 'supervisor123',
    role: 'supervisor',
    department: 'sales',
    phone: '9876543211',
    isActive: true
  },
  {
    name: 'Alice Johnson',
    email: 'alice@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'lead_generation',
    phone: '9876543212',
    isActive: true,
    supervisor: null // Will be set after supervisor is created
  },
  {
    name: 'Bob Smith',
    email: 'bob@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'follow_up',
    phone: '9876543213',
    isActive: true,
    supervisor: null
  },
  {
    name: 'Carol Davis',
    email: 'carol@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'lead_generation',
    phone: '9876543214',
    isActive: true,
    supervisor: null
  }
];

const sampleLeads = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    source: 'facebook',
    status: 'new',
    priority: 'high',
    quality: 'hot',
    requirements: 'Looking for software development services',
    notes: 'Interested in custom software development'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '9876543211',
    source: 'manual',
    status: 'contacted',
    priority: 'medium',
    quality: 'warm',
    requirements: 'Need marketing consultation',
    notes: 'Follow up scheduled for next week'
  },
  {
    name: 'Mike Wilson',
    email: 'mike.wilson@example.com',
    phone: '9876543212',
    source: 'instagram',
    status: 'qualified',
    priority: 'high',
    quality: 'hot',
    requirements: 'E-commerce website development',
    notes: 'Budget: $50,000 - $100,000'
  },
  {
    name: 'Sarah Brown',
    email: 'sarah.brown@example.com',
    phone: '9876543213',
    source: 'website',
    status: 'interested',
    priority: 'medium',
    quality: 'warm',
    requirements: 'Mobile app development',
    notes: 'iOS and Android app needed'
  },
  {
    name: 'David Lee',
    email: 'david.lee@example.com',
    phone: '9876543214',
    source: 'facebook',
    status: 'new',
    priority: 'low',
    quality: 'cold',
    requirements: 'General inquiry',
    notes: 'Just gathering information'
  },
  {
    name: 'Lisa Garcia',
    email: 'lisa.garcia@example.com',
    phone: '9876543215',
    source: 'manual',
    status: 'contacted',
    priority: 'high',
    quality: 'hot',
    requirements: 'Digital marketing services',
    notes: 'Urgent need for marketing campaign'
  },
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@example.com',
    phone: '9876543216',
    source: 'instagram',
    status: 'new',
    priority: 'medium',
    quality: 'warm',
    requirements: 'SEO optimization',
    notes: 'Website needs better search ranking'
  },
  {
    name: 'Emma Taylor',
    email: 'emma.taylor@example.com',
    phone: '9876543217',
    source: 'website',
    status: 'qualified',
    priority: 'high',
    quality: 'hot',
    requirements: 'Custom CRM development',
    notes: 'Large enterprise client'
  }
];

const sampleCalls = [
  {
    callType: 'outbound',
    status: 'completed',
    duration: 300, // 5 minutes
    notes: 'Customer showed interest in our services'
  },
  {
    callType: 'outbound',
    status: 'completed',
    duration: 180, // 3 minutes
    notes: 'Customer requested more information'
  },
  {
    callType: 'outbound',
    status: 'no-answer',
    duration: 0,
    notes: 'No answer, will try again later'
  },
  {
    callType: 'outbound',
    status: 'completed',
    duration: 600, // 10 minutes
    notes: 'Detailed discussion about project requirements'
  }
];

const sampleReports = [
  {
    reportDate: new Date(),
    reportType: 'daily',
    totalCalls: 15,
    completedCalls: 12,
    followUpsCompleted: 8,
    convertedLeads: 2,
    dailyNotes: 'Good day overall, converted 2 leads. Need to follow up with 3 prospects tomorrow.'
  },
  {
    reportDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    reportType: 'daily',
    totalCalls: 12,
    completedCalls: 10,
    followUpsCompleted: 6,
    convertedLeads: 1,
    dailyNotes: 'Moderate day, one conversion. Several prospects need follow-up.'
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Call.deleteMany({});
    await Report.deleteMany({});

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name} (${user.email})`);
    }

    // Update supervisor references for telecallers
    const supervisor = createdUsers.find(u => u.role === 'supervisor');
    const telecallers = createdUsers.filter(u => u.role === 'telecaller');
    
    for (const telecaller of telecallers) {
      telecaller.supervisor = supervisor._id;
      await telecaller.save();
    }

    // Update supervisor's team members
    supervisor.teamMembers = telecallers.map(t => t._id);
    await supervisor.save();

    // Create leads
    console.log('Creating leads...');
    const createdLeads = [];
    
    for (const leadData of sampleLeads) {
      // Assign leads to telecallers
      const randomTelecaller = telecallers[Math.floor(Math.random() * telecallers.length)];
      
      const lead = new Lead({
        ...leadData,
        assignedTo: randomTelecaller._id,
        assignedAt: new Date(),
        autoAssigned: true
      });
      
      await lead.save();
      createdLeads.push(lead);
      console.log(`Created lead: ${lead.name} assigned to ${randomTelecaller.name}`);
    }

    // Create sample calls
    console.log('Creating sample calls...');
    for (let i = 0; i < sampleCalls.length; i++) {
      const callData = sampleCalls[i];
      const randomTelecaller = telecallers[Math.floor(Math.random() * telecallers.length)];
      const randomLead = createdLeads[Math.floor(Math.random() * createdLeads.length)];
      
      const call = new Call({
        ...callData,
        telecaller: randomTelecaller._id,
        lead: randomLead._id,
        startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
        endTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + callData.duration * 1000)
      });
      
      await call.save();
      console.log(`Created call: ${callData.status} call by ${randomTelecaller.name}`);
    }

    // Create sample reports
    console.log('Creating sample reports...');
    for (const reportData of sampleReports) {
      const randomTelecaller = telecallers[Math.floor(Math.random() * telecallers.length)];
      
      const report = new Report({
        ...reportData,
        user: randomTelecaller._id
      });
      
      await report.save();
      console.log(`Created report for ${randomTelecaller.name} on ${reportData.reportDate.toDateString()}`);
    }

    // Update user performance metrics
    console.log('Updating user performance metrics...');
    for (const telecaller of telecallers) {
      const calls = await Call.find({ telecaller: telecaller._id });
      const leads = await Lead.find({ assignedTo: telecaller._id });
      
      const completedCalls = calls.filter(c => c.status === 'completed');
      const convertedLeads = leads.filter(l => l.status === 'converted');
      
      telecaller.totalCalls = calls.length;
      telecaller.successfulCalls = completedCalls.length;
      telecaller.totalLeads = leads.length;
      telecaller.convertedLeads = convertedLeads.length;
      
      await telecaller.save();
      console.log(`Updated metrics for ${telecaller.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${createdUsers.length} users`);
    console.log(`- Created ${createdLeads.length} leads`);
    console.log(`- Created ${sampleCalls.length} sample calls`);
    console.log(`- Created ${sampleReports.length} sample reports`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('Admin: admin@telecaller.com / admin123');
    console.log('Supervisor: supervisor@telecaller.com / supervisor123');
    console.log('Telecallers: alice@telecaller.com, bob@telecaller.com, carol@telecaller.com / telecaller123');
    
    console.log('\n🚀 You can now start the application with: npm run dev');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;