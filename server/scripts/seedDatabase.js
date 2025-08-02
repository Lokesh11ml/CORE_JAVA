const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Report = require('../models/Report');

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
    name: 'Supervisor John',
    email: 'supervisor@telecaller.com',
    password: 'supervisor123',
    role: 'supervisor',
    department: 'sales',
    phone: '9876543211',
    isActive: true
  },
  {
    name: 'Telecaller Alice',
    email: 'alice@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'lead_generation',
    phone: '9876543212',
    isActive: true
  },
  {
    name: 'Telecaller Bob',
    email: 'bob@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'follow_up',
    phone: '9876543213',
    isActive: true
  },
  {
    name: 'Telecaller Carol',
    email: 'carol@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'lead_generation',
    phone: '9876543214',
    isActive: true
  }
];

const sampleLeads = [
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '9876543215',
    source: 'facebook',
    status: 'new',
    priority: 'high',
    quality: 'hot',
    product: 'Premium Package',
    requirements: 'Looking for premium service package',
    notes: 'Interested in premium features',
    metaData: {
      adName: 'Premium Campaign',
      campaignName: 'Q4 Premium Sales',
      leadGenFormName: 'Premium Lead Form'
    }
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '9876543216',
    source: 'instagram',
    status: 'contacted',
    priority: 'medium',
    quality: 'warm',
    product: 'Basic Package',
    requirements: 'Basic service requirements',
    notes: 'Follow up scheduled for tomorrow',
    metaData: {
      adName: 'Basic Campaign',
      campaignName: 'Q4 Basic Sales',
      leadGenFormName: 'Basic Lead Form'
    }
  },
  {
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '9876543217',
    source: 'manual',
    status: 'qualified',
    priority: 'urgent',
    quality: 'hot',
    product: 'Enterprise Package',
    requirements: 'Enterprise level solution needed',
    notes: 'High value prospect, immediate attention required',
    metaData: {
      adName: 'Enterprise Campaign',
      campaignName: 'Q4 Enterprise Sales',
      leadGenFormName: 'Enterprise Lead Form'
    }
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '9876543218',
    source: 'website',
    status: 'interested',
    priority: 'high',
    quality: 'warm',
    product: 'Standard Package',
    requirements: 'Standard service package',
    notes: 'Very interested, ready to proceed',
    metaData: {
      adName: 'Standard Campaign',
      campaignName: 'Q4 Standard Sales',
      leadGenFormName: 'Standard Lead Form'
    }
  },
  {
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '9876543219',
    source: 'facebook',
    status: 'new',
    priority: 'low',
    quality: 'cold',
    product: 'Basic Package',
    requirements: 'Basic information only',
    notes: 'Initial contact made, needs more information',
    metaData: {
      adName: 'Basic Campaign',
      campaignName: 'Q4 Basic Sales',
      leadGenFormName: 'Basic Lead Form'
    }
  }
];

const sampleCalls = [
  {
    phoneNumber: '9876543215',
    callType: 'outbound',
    callPurpose: 'initial_contact',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 minutes duration
    duration: 900, // 15 minutes in seconds
    status: 'completed',
    outcome: 'connected',
    notes: 'Customer was very interested in our premium package. Scheduled follow-up for next week.',
    summary: 'Positive response, follow-up scheduled',
    nextFollowupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    leadStatusBefore: 'new',
    leadStatusAfter: 'interested',
    callQuality: 'excellent',
    customerSatisfaction: 5
  },
  {
    phoneNumber: '9876543216',
    callType: 'outbound',
    callPurpose: 'follow_up',
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000 + 8 * 60 * 1000), // 8 minutes duration
    duration: 480, // 8 minutes in seconds
    status: 'completed',
    outcome: 'connected',
    notes: 'Customer had some questions about pricing. Sent detailed quote via email.',
    summary: 'Questions answered, quote sent',
    nextFollowupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    leadStatusBefore: 'contacted',
    leadStatusAfter: 'qualified',
    callQuality: 'good',
    customerSatisfaction: 4
  },
  {
    phoneNumber: '9876543217',
    callType: 'outbound',
    callPurpose: 'initial_contact',
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    endTime: new Date(Date.now() - 30 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes duration
    duration: 300, // 5 minutes in seconds
    status: 'completed',
    outcome: 'no_answer',
    notes: 'No answer, left voicemail with callback number.',
    summary: 'No answer, voicemail left',
    nextFollowupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
    leadStatusBefore: 'new',
    leadStatusAfter: 'new',
    callQuality: 'fair',
    customerSatisfaction: null
  }
];

const sampleReports = [
  {
    reportDate: new Date(),
    reportType: 'daily',
    callMetrics: {
      totalCalls: 25,
      completedCalls: 20,
      missedCalls: 5,
      successfulCalls: 15,
      totalCallDuration: 7200, // 2 hours in seconds
      averageCallDuration: 360 // 6 minutes average
    },
    leadMetrics: {
      newLeads: 8,
      contactedLeads: 15,
      qualifiedLeads: 10,
      interestedLeads: 5,
      convertedLeads: 2,
      followupsScheduled: 8,
      followupsCompleted: 12
    },
    performanceMetrics: {
      connectionRate: 80,
      conversionRate: 13.3,
      leadResponseTime: 45,
      customerSatisfactionAvg: 4.2
    },
    workMetrics: {
      startTime: '09:00',
      endTime: '18:00',
      totalWorkHours: 8,
      breakTime: 60,
      productiveHours: 7
    },
    activities: [
      {
        time: '09:00',
        activity: 'Login',
        description: 'Started work day',
        outcome: 'Ready for calls',
        duration: 5
      },
      {
        time: '09:15',
        activity: 'Call Campaign',
        description: 'Made 10 initial contact calls',
        outcome: '5 connections, 3 voicemails, 2 no answer',
        duration: 120
      },
      {
        time: '11:00',
        activity: 'Follow-up Calls',
        description: 'Called 8 follow-up leads',
        outcome: '6 connections, 2 no answer',
        duration: 90
      },
      {
        time: '14:00',
        activity: 'Lead Qualification',
        description: 'Qualified 5 interested leads',
        outcome: '3 ready for proposal, 2 need more info',
        duration: 60
      }
    ],
    targets: {
      callTarget: 30,
      leadTarget: 20,
      conversionTarget: 3,
      revenueTarget: 50000
    },
    achievements: {
      callsAchieved: 25,
      leadsAchieved: 15,
      conversionsAchieved: 2,
      revenueAchieved: 35000
    },
    notes: 'Good day overall. Met most targets. Need to improve conversion rate.',
    challenges: 'Some leads were not available during business hours.',
    improvements: 'Will try calling at different times to improve connection rate.',
    status: 'submitted'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telecaller-app');
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Call.deleteMany({});
    await Report.deleteMany({});
    console.log('Existing data cleared');

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name} (${user.role})`);
    }

    // Assign telecallers to supervisor
    const supervisor = createdUsers.find(u => u.role === 'supervisor');
    const telecallers = createdUsers.filter(u => u.role === 'telecaller');
    
    for (const telecaller of telecallers) {
      telecaller.supervisor = supervisor._id;
      await telecaller.save();
    }
    
    supervisor.teamMembers = telecallers.map(t => t._id);
    await supervisor.save();
    console.log(`Assigned ${telecallers.length} telecallers to supervisor`);

    // Create leads
    console.log('Creating leads...');
    const createdLeads = [];
    for (let i = 0; i < sampleLeads.length; i++) {
      const leadData = sampleLeads[i];
      const telecaller = telecallers[i % telecallers.length]; // Distribute leads among telecallers
      
      const lead = new Lead({
        ...leadData,
        assignedTo: telecaller._id,
        assignedBy: supervisor._id,
        assignedAt: new Date()
      });
      
      await lead.save();
      createdLeads.push(lead);
      console.log(`Created lead: ${lead.name} assigned to ${telecaller.name}`);
    }

    // Create calls
    console.log('Creating calls...');
    for (let i = 0; i < sampleCalls.length; i++) {
      const callData = sampleCalls[i];
      const telecaller = telecallers[i % telecallers.length];
      const lead = createdLeads[i % createdLeads.length];
      
      const call = new Call({
        ...callData,
        leadId: lead._id,
        telecallerId: telecaller._id
      });
      
      await call.save();
      console.log(`Created call: ${call.outcome} call to ${call.phoneNumber}`);
    }

    // Create reports
    console.log('Creating reports...');
    for (const telecaller of telecallers) {
      const reportData = {
        ...sampleReports[0],
        userId: telecaller._id
      };
      
      const report = new Report(reportData);
      await report.save();
      console.log(`Created daily report for ${telecaller.name}`);
    }

    // Update user performance metrics
    console.log('Updating user performance metrics...');
    for (const telecaller of telecallers) {
      const userCalls = await Call.find({ telecallerId: telecaller._id });
      const userLeads = await Lead.find({ assignedTo: telecaller._id });
      
      const totalCalls = userCalls.length;
      const successfulCalls = userCalls.filter(call => call.isSuccessful).length;
      const totalLeads = userLeads.length;
      const convertedLeads = userLeads.filter(lead => lead.status === 'converted').length;
      
      await User.findByIdAndUpdate(telecaller._id, {
        totalCalls,
        successfulCalls,
        totalLeads,
        convertedLeads
      });
      
      console.log(`Updated performance metrics for ${telecaller.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log(`- ${createdUsers.length} users (1 admin, 1 supervisor, ${telecallers.length} telecallers)`);
    console.log(`- ${createdLeads.length} leads`);
    console.log(`- ${sampleCalls.length} calls`);
    console.log(`- ${telecallers.length} daily reports`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('Admin: admin@telecaller.com / admin123');
    console.log('Supervisor: supervisor@telecaller.com / supervisor123');
    console.log('Telecaller: alice@telecaller.com / telecaller123');
    
    console.log('\n🚀 You can now start the application and test all features!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedDatabase();