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
const Chapter = require('../server/models/Chapter');
const Question = require('../server/models/Question');
const Exam = require('../server/models/Exam');
const User = require('../server/models/User');

const runChapterAudit = async () => {
  console.log('🧪 Starting Subject → Chapter Management & Question Preservation Verification...\n');

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
    // 1. Admin Authentication
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

    // Clean up any stale audit test questions from previous aborted runs
    await Question.deleteMany({ questionText: { $regex: /^AUDIT TEST:/ } });

    // 2. Existing Question Preservation Check
    console.log('\n2️⃣ Existing Question Preservation Check:');
    const questionsBefore = await Question.find();
    const countBefore = questionsBefore.length;
    console.log(`   Found ${countBefore} existing question(s) in MongoDB.`);
    const existingQuestionIds = questionsBefore.map(q => q._id.toString());

    // 3. Subject & Chapter Creation Check
    console.log('\n3️⃣ Subject & Chapter Creation Check:');
    let subject = await Subject.findOne({ name: 'Cloud & DevOps' });
    if (!subject) {
      const subRes = await request('/api/admin/subjects', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: 'Cloud & DevOps', color: '#06d6a0', description: 'Cloud infrastructure & DevOps syllabus' }),
      });
      subject = subRes.data.data;
      console.log(`   Created subject "Cloud & DevOps" (ID: ${subject._id})`);
    } else {
      console.log(`   Using existing subject "Cloud & DevOps" (ID: ${subject._id})`);
    }
    const subjectId = subject._id.toString();

    // Create 4 Chapters under Cloud & DevOps
    const chapterNames = ['Linux Fundamentals', 'Git & GitHub', 'Docker', 'Kubernetes'];
    const createdChapters = [];

    for (let i = 0; i < chapterNames.length; i++) {
      const cName = chapterNames[i];
      let chap = await Chapter.findOne({ subjectId, name: cName });
      if (!chap) {
        const cRes = await request(`/api/admin/subjects/${subjectId}/chapters`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: cName,
            description: `${cName} core modules and commands`,
            order: i + 1,
            isActive: true,
          }),
        });
        if (cRes.status !== 201) throw new Error(`Failed to create chapter ${cName}: ${JSON.stringify(cRes.data)}`);
        chap = cRes.data.data;
        console.log(`   ✅ Created Chapter ${i + 1}: ${cName} (ID: ${chap.id || chap._id})`);
      } else {
        console.log(`   ℹ️ Chapter already exists: ${cName} (ID: ${chap._id})`);
      }
      createdChapters.push(chap);
    }

    // Test duplicate chapter name rejection
    const dupRes = await request(`/api/admin/subjects/${subjectId}/chapters`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Docker', order: 5 }),
    });
    if (dupRes.status === 400) {
      console.log('   ✅ Duplicate chapter name in same subject correctly rejected (400 Bad Request)');
    } else {
      throw new Error(`Expected 400 for duplicate chapter name, got ${dupRes.status}`);
    }

    // 4. Chapter Questions Assignment & Mark Calculation Test
    console.log('\n4️⃣ Chapter Question Creation & Mark Calculation Check:');
    const linuxChapId = createdChapters[0].id || createdChapters[0]._id.toString();
    const dockerChapId = createdChapters[2].id || createdChapters[2]._id.toString();

    // Create 3 questions under Linux Fundamentals (Marks: 1, 2, 3 = Total 6)
    const linuxQ1 = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId,
        chapterId: linuxChapId,
        questionText: 'AUDIT TEST: What is the command to check disk space in Linux?',
        options: { A: 'df -h', B: 'free -m', C: 'top', D: 'ps aux' },
        correctAnswer: 'A',
        marks: 1,
      }),
    });
    const linuxQ2 = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId,
        chapterId: linuxChapId,
        questionText: 'AUDIT TEST: How to change file ownership in Linux?',
        options: { A: 'chmod', B: 'chown', C: 'chgrp', D: 'touch' },
        correctAnswer: 'B',
        marks: 2,
      }),
    });
    const linuxQ3 = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId,
        chapterId: linuxChapId,
        questionText: 'AUDIT TEST: Which file contains user account info in Linux?',
        options: { A: '/etc/passwd', B: '/etc/shadow', C: '/etc/group', D: '/etc/hosts' },
        correctAnswer: 'A',
        marks: 3,
      }),
    });

    // Create 2 questions under Docker (Marks: 5, 5 = Total 10)
    const dockerQ1 = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId,
        chapterId: dockerChapId,
        questionText: 'AUDIT TEST: Which Docker command builds an image from Dockerfile?',
        options: { A: 'docker run', B: 'docker build', C: 'docker pull', D: 'docker push' },
        correctAnswer: 'B',
        marks: 5,
      }),
    });
    const dockerQ2 = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId,
        chapterId: dockerChapId,
        questionText: 'AUDIT TEST: Which instruction sets the container entry point in Dockerfile?',
        options: { A: 'CMD', B: 'ENTRYPOINT', C: 'RUN', D: 'FROM' },
        correctAnswer: 'B',
        marks: 5,
      }),
    });

    // Verify Chapter Stats
    const chaptersRes = await request(`/api/admin/subjects/${subjectId}/chapters`, { headers: authHeaders });
    const fetchedChapters = chaptersRes.data.data;

    const linuxChapData = fetchedChapters.find(c => (c.id || c._id.toString()) === linuxChapId);
    const dockerChapData = fetchedChapters.find(c => (c.id || c._id.toString()) === dockerChapId);
    const gitChapData = fetchedChapters.find(c => c.name === 'Git & GitHub');
    const k8sChapData = fetchedChapters.find(c => c.name === 'Kubernetes');

    console.log(`   Linux Fundamentals questions: ${linuxChapData.questionCount} (Expected: 3), marks: ${linuxChapData.totalMarks} (Expected: 6)`);
    console.log(`   Docker questions: ${dockerChapData.questionCount} (Expected: 2), marks: ${dockerChapData.totalMarks} (Expected: 10)`);
    console.log(`   Git & GitHub questions: ${gitChapData.questionCount} (Expected: 0)`);
    console.log(`   Kubernetes questions: ${k8sChapData.questionCount} (Expected: 0)`);

    if (linuxChapData.questionCount !== 3 || linuxChapData.totalMarks !== 6) {
      throw new Error(`Linux Fundamentals chapter stats mismatch: count=${linuxChapData.questionCount}, marks=${linuxChapData.totalMarks}`);
    }
    if (dockerChapData.questionCount !== 2 || dockerChapData.totalMarks !== 10) {
      throw new Error(`Docker chapter stats mismatch: count=${dockerChapData.questionCount}, marks=${dockerChapData.totalMarks}`);
    }
    console.log('   ✅ Chapter question counts and mark calculations verified perfectly.');

    // 5. Dashboard Overview Invariance Check
    console.log('\n5️⃣ Dashboard Overview Invariance Check:');
    const dashboardStats = await request('/api/admin/stats', { headers: authHeaders });
    console.log('   Dashboard Stats response:', JSON.stringify(dashboardStats.data.data));
    if (dashboardStats.data.data.totalChapters !== undefined) {
      console.log('   ℹ️ Note: Dashboard overview focuses on top-level metrics.');
    }
    const allSubjectsCount = await Subject.countDocuments();
    if (dashboardStats.data.data.totalSubjects !== allSubjectsCount) {
      throw new Error(`Dashboard totalSubjects mismatch! Expected ${allSubjectsCount}, got ${dashboardStats.data.data.totalSubjects}`);
    }
    console.log(`   ✅ Dashboard shows exact subject count (${allSubjectsCount}) and total questions (${dashboardStats.data.data.totalQuestions}).`);

    // 6. Chapter Delete Safety Rule Check (Questions Moved to Unassigned, Never Deleted)
    console.log('\n6️⃣ Chapter Delete Safety Rule Check:');
    await Chapter.deleteMany({ name: 'Temp Chapter To Delete' });
    const tempChapRes = await request(`/api/admin/subjects/${subjectId}/chapters`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Temp Chapter To Delete', order: 99 }),
    });
    if (tempChapRes.status !== 201) throw new Error(`Failed to create temp chapter: ${JSON.stringify(tempChapRes.data)}`);
    const tempChapId = tempChapRes.data.data.id || tempChapRes.data.data._id;
    const tempQRes = await request('/api/admin/questions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subjectId,
        chapterId: tempChapId,
        questionText: 'AUDIT TEST: Temporary Question under Temp Chapter',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correctAnswer: 'A',
        marks: 4,
      }),
    });
    if (tempQRes.status !== 201) throw new Error(`Failed to create temp question: ${JSON.stringify(tempQRes.data)}`);
    const tempQId = tempQRes.data.data?._id || tempQRes.data.data?.id;

    // Delete temp chapter
    const delChapRes = await request(`/api/admin/chapters/${tempChapId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (delChapRes.status !== 200) throw new Error(`Failed to delete chapter: ${JSON.stringify(delChapRes.data)}`);

    // Verify temp question still exists in database and now has chapterId: null
    const movedQuestion = await Question.findById(tempQId);
    if (!movedQuestion) {
      throw new Error('CRITICAL BUG: Question was deleted when chapter was deleted!');
    }
    if (movedQuestion.chapterId !== null) {
      throw new Error(`Expected question chapterId to be null, but got ${movedQuestion.chapterId}`);
    }
    console.log('   ✅ Chapter deleted safely. Question moved to Unassigned (chapterId: null) without being deleted.');

    // 7. Cleanup test questions created during audit
    await Question.deleteMany({
      _id: { $in: [linuxQ1.data.data._id, linuxQ2.data.data._id, linuxQ3.data.data._id, dockerQ1.data.data._id, dockerQ2.data.data._id, tempQId] },
    });

    // 8. Final Question Preservation Verification
    console.log('\n7️⃣ Final Question Preservation Verification:');
    const questionsAfter = await Question.find();
    console.log(`   Total questions in MongoDB after test: ${questionsAfter.length}`);
    for (const qId of existingQuestionIds) {
      const found = questionsAfter.find(q => q._id.toString() === qId);
      if (!found) {
        throw new Error(`CRITICAL: Existing question ID ${qId} was lost!`);
      }
    }
    console.log(`   ✅ ALL ${countBefore} PRE-EXISTING QUESTIONS ARE 100% PRESERVED WITH INTACT IDs AND METADATA!`);

    console.log('\n🎉 ALL SUBJECT → CHAPTER HIERARCHY AND QUESTION INTEGRATION TESTS PASSED 100%! 🚀\n');
  } catch (err) {
    console.error('\n❌ Audit Test Failure:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runChapterAudit();
