const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Subject = require('../server/models/Subject');
const Question = require('../server/models/Question');
const Exam = require('../server/models/Exam');
const User = require('../server/models/User');
const Result = require('../server/models/Result');

const inspectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Existing MongoDB Collections:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} document(s)`);
    }

    console.log('\n--- Subjects in MongoDB ---');
    const subs = await Subject.find();
    console.log(JSON.stringify(subs, null, 2));

    console.log('\n--- Questions in MongoDB ---');
    const questions = await Question.find();
    console.log(JSON.stringify(questions, null, 2));

    console.log('\n--- Exams in MongoDB ---');
    const exams = await Exam.find();
    console.log(JSON.stringify(exams, null, 2));

    console.log('\n--- Admin Users in MongoDB ---');
    const admins = await User.find({ role: 'admin' }).select('-password');
    console.log(JSON.stringify(admins, null, 2));

    console.log('\n--- Students in MongoDB ---');
    const students = await User.find({ role: 'student' }).select('-password');
    console.log(JSON.stringify(students, null, 2));

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
};

inspectDB();
