const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');

async function restoreAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let admin = await User.findOne({ email: 'prakashhalwai59@gmail.com' });
  if (admin) {
    admin.name = 'Prakash';
    admin.role = 'admin';
    admin.password = 'DevPhoenix@Admin2026!';
    admin.isVerified = true;
    await admin.save();
    console.log('✅ Updated existing user prakashhalwai59@gmail.com to Admin (Prakash)');
  } else {
    admin = await User.create({
      name: 'Prakash',
      email: 'prakashhalwai59@gmail.com',
      password: 'DevPhoenix@Admin2026!',
      role: 'admin',
      isVerified: true,
    });
    console.log('✅ Created new Admin account for Prakash (prakashhalwai59@gmail.com)');
  }

  let devAdmin = await User.findOne({ email: 'admin@devphoenix.com' });
  if (devAdmin) {
    devAdmin.name = 'Prakash';
    devAdmin.role = 'admin';
    devAdmin.password = 'DevPhoenix@Admin2026!';
    devAdmin.isVerified = true;
    await devAdmin.save();
  } else {
    await User.create({
      name: 'Prakash',
      email: 'admin@devphoenix.com',
      password: 'DevPhoenix@Admin2026!',
      role: 'admin',
      isVerified: true,
    });
  }

  console.log('✅ Admin credentials restored:');
  console.log('   Email: prakashhalwai59@gmail.com');
  console.log('   Password: DevPhoenix@Admin2026!');
  console.log('   Role: admin');

  await mongoose.connection.close();
}

restoreAdmin();
