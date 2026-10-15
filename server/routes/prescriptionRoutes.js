const express = require('express');
const { protect, doctorOnly, patientOnly } = require('../middleware/authMiddleware');
const { createPrescription, getDoctorPrescriptions, getPatientPrescriptions } = require('../controllers/prescriptionController');

const router = express.Router();

// Doctor creates prescription
router.post('/', protect, doctorOnly, createPrescription);

// Doctor view own prescriptions
router.get('/doctor', protect, doctorOnly, getDoctorPrescriptions);

// Patient view own prescriptions
router.get('/patient', protect, patientOnly, getPatientPrescriptions);

module.exports = router;
