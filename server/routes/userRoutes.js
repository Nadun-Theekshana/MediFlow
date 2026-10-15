const express = require('express');
const { createUser, getDoctors, deleteDoctor, updateDoctor, updateDoctorStatus } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();
router.use((req, res, next) => { console.log('UserRoutes request:', req.method, req.path); next(); });


router.post('/', protect, adminOnly, createUser);
router.get('/doctors', protect, adminOnly, getDoctors);
router.delete('/:userId', protect, adminOnly, deleteDoctor);
router.put('/:userId', protect, adminOnly, updateDoctor);
router.patch('/doctors/:userId/status', protect, adminOnly, updateDoctorStatus);






module.exports = router;
