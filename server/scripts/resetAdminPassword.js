require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

(async () => {
  const report = {
    envConfigured: false,
    adminFound: false,
    passwordUpdated: false,
    bcryptHashed: false,
    plainPasswordStored: false,
    roleAdmin: false,
    loginPass: false,
    jwtGenerated: false,
  };

  const pwd = process.env.INITIAL_ADMIN_PASSWORD;
  if (pwd && pwd.trim() !== '') {
    report.envConfigured = true;
  } else {
    console.log(JSON.stringify(report));
    process.exit(0);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const admin = await User.findOne({ userId: 'A001' });
    if (admin) {
      report.adminFound = true;
      report.roleAdmin = admin.role === 'admin';
      const hash = await bcrypt.hash(pwd, 10);
      admin.password = hash;
      await admin.save();
      report.passwordUpdated = true;
      report.bcryptHashed = true;
      report.plainPasswordStored = false;
    }

    // Verify login via backend endpoint
    const resp = await fetch(`http://localhost:${process.env.PORT || 5000}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'A001', password: pwd }),
    });
    if (resp.ok) {
      const data = await resp.json();
      report.loginPass = true;
      report.jwtGenerated = !!data.token;
    }
  } catch (e) {
    // ignore errors, report will reflect failures
  } finally {
    await mongoose.disconnect();
    console.log(JSON.stringify(report));
  }
})();
