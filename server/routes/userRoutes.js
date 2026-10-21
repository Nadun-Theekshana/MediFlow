const express = require('express');
const { createUser, getDoctors, getPatients, getAppointmentDoctors, deleteDoctor, deletePatient, updateDoctor, updateDoctorStatus } = require('../controllers/userController');
const { protect, adminOnly, patientOnly } = require('../middleware/authMiddleware');
const router = express.Router();
router.use((req, res, next) => { console.log('UserRoutes request:', req.method, req.path); next(); });


router.post('/', protect, adminOnly, createUser);
router.get('/doctors', protect, adminOnly, getDoctors);
router.get('/patients', protect, adminOnly, getPatients);
router.get('/appointment-doctors', protect, patientOnly, getAppointmentDoctors);
router.patch('/doctors/:userId/status', protect, adminOnly, updateDoctorStatus);
router.delete('/patients/:userId', protect, adminOnly, deletePatient);
router.delete('/:userId', protect, adminOnly, deleteDoctor);
router.put('/:userId', protect, adminOnly, updateDoctor);






module.exports = router;
