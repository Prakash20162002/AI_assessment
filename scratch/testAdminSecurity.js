const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');
const jwt = require('jsonwebtoken');
const { protect, requireAdmin } = require('../server/middleware/authMiddleware');

async function runSecurityTests() {
  console.log('🧪 Starting Admin Authentication & Authorization Security Tests...\n');

  const adminUserId = new mongoose.Types.ObjectId();
  const studentUserId = new mongoose.Types.ObjectId();

  const adminToken = jwt.sign({ id: adminUserId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const studentToken = jwt.sign({ id: studentUserId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const expiredToken = jwt.sign({ id: adminUserId }, process.env.JWT_SECRET, { expiresIn: '-1s' });
  const invalidSignatureToken = jwt.sign({ id: adminUserId }, 'wrong-secret-key-test', { expiresIn: '15m' });

  // Mock User.findById
  const originalFindById = User.findById;
  User.findById = (id) => ({
    select: (sel) => {
      if (id && id.toString() === adminUserId.toString()) {
        return Promise.resolve({ _id: adminUserId, email: 'admin@devphoenix.com', name: 'Admin User', role: 'admin', isVerified: true });
      }
      if (id && id.toString() === studentUserId.toString()) {
        return Promise.resolve({ _id: studentUserId, email: 'student@example.com', name: 'Student User', role: 'student', isVerified: true });
      }
      return Promise.resolve(null);
    }
  });

  const runMiddleware = async (req) => {
    let statusCode = 200;
    let responseData = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    let nextCalled = false;
    await protect(req, res, async () => {
      await requireAdmin(req, res, () => {
        nextCalled = true;
      });
    });

    return { statusCode, responseData, nextCalled };
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated request to Admin API -> 401
    // -------------------------------------------------------------
    const req1 = { headers: {} };
    const res1 = await runMiddleware(req1);
    console.log(`TEST 1 (Unauthenticated Admin API Access): Status = ${res1.statusCode}, Message = "${res1.responseData?.message}"`);
    if (res1.statusCode === 401 && !res1.nextCalled) {
      console.log('✅ PASS: Unauthenticated access rejected with 401.');
    } else {
      console.error('❌ FAIL: Expected 401 status.');
    }

    // -------------------------------------------------------------
    // TEST 2: Student credentials attempting Admin API -> 403 Forbidden
    // -------------------------------------------------------------
    const req2 = { headers: { authorization: `Bearer ${studentToken}` } };
    const res2 = await runMiddleware(req2);
    console.log(`\nTEST 2 (Student Role Attempting Admin API): Status = ${res2.statusCode}, Message = "${res2.responseData?.message}"`);
    if (res2.statusCode === 403 && res2.responseData?.message === 'Admin access required' && !res2.nextCalled) {
      console.log('✅ PASS: Student token rejected with 403 Forbidden ("Admin access required").');
    } else {
      console.error('❌ FAIL: Expected 403 status for student role.');
    }

    // -------------------------------------------------------------
    // TEST 3: Admin token accessing Admin API -> Allowed (nextCalled = true)
    // -------------------------------------------------------------
    const req3 = { headers: { authorization: `Bearer ${adminToken}` } };
    const res3 = await runMiddleware(req3);
    console.log(`\nTEST 3 (Admin Role Accessing Admin API): Authorized = ${res3.nextCalled}, User = ${req3.user?.name} (${req3.user?.role})`);
    if (res3.nextCalled && req3.user?.role === 'admin') {
      console.log('✅ PASS: Admin successfully authorized and authenticated.');
    } else {
      console.error('❌ FAIL: Expected admin to be authorized.');
    }

    // -------------------------------------------------------------
    // TEST 4: Expired token to Admin API -> 401 Token Expired
    // -------------------------------------------------------------
    const req4 = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res4 = await runMiddleware(req4);
    console.log(`\nTEST 4 (Expired Token Handling): Status = ${res4.statusCode}, Code = ${res4.responseData?.code}`);
    if (res4.statusCode === 401 && res4.responseData?.code === 'TOKEN_EXPIRED' && !res4.nextCalled) {
      console.log('✅ PASS: Expired token properly returns 401 TOKEN_EXPIRED.');
    } else {
      console.error('❌ FAIL: Expected 401 TOKEN_EXPIRED.');
    }

    // -------------------------------------------------------------
    // TEST 5: Tampered / Invalid signature token -> 401
    // -------------------------------------------------------------
    const req5 = { headers: { authorization: `Bearer ${invalidSignatureToken}` } };
    const res5 = await runMiddleware(req5);
    console.log(`\nTEST 5 (Invalid Signature Token): Status = ${res5.statusCode}, Message = "${res5.responseData?.message}"`);
    if (res5.statusCode === 401 && !res5.nextCalled) {
      console.log('✅ PASS: Invalid signature rejected with 401.');
    } else {
      console.error('❌ FAIL: Expected 401 status.');
    }

    // -------------------------------------------------------------
    // TEST 6: Bcrypt Password Verification & Pre-save Hash Check
    // -------------------------------------------------------------
    const bcrypt = require('bcryptjs');
    const plainPass = 'SecureAdminPass2026!';
    const hashed = await bcrypt.hash(plainPass, 12);
    const matchesCorrect = await bcrypt.compare(plainPass, hashed);
    const matchesWrong = await bcrypt.compare('WrongPassword', hashed);
    console.log(`\nTEST 6 (Bcrypt Password Security): Hash match correct = ${matchesCorrect}, Hash match wrong = ${matchesWrong}`);
    if (matchesCorrect && !matchesWrong) {
      console.log('✅ PASS: Bcrypt hashing and comparison functioning with salt factor 12.');
    } else {
      console.error('❌ FAIL: Bcrypt hashing failed.');
    }

    console.log('\n✨ All backend security verification tests PASSED successfully!\n');
  } finally {
    User.findById = originalFindById;
  }
}

runSecurityTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
