const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');

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
      {
        name: 'Prakash Halwai',
        email: 'prakash@devphoenix.com',
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
        let modified = false;
        if (existing.role !== 'admin') {
          existing.role = 'admin';
          modified = true;
        }
        if (!existing.isVerified) {
          existing.isVerified = true;
          modified = true;
        }
        if (modified) {
          await existing.save();
          console.log(`🆙 Updated existing user to admin: ${adminData.name} (${adminData.email})`);
        } else {
          console.log(`ℹ️  Admin already configured: ${adminData.name} (${adminData.email})`);
        }
      } else {
        const newAdmin = new User({
          name: adminData.name,
          email: adminData.email.toLowerCase(),
          password: adminData.password, // hashed via pre-save hook
          role: 'admin',
          isVerified: true,
        });
        await newAdmin.save();
        console.log(`✅ Created new admin: ${adminData.name} (${adminData.email})`);
      }
    }

    console.log('🎉 Admin initialization completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin accounts:', error.message);
    process.exit(1);
  }
};

seedAdmins();
