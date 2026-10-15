// scripts/verifyWorkflow.js
// Automated verification of backend account workflow (Step 11)
// Does NOT print passwords, password hashes, JWTs, or other secrets.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fetch = globalThis.fetch; // use built-in fetch in Node 18+
const User = require('../models/User');

const ADMIN_ID = 'A001';
const TEMP_DOCTOR = { userId: 'DTEST01', name: 'Temp Doctor', email: 'dtest@example.com', password: 'DocPass123', role: 'doctor' };
const TEMP_PATIENT = { userId: 'PTEST01', name: 'Temp Patient', email: 'ptest@example.com', password: 'PatPass123', role: 'patient' };

const log = (msg) => console.log('[VERIFY]', msg);

(async () => {
  try {
    // ---------------------------------------------------
    // Part 1 – Verify permanent admin exists in DB
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ userId: ADMIN_ID });
    if (!admin) { log('❌ Admin A001 NOT found in DB'); process.exit(1); }
    log(`✅ Admin A001 exists with role: ${admin.role}`);
    // ---------------------------------------------------
    // Part 2 – Login as admin
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: ADMIN_ID, password: process.env.INITIAL_ADMIN_PASSWORD })
    });
    if (loginRes.status !== 200) { log('❌ Admin login failed'); process.exit(1); }
    const loginData = await loginRes.json();
    const adminToken = loginData.token; // keep but do not print
    log('✅ Admin login succeeded');
    // ---------------------------------------------------
    // Helper to create a user with admin token
    const createUser = async (user) => {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(user)
      });
      return res;
    };
    // ---------------------------------------------------
    // Part 3 – Admin creates temporary Doctor
    const docRes = await createUser(TEMP_DOCTOR);
    if (docRes.status === 201) log('✅ Admin created temporary Doctor');
    else { log(`❌ Admin failed to create Doctor, status ${docRes.status}`); }
    // Verify Doctor in DB
    const doctor = await User.findOne({ userId: TEMP_DOCTOR.userId });
    if (doctor && doctor.role === 'doctor') log('✅ Doctor exists with correct role');
    else log('❌ Doctor verification failed');
    // ---------------------------------------------------
    // Part 4 – Admin creates temporary Patient
    const patRes = await createUser(TEMP_PATIENT);
    if (patRes.status === 201) log('✅ Admin created temporary Patient');
    else { log(`❌ Admin failed to create Patient, status ${patRes.status}`); }
    const patient = await User.findOne({ userId: TEMP_PATIENT.userId });
    if (patient && patient.role === 'patient') log('✅ Patient exists with correct role');
    else log('❌ Patient verification failed');
    // ---------------------------------------------------
    // Part 5 – Doctor login
    const docLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEMP_DOCTOR.userId, password: TEMP_DOCTOR.password })
    });
    if (docLogin.status === 200) log('✅ Doctor login succeeded');
    else log('❌ Doctor login failed');
    const docToken = (await docLogin.json()).token;
    // Part 6 – Patient login
    const patLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEMP_PATIENT.userId, password: TEMP_PATIENT.password })
    });
    if (patLogin.status === 200) log('✅ Patient login succeeded');
    else log('❌ Patient login failed');
    const patToken = (await patLogin.json()).token;
    // ---------------------------------------------------
    // Part 7 – Doctor attempts to create a user (should be 403)
    const docAttempt = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({ userId: 'DFAIL01', name: 'X', email: 'x@x.com', password: 'x', role: 'doctor' })
    });
    if (docAttempt.status === 403) log('✅ Doctor blocked from creating accounts (403)');
    else log(`❌ Doctor creation attempt returned ${docAttempt.status}`);
    // Part 8 – Patient attempts to create a user (should be 403)
    const patAttempt = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patToken}` },
      body: JSON.stringify({ userId: 'PFAIL01', name: 'Y', email: 'y@y.com', password: 'y', role: 'patient' })
    });
    if (patAttempt.status === 403) log('✅ Patient blocked from creating accounts (403)');
    else log(`❌ Patient creation attempt returned ${patAttempt.status}`);
    // Part 9 – Admin attempts to create another admin (should be rejected)
    const adminAttempt = await createUser({ userId: 'A002', name: 'Fake Admin', email: 'admin2@example.com', password: 'admin2', role: 'admin' });
    if (adminAttempt.status !== 201) log('✅ Admin creation of another admin correctly rejected');
    else log('❌ Unexpectedly allowed creation of another admin');
    // ---------------------------------------------------
    // Cleanup temporary Doctor and Patient
    await User.deleteOne({ userId: TEMP_DOCTOR.userId });
    await User.deleteOne({ userId: TEMP_PATIENT.userId });
    log('🗑️ Cleaned up temporary Doctor and Patient');
    // Verify A001 still exists
    const adminCheck = await User.findOne({ userId: ADMIN_ID });
    if (adminCheck) log('✅ Permanent Admin A001 still present');
    else log('❌ Permanent Admin A001 missing after cleanup');
  } catch (err) {
    console.error('Error during verification script:', err);
  } finally {
    mongoose.connection.close();
  }
})();
