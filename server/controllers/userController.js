const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const bcrypt = require('bcryptjs');

// CREATE USER (admin creates doctor/patient)
const createUser = async (req, res) => {
  try {
    const { userId, name, email, password, role, isConsultant, consultantType, specialization } = req.body;

    if (!userId || !name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const allowedRoles = ['doctor', 'patient'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Invalid role or admin creation not allowed.' });
    }
    // Doctor-specific validation for specialization
    const DOCTOR_SPECIALIZATIONS = [
      "Consultant Physician / Internal Medicine",
      "Cardiologist",
      "Neurologist",
      "Dermatologist",
      "Endocrinologist",
      "Gastroenterologist",
      "Nephrologist",
      "Pulmonologist / Respiratory Physician",
      "Oncologist",
      "General Surgeon",
      "Orthopaedic Surgeon",
      "ENT Surgeon",
      "Ophthalmologist",
      "Obstetrician & Gynaecologist",
      "Paediatrician",
      "Psychiatrist",
      "Anaesthetist",
      "Radiologist",
      "Urologist",
      "Other"
    ];
    if (role === 'doctor') {
      if (!specialization) {
        return res.status(400).json({ message: 'Please select a consultant type.' });
      }
      if (!DOCTOR_SPECIALIZATIONS.includes(specialization)) {
        return res.status(400).json({ message: 'Invalid consultant type selected.' });
      }
    }

    const prefix = userId.charAt(0).toUpperCase();
    if (role === 'admin' && prefix !== 'A') {
      return res.status(400).json({ message: 'Admin userId must start with A.' });
    }
    if (role === 'doctor' && prefix !== 'D') {
      return res.status(400).json({ message: 'Doctor userId must start with D.' });
    }
    if (role === 'patient' && prefix !== 'P') {
      return res.status(400).json({ message: 'Patient userId must start with P.' });
    }

    const existingUserId = await User.findOne({ userId });
    if (existingUserId) {
      return res.status(400).json({ message: 'userId already exists.' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      userId,
      name,
      email,
      password: hashedPassword,
      role,
      isConsultant: isConsultant || false,
      consultantType: consultantType || '',
      specialization: role === 'doctor' ? specialization : undefined
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isConsultant: newUser.isConsultant,
        consultantType: newUser.consultantType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// LIST DOCTORS (admin view)
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('userId name email role specialization isActive createdAt');
    res.json({ doctors });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// UPDATE DOCTOR STATUS (admin only)
const updateDoctorStatus = async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean.' });
    }
    try {
        const doctor = await User.findOne({ userId, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }
        doctor.isActive = isActive;
        await doctor.save();
        res.json({
            message: 'Doctor account status updated successfully.',
            doctor: {
                userId: doctor.userId,
                name: doctor.name,
                email: doctor.email,
                role: doctor.role,
                isActive: doctor.isActive
            }
        });
    } catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};

// DELETE DOCTOR
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({
      userId: req.params.userId,
      role: 'doctor'
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor account not found.' });
    }

    await User.deleteOne({
      userId: req.params.userId,
      role: 'doctor'
    });

    return res.status(200).json({
      message: 'Doctor account deleted successfully.'
    });
  } catch (e) {
    return res.status(500).json({ message: 'Unable to delete Doctor account.' });
  }
};

// UPDATE DOCTOR (edit details)
const updateDoctor = async (req, res) => {
  const { userId } = req.params;
  const { name, email, isConsultant, consultantType } = req.body;
  try {
    const doc = await User.findOneAndUpdate(
      { userId, role: 'doctor' },
      { name, email, isConsultant, consultantType },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ message: 'Doctor updated', doctor: doc });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

module.exports = {
  createUser,
  getDoctors,
  deleteDoctor,
  updateDoctor,
  updateDoctorStatus,
};
