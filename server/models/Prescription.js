const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  doctorUserId: { type: String, required: true, index: true },
  patientUserId: { type: String, required: true, index: true },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
