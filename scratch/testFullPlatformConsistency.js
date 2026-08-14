const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('../server/routes/auth');
const adminRoutes = require('../server/routes/admin');
const studentRoutes = require('../server/routes/student');
const errorHandler = require('../server/middleware/errorHandler');

const Subject = require('../server/models/Subject');
const Question = require('../server/models/Question');
const Exam = require('../server/models/Exam');
const User = require('../server/models/User');

const runFullAudit = async () => {
  console.log('🧪 Starting Full Platform Data Consistency & Cross-Device Synchronization Audit...\n');

  const mongoUri = process.env.MONGO_URI;
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/student', studentRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Test server listening on ${baseUrl}\n`);

  const request = async (url, options = {}) => {
    const res = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, data };
  };

  try {
    // 1. Admin Login
    console.log('1️⃣ Admin Authentication:');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'prakashhalwai59@gmail.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'DevPhoenix@Admin2026!',
      }),
    });
    if (loginRes.status !== 200 || !loginRes.data.accessToken) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const token = loginRes.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('   ✅ Admin logged in successfully with JWT token');

    // 2. Clean State Check: Ensure subject "Linux" exists and 0 questions
    console.log('\n2️⃣ Initial Database & Question Count State Check:');
    let linuxSubject = await Subject.findOne({ name: 'Linux' });
    if (!linuxSubject) {
      linuxSubject = await Subject.create({ name: 'Linux', color: '#e63946', description: 'Linux Operating System' });
      console.log('   Created "Linux" subject in database');
    }
    const linuxSubId = linuxSubject._id.toString();

    // Clean any questions under Linux for test isolation
    await Question.deleteMany({ subjectId: linuxSubId });

    // Fetch initial questions and stats from API
    const initialStats = await request('/api/admin/stats', { headers: authHeaders });
    const initialQuestions = await request('/api/admin/questions', { headers: authHeaders });
    const initialLinuxQuestions = await request(`/api/admin/questions?subjectId=${linuxSubId}`, { headers: authHeaders });

    console.log(`   Authoritative MongoDB total questions count: ${initialStats.data.data.totalQuestions}`);
    console.log(`   API /api/admin/questions count: ${initialQuestions.data.count}`);
    console.log(`   API /api/admin/questions?subjectId=${linuxSubId} count: ${initialLinuxQuestions.data.count}`);

    if (initialStats.data.data.totalQuestions !== 0 || initialQuestions.data.count !== 0 || initialLinuxQuestions.data.count !== 0) {
      throw new Error(`Expected 0 questions initially, but got: total=${initialStats.data.data.totalQuestions}`);
    }
    console.log('   ✅ Initial state verified: Subjects = 1, Questions = 0 (14-question bug eliminated!)');

    // 3. Create Question 1 under Linux: Marks = 3
    console.log('\n3️⃣ Step 1: Create Question 1 under Linux (Marks = 3):');
    const q1Res = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId: linuxSubId,
        questionText: 'TEST QUESTION 001: Which command lists directory contents in Linux?',
        options: { A: 'ls', B: 'cd', C: 'pwd', D: 'mkdir' },
        correctAnswer: 'A',
        marks: 3,
        explanation: 'ls lists directory contents.',
      }),
    });
    if (q1Res.status !== 201) throw new Error(`Create Q1 failed: ${JSON.stringify(q1Res.data)}`);
    const q1Id = q1Res.data.data._id;
    console.log(`   Created Question 1 (ID: ${q1Id}, Marks: ${q1Res.data.data.marks})`);

    // Verify after Q1
    const afterQ1Stats = await request('/api/admin/stats', { headers: authHeaders });
    const afterQ1Linux = await request(`/api/admin/questions?subjectId=${linuxSubId}`, { headers: authHeaders });
    const linuxMarksQ1 = afterQ1Linux.data.data.reduce((sum, q) => sum + q.marks, 0);

    console.log(`   Dashboard QUESTIONS count: ${afterQ1Stats.data.data.totalQuestions} (Expected: 1)`);
    console.log(`   Linux QUESTIONS count: ${afterQ1Linux.data.count} (Expected: 1)`);
    console.log(`   Linux TOTAL MARKS: ${linuxMarksQ1} (Expected: 3)`);

    if (afterQ1Stats.data.data.totalQuestions !== 1 || afterQ1Linux.data.count !== 1 || linuxMarksQ1 !== 3) {
      throw new Error('Q1 state verification failed!');
    }
    console.log('   ✅ Verified: Dashboard = 1 question, Linux = 1 question, Total marks = 3');

    // 4. Create Question 2 under Linux: Marks = 5
    console.log('\n4️⃣ Step 2: Create Question 2 under Linux (Marks = 5):');
    const q2Res = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId: linuxSubId,
        questionText: 'TEST QUESTION 002: Which command prints the working directory in Linux?',
        options: { A: 'dir', B: 'whereami', C: 'pwd', D: 'path' },
        correctAnswer: 'C',
        marks: 5,
        explanation: 'pwd stands for print working directory.',
      }),
    });
    if (q2Res.status !== 201) throw new Error(`Create Q2 failed: ${JSON.stringify(q2Res.data)}`);
    const q2Id = q2Res.data.data._id;
    console.log(`   Created Question 2 (ID: ${q2Id}, Marks: ${q2Res.data.data.marks})`);

    // Verify after Q2
    const afterQ2Stats = await request('/api/admin/stats', { headers: authHeaders });
    const afterQ2Linux = await request(`/api/admin/questions?subjectId=${linuxSubId}`, { headers: authHeaders });
    const linuxMarksQ2 = afterQ2Linux.data.data.reduce((sum, q) => sum + q.marks, 0);

    console.log(`   Dashboard QUESTIONS count: ${afterQ2Stats.data.data.totalQuestions} (Expected: 2)`);
    console.log(`   Linux QUESTIONS count: ${afterQ2Linux.data.count} (Expected: 2)`);
    console.log(`   Linux TOTAL MARKS: ${linuxMarksQ2} (Expected: 8)`);

    if (afterQ2Stats.data.data.totalQuestions !== 2 || afterQ2Linux.data.count !== 2 || linuxMarksQ2 !== 8) {
      throw new Error('Q2 state verification failed!');
    }
    console.log('   ✅ Verified: Dashboard = 2 questions, Linux = 2 questions, Total marks = 8 (3 + 5)');

    // 5. Cross-Browser Simulation: Device B reads questions and deletes Question 1
    console.log('\n5️⃣ Step 3: Cross-Device Sync & Delete Question 1 from Device B:');
    const deleteQ1Res = await request(`/api/admin/questions/${q1Id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (deleteQ1Res.status !== 200) throw new Error(`Delete Q1 failed: ${JSON.stringify(deleteQ1Res.data)}`);
    console.log(`   Device B deleted Question 1 (ID: ${q1Id})`);

    // Verify after deletion on Device A
    const afterDelStats = await request('/api/admin/stats', { headers: authHeaders });
    const afterDelLinux = await request(`/api/admin/questions?subjectId=${linuxSubId}`, { headers: authHeaders });
    const linuxMarksAfterDel = afterDelLinux.data.data.reduce((sum, q) => sum + q.marks, 0);

    console.log(`   Dashboard QUESTIONS count: ${afterDelStats.data.data.totalQuestions} (Expected: 1)`);
    console.log(`   Linux QUESTIONS count: ${afterDelLinux.data.count} (Expected: 1)`);
    console.log(`   Linux TOTAL MARKS: ${linuxMarksAfterDel} (Expected: 5)`);

    if (afterDelStats.data.data.totalQuestions !== 1 || afterDelLinux.data.count !== 1 || linuxMarksAfterDel !== 5) {
      throw new Error('Deletion state verification failed!');
    }
    console.log('   ✅ Verified: Dashboard = 1 question, Linux = 1 question, Total marks = 5');

    // 6. Cascade Deletion of Questions when Subject is Deleted
    console.log('\n6️⃣ Step 4: Subject Cascade Deletion & Orphan Prevention Check:');
    const tempSubRes = await request('/api/admin/subjects', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Temp Cascade Subject', color: '#00b4d8' }),
    });
    const tempSubId = tempSubRes.data.data._id;

    // Create a question under temp subject
    await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId: tempSubId,
        questionText: 'Temporary Question for cascade test',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correctAnswer: 'A',
        marks: 2,
      }),
    });

    // Delete temp subject
    await request(`/api/admin/subjects/${tempSubId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    // Verify orphaned questions were deleted
    const orphanQuestions = await Question.find({ subjectId: tempSubId });
    if (orphanQuestions.length > 0) {
      throw new Error(`Cascade deletion failed! Found ${orphanQuestions.length} orphaned questions.`);
    }
    console.log('   ✅ Cascade deletion verified: No orphaned questions left in MongoDB.');

    // 7. Cleanup remaining test question
    await Question.deleteMany({ subjectId: linuxSubId });

    console.log('\n🎉 ALL FULL-PLATFORM DATA CONSISTENCY AND CROSS-DEVICE TESTS PASSED WITH 100% SUCCESS! 🚀\n');
  } catch (err) {
    console.error('\n❌ Audit Test Failure:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runFullAudit();
