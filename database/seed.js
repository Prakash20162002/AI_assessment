const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');
const Subject = require('../server/models/Subject');

const seedAdmins = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in server/.env');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Default admin accounts to initialize if they don't exist
    // Password values are immediately hashed with bcrypt (salt factor 12) via User pre-save hook
    const defaultAdmins = [
      {
        name: 'Prakash Halwai',
        email: 'prakashhalwai59@gmail.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'DevPhoenix@Admin2026!',
        role: 'admin',
        isVerified: true,
      },
      {
        name: 'Nilesh Maity',
        email: 'nilesh@devphoenix.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'DevPhoenix@Admin2026!',
        role: 'admin',
        isVerified: true,
      },
      {
        name: 'Rohit Pandit',
        email: 'rohit@devphoenix.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'DevPhoenix@Admin2026!',
        role: 'admin',
        isVerified: true,
      },
    ];

    for (const adminData of defaultAdmins) {
      const existing = await User.findOne({
        $or: [
          { email: adminData.email.toLowerCase() },
          { name: adminData.name },
        ],
      });

      if (existing) {
        existing.role = 'admin';
        existing.isVerified = true;
        existing.password = adminData.password; // pre-save hook hashes with bcrypt
        await existing.save();
        console.log(`🆙 Updated existing admin & reset password: ${adminData.name} (${existing.email})`);
      } else {
        const newAdmin = new User({
          name: adminData.name,
          email: adminData.email.toLowerCase(),
          password: adminData.password, // pre-save hook hashes with bcrypt
          role: 'admin',
          isVerified: true,
        });
        await newAdmin.save();
        console.log(`✅ Created new admin: ${adminData.name} (${adminData.email})`);
      }
    }

    // Default subjects to initialize in MongoDB
    const defaultSubjects = [
      { name: 'Web Development', color: '#e63946', description: 'Full-stack and frontend development assessments' },
      { name: 'Data Structures', color: '#f77f00', description: 'Algorithms and core computer science fundamentals' },
      { name: 'Cloud DevOps', color: '#06d6a0', description: 'Cloud infrastructure and CI/CD pipelines' },
      { name: 'Data Science', color: '#118ab2', description: 'Machine learning, statistics, and data analysis' },
    ];

    for (const sub of defaultSubjects) {
      const existingSub = await Subject.findOne({ name: sub.name });
      if (!existingSub) {
        await Subject.create(sub);
        console.log(`✅ Seeded subject in MongoDB: ${sub.name}`);
      } else {
        console.log(`ℹ️  Subject already exists in MongoDB: ${sub.name}`);
      }
    }

    console.log('🎉 Database seeding completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedAdmins();
