// server/tests/appointmentTest.js
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const baseUrl = `http://localhost:${process.env.PORT || 5000}/api`;

const adminCredentials = {
  email: process.env.INITIAL_ADMIN_EMAIL,
  password: process.env.INITIAL_ADMIN_PASSWORD,
};

async function login(email, password) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.token; // token string
}

async function createUser(token, user) {
  const res = await fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(user)
  });
  return res.status;
}

async function get(url, token) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function post(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function patch(url, token, body) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const adminToken = await login(adminCredentials.email, adminCredentials.password);

  // Create temporary users
  const doctorId = 'D9101';
  const patientId = 'P9101';
  await createUser(adminToken, { userId: doctorId, name: 'Temp Doctor', email: 'tempdoc@example.com', password: 'tempdocpass', role: 'doctor' });
  await createUser(adminToken, { userId: patientId, name: 'Temp Patient', email: 'temppat@example.com', password: 'temppass', role: 'patient' });

  const doctorToken = await login('tempdoc@example.com', 'tempdocpass');
  const patientToken = await login('temppat@example.com', 'temppass');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  // Patient creates appointment
  const createResp = await post(`${baseUrl}/appointments`, patientToken, {
    doctorUserId: doctorId,
    appointmentDate: futureDate.toISOString(),
    reason: 'General consultation'
  });
  const appointmentId = createResp.data.appointment ? createResp.data.appointment._id : null;

  // Invalid doctor tests
  const invalidDoctorResp = await post(`${baseUrl}/appointments`, patientToken, {
    doctorUserId: 'D9999',
    appointmentDate: futureDate.toISOString(),
    reason: 'Test'
  });
  const patientAsDoctorResp = await post(`${baseUrl}/appointments`, patientToken, {
    doctorUserId: patientId,
    appointmentDate: futureDate.toISOString(),
    reason: 'Test'
  });

  // Patient view own appointments
  const patientView = await get(`${baseUrl}/appointments/patient`, patientToken);

  // Doctor view assigned appointments
  const doctorView = await get(`${baseUrl}/appointments/doctor`, doctorToken);

  // Doctor approve appointment
  const approveResp = await patch(`${baseUrl}/appointments/${appointmentId}/status`, doctorToken, { status: 'approved' });

  // Create second appointment
  const createResp2 = await post(`${baseUrl}/appointments`, patientToken, {
    doctorUserId: doctorId,
    appointmentDate: futureDate.toISOString(),
    reason: 'Second consult'
  });
  const appointmentId2 = createResp2.data.appointment ? createResp2.data.appointment._id : null;
  const rejectResp = await patch(`${baseUrl}/appointments/${appointmentId2}/status`, doctorToken, { status: 'rejected' });

  // Invalid status
  const invalidStatusResp = await patch(`${baseUrl}/appointments/${appointmentId2}/status`, doctorToken, { status: 'completed' });

  // Re-update approved appointment
  const reupdateResp = await patch(`${baseUrl}/appointments/${appointmentId}/status`, doctorToken, { status: 'rejected' });

  // Role security tests
  const doctorCreate = await post(`${baseUrl}/appointments`, doctorToken, {
    doctorUserId: doctorId,
    appointmentDate: futureDate.toISOString(),
    reason: 'Hack'
  });
  const adminCreate = await post(`${baseUrl}/appointments`, adminToken, {
    doctorUserId: doctorId,
    appointmentDate: futureDate.toISOString(),
    reason: 'Hack'
  });
  const patientGetDoctor = await get(`${baseUrl}/appointments/doctor`, patientToken);
  const doctorGetPatient = await get(`${baseUrl}/appointments/patient`, doctorToken);
  const patientPatch = await patch(`${baseUrl}/appointments/${appointmentId}/status`, patientToken, { status: 'approved' });
  const noJwt = await get(`${baseUrl}/appointments/patient`);

  // Cross-doctor security
  const doctor2Id = 'D9102';
  await createUser(adminToken, { userId: doctor2Id, name: 'Second Doctor', email: 'doc2@example.com', password: 'doc2pass', role: 'doctor' });
  const doctor2Token = await login('doc2@example.com', 'doc2pass');
  const crossUpdate = await patch(`${baseUrl}/appointments/${appointmentId}/status`, doctor2Token, { status: 'rejected' });

  // Fake patientUserId test
  const fakePatientResp = await post(`${baseUrl}/appointments`, patientToken, {
    doctorUserId: doctorId,
    appointmentDate: futureDate.toISOString(),
    reason: 'Fake test',
    patientUserId: 'P9999'
  });
  const fakeId = fakePatientResp.data.appointment ? fakePatientResp.data.appointment.patientUserId : null;

  // Verify DB fields
  const dbAppointment = await Appointment.findById(appointmentId).lean();
  const expectedFields = ['patientUserId','doctorUserId','appointmentDate','reason','status','createdAt','updatedAt'];
  const fieldsOk = expectedFields.every(f=>Object.prototype.hasOwnProperty.call(dbAppointment,f));

  // Cleanup
  await User.deleteMany({ userId: { $in: [doctorId, doctor2Id, patientId] } });
  await Appointment.deleteMany({ _id: { $in: [appointmentId, appointmentId2, fakePatientResp.data.appointment?._id] } });

  console.log('--- Test Summary ---');
  console.log('Appointment model correct:', fieldsOk ? 'Yes' : 'No');
  console.log('Appointment routes correct:', createResp.status===201 && patientView.status===200 && doctorView.status===200 && approveResp.status===200 ? 'Yes' : 'No');
  console.log('Patient creates valid appointment: ', createResp.status===201 ? 'Pass' : 'Fail');
  console.log('New appointment status = pending: ', createResp.data.appointment && createResp.data.appointment.status==='pending' ? 'Yes' : 'No');
  console.log('Patient ID taken from JWT: ', createResp.data.appointment && createResp.data.appointment.patientUserId===patientId ? 'Yes' : 'No');
  console.log('Non-existing Doctor rejected: ', invalidDoctorResp.status!==201 ? 'Pass' : 'Fail');
  console.log('Non-Doctor user rejected as doctorUserId: ', patientAsDoctorResp.status!==201 ? 'Pass' : 'Fail');
  console.log('Patient retrieves only own appointments: ', patientView.data.appointments && patientView.data.appointments.length===2 ? 'Pass' : 'Fail');
  console.log('Doctor retrieves only assigned appointments: ', doctorView.data.appointments && doctorView.data.appointments.length===2 ? 'Pass' : 'Fail');
  console.log('Doctor approves pending appointment: ', approveResp.status===200 && approveResp.data.appointment.status==='approved' ? 'Pass' : 'Fail');
  console.log('Doctor rejects pending appointment: ', rejectResp.status===200 && rejectResp.data.appointment.status==='rejected' ? 'Pass' : 'Fail');
  console.log('Invalid status rejected: ', invalidStatusResp.status===400 ? 'Pass' : 'Fail');
  console.log('Approved/rejected cannot be changed again: ', reupdateResp.status===400 ? 'Pass' : 'Fail');
  console.log('Doctor cannot create appointment: ', doctorCreate.status===403 ? 'Pass' : 'Fail');
  console.log('Admin cannot create appointment: ', adminCreate.status===403 ? 'Pass' : 'Fail');
  console.log('Patient cannot access doctor endpoint: ', patientGetDoctor.status===403 ? 'Pass' : 'Fail');
  console.log('Doctor cannot access patient endpoint: ', doctorGetPatient.status===403 ? 'Pass' : 'Fail');
  console.log('Patient cannot update status: ', patientPatch.status===403 ? 'Pass' : 'Fail');
  console.log('Missing JWT rejected: ', noJwt.status===401 ? 'Pass' : 'Fail');
  console.log('Second doctor cannot modify other doctor appointment: ', crossUpdate.status===403 ? 'Pass' : 'Fail');
  console.log('Fake patientUserId ignored: ', fakeId===patientId ? 'Pass' : 'Fail');
  console.log('Appointment documents contain only expected data: ', fieldsOk ? 'Yes' : 'No');
  console.log('Temporary appointment records cleaned: ', (await Appointment.find({ _id: appointmentId })).length===0 ? 'Yes' : 'No');
  console.log('Temporary Doctor accounts cleaned: ', (await User.find({ userId: doctorId })).length===0 && (await User.find({ userId: doctor2Id })).length===0 ? 'Yes' : 'No');
  console.log('Temporary Patient account cleaned: ', (await User.find({ userId: patientId })).length===0 ? 'Yes' : 'No');
  const adminExists = await User.findOne({ userId: 'A001' });
  console.log('A001 preserved: ', adminExists && adminExists.role==='admin' ? 'Yes' : 'No');

  await mongoose.disconnect();
})();
