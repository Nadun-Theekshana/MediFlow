const express = require('express');
const { protect, patientOnly, doctorOnly, adminOnly } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAdminAppointments,
  approveAppointmentByAdmin,
  deleteCancelledAppointmentByAdmin,
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

// Doctor updates appointment status (reject only)
router.patch('/:id/status', protect, doctorOnly, updateAppointmentStatus);

// Admin: get ALL appointments
router.get('/admin', protect, adminOnly, getAdminAppointments);

// Admin: approve a pending appointment
router.patch('/:id/admin-approve', protect, adminOnly, approveAppointmentByAdmin);

// Admin: permanently delete a cancelled appointment
router.delete('/:id/admin-delete', protect, adminOnly, deleteCancelledAppointmentByAdmin);

module.exports = router;
