const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false
  },
  doctorUserId: { type: String, required: true, index: true },
  patientUserId: { type: String, required: true, index: true },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
