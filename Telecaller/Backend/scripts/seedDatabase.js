const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = [
  {
    name: 'System Administrator',
    email: 'admin@telecaller.com',
    password: 'admin123',
    role: 'admin',
    department: 'sales',
    phone: '9999999999',
    isActive: true,
    currentStatus: 'available'
  },
  {
    name: 'Team Supervisor',
    email: 'supervisor@telecaller.com',
    password: 'supervisor123',
    role: 'supervisor',
    department: 'sales',
    phone: '9999999998',
    isActive: true,
    currentStatus: 'available'
  },
  {
    name: 'John Telecaller',
    email: 'telecaller@telecaller.com',
    password: 'telecaller123',
    role: 'telecaller',
    department: 'sales',
    phone: '9999999997',
    isActive: true,
    currentStatus: 'offline',
    supervisor: null // Will be set after supervisor is created
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telecaller-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@telecaller.com' });
    if (adminExists) {
      console.log('Admin user already exists. Skipping seed.');
      return;
    }

    console.log('Seeding database with initial users...');

    // Create users
    const createdUsers = [];
    
    for (const userData of seedUsers) {
      try {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`✓ Created user: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`✗ Failed to create user ${userData.email}:`, error.message);
      }
    }

    // Set supervisor relationship
    const supervisor = createdUsers.find(u => u.role === 'supervisor');
    const telecaller = createdUsers.find(u => u.role === 'telecaller');

    if (supervisor && telecaller) {
      telecaller.supervisor = supervisor._id;
      await telecaller.save();

      supervisor.teamMembers = [telecaller._id];
      await supervisor.save();

      console.log('✓ Set supervisor relationships');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@telecaller.com / admin123');
    console.log('Supervisor: supervisor@telecaller.com / supervisor123');
    console.log('Telecaller: telecaller@telecaller.com / telecaller123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;