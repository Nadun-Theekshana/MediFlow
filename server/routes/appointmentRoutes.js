const express = require('express');
const { protect, patientOnly, doctorOnly } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

// Patient creates appointment
router.post('/', protect, patientOnly, createAppointment);

// Patient view own appointments
router.get('/patient', protect, patientOnly, getPatientAppointments);

// Patient cancels own appointment
router.patch('/:id/cancel', protect, patientOnly, cancelAppointment);

// Doctor view assigned appointments
router.get('/doctor', protect, doctorOnly, getDoctorAppointments);

// Doctor updates appointment status
router.patch('/:id/status', protect, doctorOnly, updateAppointmentStatus);

module.exports = router;
