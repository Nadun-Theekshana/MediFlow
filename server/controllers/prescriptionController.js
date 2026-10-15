// server/controllers/prescriptionController.js
const Prescription = require('../models/Prescription');
const User = require('../models/User');

// Doctor creates a prescription for a patient
const createPrescription = async (req, res) => {
  try {
    const { patientUserId, medication, dosage, instructions } = req.body;
    // Validate required fields
    if (!patientUserId || !medication || !dosage || !instructions) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    // Verify patient exists and has role 'patient'
    const patient = await User.findOne({ userId: patientUserId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    // Create prescription, doctorUserId from JWT (req.user.userId)
    const prescription = new Prescription({
      doctorUserId: req.user.userId,
      patientUserId,
      medication: medication.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim()
    });
    await prescription.save();
    res.status(201).json({ message: 'Prescription created.', prescription });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Doctor retrieves their own prescriptions
const getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorUserId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Patient retrieves their own prescriptions
const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientUserId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions
};
