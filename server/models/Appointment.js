const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientUserId: { type: String, required: true, index: true },
  doctorUserId: { type: String, required: true, index: true },
  appointmentDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
