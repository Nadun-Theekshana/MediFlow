const express = require('express');
const { createUser, getDoctors, getPatients, getAppointmentDoctors, getDoctorProfile, updateDoctorAvailability, deleteDoctor, deletePatient, updateDoctor, updateDoctorStatus, getNextPatientId, getNextDoctorId, registerPatient } = require('../controllers/userController');
const { protect, adminOnly, patientOnly, doctorOnly } = require('../middleware/authMiddleware');
const router = express.Router();


// Public routes (no auth required)
router.get('/next-patient-id', getNextPatientId);
router.post('/register-patient', registerPatient);

// Protected routes
router.get('/next-doctor-id', protect, adminOnly, getNextDoctorId);
router.post('/', protect, adminOnly, createUser);
router.get('/doctors', protect, adminOnly, getDoctors);
router.get('/patients', protect, adminOnly, getPatients);
router.get('/appointment-doctors', protect, patientOnly, getAppointmentDoctors);
router.get('/doctor/profile', protect, doctorOnly, getDoctorProfile);
router.patch('/doctor/availability', protect, doctorOnly, updateDoctorAvailability);
router.patch('/doctors/:userId/status', protect, adminOnly, updateDoctorStatus);
router.delete('/patients/:userId', protect, adminOnly, deletePatient);
router.delete('/:userId', protect, adminOnly, deleteDoctor);
router.put('/:userId', protect, adminOnly, updateDoctor);






module.exports = router;
