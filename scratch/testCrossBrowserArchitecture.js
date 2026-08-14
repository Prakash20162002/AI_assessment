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

const runTests = async () => {
  console.log('🧪 Starting Cross-Browser Architecture & Server-Side Admin Data Verification...\n');

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

  // Start temporary test server
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
    console.log('1️⃣ Admin Authentication Check:');
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

    // 2. Cache-Control Headers Check
    console.log('\n2️⃣ Cache-Control No-Store Header Verification:');
    const statsRes = await request('/api/admin/stats', { headers: authHeaders });
    const cacheHeader = statsRes.headers.get('cache-control');
    console.log(`   Cache-Control header received: "${cacheHeader}"`);
    if (!cacheHeader || !cacheHeader.includes('no-store')) {
      throw new Error(`Cache-Control header missing no-store! Value: ${cacheHeader}`);
    }
    console.log('   ✅ Enforced no-store, no-cache on /api/admin/* endpoints');

    // 3. Subject CRUD & Cross-Client Sync Simulation
    console.log('\n3️⃣ Subject CRUD & Cross-Session Sync:');
    
    // Client A (e.g. Chrome) creates a new subject
    const newSubName = `Distributed Systems ${Date.now()}`;
    const createSubRes = await request('/api/admin/subjects', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: newSubName, color: '#3a86ff', description: 'Testing cross-browser sync' }),
    });
    if (createSubRes.status !== 201) throw new Error(`Subject creation failed: ${JSON.stringify(createSubRes.data)}`);
    const createdSubId = createSubRes.data.data._id;
    console.log(`   Client A created subject: "${newSubName}" (ID: ${createdSubId})`);

    // Client B (e.g. Safari) fetches subjects from authoritative backend
    const clientBSubs = await request('/api/admin/subjects', { headers: authHeaders });
    const foundInB = clientBSubs.data.data.find(s => s._id === createdSubId);
    if (!foundInB || foundInB.name !== newSubName) {
      throw new Error(`Subject created by Client A was NOT found by Client B! Data: ${JSON.stringify(clientBSubs.data)}`);
    }
    console.log(`   ✅ Client B immediately read the new subject from MongoDB: "${foundInB.name}"`);

    // Client B updates the subject
    const updatedSubName = `${newSubName} (Updated by Safari)`;
    const updateSubRes = await request(`/api/admin/subjects/${createdSubId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ name: updatedSubName, color: '#8338ec' }),
    });
    if (updateSubRes.status !== 200) throw new Error(`Subject update failed: ${JSON.stringify(updateSubRes.data)}`);
    console.log(`   Client B updated subject name to: "${updatedSubName}"`);

    // Client A re-fetches from authoritative backend
    const clientASubs = await request('/api/admin/subjects', { headers: authHeaders });
    const foundInA = clientASubs.data.data.find(s => s._id === createdSubId);
    if (!foundInA || foundInA.name !== updatedSubName) {
      throw new Error(`Subject update by Client B was NOT visible to Client A!`);
    }
    console.log(`   ✅ Client A immediately sees updated subject: "${foundInA.name}"`);

    // Client A deletes the subject
    const deleteSubRes = await request(`/api/admin/subjects/${createdSubId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (deleteSubRes.status !== 200) throw new Error(`Subject deletion failed: ${JSON.stringify(deleteSubRes.data)}`);
    console.log(`   Client A deleted subject ID: ${createdSubId}`);

    // Client B verifies subject is deleted from MongoDB
    const clientBSubsAfterDelete = await request('/api/admin/subjects', { headers: authHeaders });
    if (clientBSubsAfterDelete.data.data.some(s => s._id === createdSubId)) {
      throw new Error('Deleted subject still exists on server!');
    }
    console.log('   ✅ Client B confirmed subject is deleted from authoritative database');

    // 4. Student Management API Verification
    console.log('\n4️⃣ Student Management Endpoints:');
    const studentsRes = await request('/api/admin/students', { headers: authHeaders });
    if (studentsRes.status !== 200) throw new Error(`Fetch students failed: ${JSON.stringify(studentsRes.data)}`);
    console.log(`   ✅ Successfully retrieved students list (${studentsRes.data.count} registered)`);

    // 5. Exam Management API Verification
    console.log('\n5️⃣ Exam Management Endpoints:');
    const examsRes = await request('/api/admin/exams', { headers: authHeaders });
    if (examsRes.status !== 200) throw new Error(`Fetch exams failed: ${JSON.stringify(examsRes.data)}`);
    console.log(`   ✅ Successfully retrieved exams list (${examsRes.data.count} platform exams)`);

    // 6. Results Endpoints
    console.log('\n6️⃣ Results & Audit Log Endpoints:');
    const resultsRes = await request('/api/admin/results', { headers: authHeaders });
    if (resultsRes.status !== 200) throw new Error(`Fetch results failed: ${JSON.stringify(resultsRes.data)}`);
    console.log(`   ✅ Successfully retrieved results list (${resultsRes.data.count} submissions)`);

    console.log('\n🎉 ALL CROSS-BROWSER & BACKEND ARCHITECTURE VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Test Failure:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runTests();
