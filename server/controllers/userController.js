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

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const AVAILABILITY_DAYS = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];

    const AVAILABILITY_TIMES = [
      '09:00',
      '10:30',
      '13:30',
      '15:00'
    ];

    let finalUserId = String(userId).trim();
    let savedUser = null;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const existingUser = await User.findOne({ userId: finalUserId });
      if (existingUser) {
        if (role === 'doctor') {
          finalUserId = await computeNextDoctorId();
        } else if (role === 'patient') {
          finalUserId = await computeNextPatientId();
        }
      }

      let doctorSchedule = {};
      if (role === 'doctor') {
        const number = parseInt(String(finalUserId).replace(/\D/g, ''), 10) || 1;
        const dayIndex = (number - 1) % AVAILABILITY_DAYS.length;
        const timeIndex = Math.floor((number - 1) / AVAILABILITY_DAYS.length) % AVAILABILITY_TIMES.length;
        doctorSchedule = {
          availabilityDay: AVAILABILITY_DAYS[dayIndex],
          availabilityTime: AVAILABILITY_TIMES[timeIndex]
        };
      }

      const newUser = new User({
        userId: finalUserId,
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        isConsultant: isConsultant || false,
        consultantType: consultantType || '',
        specialization: role === 'doctor' ? specialization : undefined,
        availabilityDay: role === 'doctor' ? doctorSchedule.availabilityDay : undefined,
        availabilityTime: role === 'doctor' ? doctorSchedule.availabilityTime : undefined,
        weeklyAvailability: role === 'doctor'
          ? [{ day: doctorSchedule.availabilityDay, time: doctorSchedule.availabilityTime }]
          : []
      });

      try {
        savedUser = await newUser.save();
        break;
      } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.userId) {
          if (role === 'doctor') {
            finalUserId = await computeNextDoctorId();
          } else if (role === 'patient') {
            finalUserId = await computeNextPatientId();
          }
          continue;
        }
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.email) {
          return res.status(400).json({ message: 'Email already exists.' });
        }
        throw saveError;
      }
    }

    if (!savedUser) {
      return res.status(500).json({ message: 'Unable to create user account.' });
    }

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        userId: savedUser.userId,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        isConsultant: savedUser.isConsultant,
        consultantType: savedUser.consultantType,
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

// LIST PATIENTS (admin view)
const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('userId name email role isActive createdAt')
      .sort({ createdAt: -1 });
    return res.status(200).json({ patients });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch Patient accounts.' });
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

// DELETE PATIENT
const deletePatient = async (req, res) => {
  try {
    const { userId } = req.params;

    const patient = await User.findOne({
      userId,
      role: 'patient'
    });

    if (!patient) {
      return res.status(404).json({
        message: 'Patient account not found.'
      });
    }

    await User.deleteOne({
      userId,
      role: 'patient'
    });

    return res.status(200).json({
      message: 'Patient account deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to delete Patient account.'
    });
  }
};

// GET APPOINTMENT DOCTORS (patient view)
const getAppointmentDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isActive: { $ne: false }
    })
      .select('userId name specialization weeklyAvailability availabilityDay availabilityTime')
      .sort({ specialization: 1, name: 1 });

    // Migrate legacy availability on-the-fly for any doctor missing weeklyAvailability
    const results = doctors.map((doc) => {
      const d = doc.toObject();
      if (
        (!d.weeklyAvailability || d.weeklyAvailability.length === 0) &&
        d.availabilityDay &&
        d.availabilityTime
      ) {
        d.weeklyAvailability = [
          { day: d.availabilityDay, time: d.availabilityTime }
        ];
      }
      return {
        userId: d.userId,
        name: d.name,
        specialization: d.specialization,
        weeklyAvailability: d.weeklyAvailability || []
      };
    });

    return res.status(200).json({ doctors: results });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch appointment doctors.' });
  }
};

// GET DOCTOR PROFILE (doctor's own profile)
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await User.findOne({
      userId: req.user.userId,
      role: 'doctor'
    }).select(
      'userId name email specialization isActive weeklyAvailability'
    );

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor profile not found.'
      });
    }

    return res.status(200).json({
      doctor
    });
  } catch (error) {
    console.error(
      'Doctor profile error:',
      error.message
    );
    return res.status(500).json({
      message: 'Unable to load Doctor profile.'
    });
  }
};

// UPDATE DOCTOR AVAILABILITY (doctor updates own weekly schedule)
const updateDoctorAvailability = async (req, res) => {
  const VALID_DAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
  ];
  const DAY_ORDER = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
    Friday: 4, Saturday: 5, Sunday: 6
  };
  const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

  try {
    const { weeklyAvailability } = req.body;

    if (!Array.isArray(weeklyAvailability)) {
      return res.status(400).json({ message: 'weeklyAvailability must be an array.' });
    }

    if (weeklyAvailability.length > 14) {
      return res.status(400).json({ message: 'Maximum 14 availability slots allowed.' });
    }

    // Validate each slot
    for (const slot of weeklyAvailability) {
      if (!slot.day || !VALID_DAYS.includes(slot.day)) {
        return res.status(400).json({ message: `Invalid day: ${slot.day || '(empty)'}` });
      }
      if (!slot.time || !TIME_REGEX.test(slot.time)) {
        return res.status(400).json({ message: `Invalid time format: ${slot.time || '(empty)'}. Use HH:MM.` });
      }
    }

    // Reject duplicates
    const seen = new Set();
    for (const slot of weeklyAvailability) {
      const key = `${slot.day}-${slot.time}`;
      if (seen.has(key)) {
        return res.status(400).json({ message: `Duplicate slot: ${slot.day} ${slot.time}` });
      }
      seen.add(key);
    }

    // Sort: by day order, then by time
    const sorted = [...weeklyAvailability].sort((a, b) => {
      const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
      if (dayDiff !== 0) return dayDiff;
      return a.time.localeCompare(b.time);
    });

    const doctor = await User.findOneAndUpdate(
      { userId: req.user.userId, role: 'doctor' },
      { $set: { weeklyAvailability: sorted } },
      { new: true }
    ).select('userId name email specialization isActive weeklyAvailability');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    return res.status(200).json({
      message: 'Availability updated successfully.',
      weeklyAvailability: doctor.weeklyAvailability
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update availability.' });
  }
};

// -----------------------------------------------------------------------
// HELPERS for patient self-registration
// -----------------------------------------------------------------------

async function computeNextDoctorId() {
  const doctors = await User.find({ role: 'doctor', userId: /^D\d+$/i }).select('userId');
  let highestNumber = 0;
  for (const doc of doctors) {
    const match = doc.userId.match(/^D(\d+)$/i);
    if (!match) {
      continue;
    }
    const number = parseInt(match[1], 10);
    if (Number.isFinite(number) && number > highestNumber) {
      highestNumber = number;
    }
  }
  return `D${String(highestNumber + 1).padStart(3, '0')}`;
}

// GET /api/users/next-doctor-id — protected, admin only
const getNextDoctorId = async (req, res) => {
  try {
    const nextDoctorId = await computeNextDoctorId();
    return res.status(200).json({ nextDoctorId });
  } catch (error) {
    console.error('Next Doctor ID error:', error.message);
    return res.status(500).json({ message: 'Unable to generate Doctor ID.' });
  }
};

async function computeNextPatientId() {
  const patients = await User.find({ role: 'patient', userId: /^P\d+$/i }).select('userId');
  let highestNumber = 0;
  for (const patient of patients) {
    const match = patient.userId.match(/^P(\d+)$/i);
    if (!match) {
      continue;
    }
    const number = parseInt(match[1], 10);
    if (Number.isFinite(number) && number > highestNumber) {
      highestNumber = number;
    }
  }
  return `P${String(highestNumber + 1).padStart(4, '0')}`;
}

// GET /api/users/next-patient-id — public, returns only the next preview ID
const getNextPatientId = async (req, res) => {
  try {
    const nextPatientId = await computeNextPatientId();
    return res.status(200).json({ nextPatientId });
  } catch (error) {
    console.error(
      'Next Patient ID error:',
      error.message
    );
    return res.status(500).json({ message: 'Unable to generate Patient ID.' });
  }
};

// POST /api/users/register-patient — public endpoint for patient self-registration
const registerPatient = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Check email uniqueness before attempting ID generation
    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Try up to 3 times in case of concurrent registrations causing duplicate userId
    const MAX_RETRIES = 3;
    let savedUser = null;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const nextId = await computeNextPatientId();

      const newPatient = new User({
        userId: nextId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'patient',        // always forced — never from request body
        isActive: true,          // always true — never from request body
        isConsultant: false,
        consultantType: '',
        weeklyAvailability: [],
      });

      try {
        savedUser = await newPatient.save();
        break; // success
      } catch (saveError) {
        // Duplicate key on userId → retry
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.userId) {
          lastError = saveError;
          continue;
        }
        // Duplicate key on email → someone else registered with same email concurrently
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.email) {
          return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        throw saveError; // unexpected error
      }
    }

    if (!savedUser) {
      console.error('Patient registration failed after retries:', lastError);
      return res.status(500).json({ message: 'Unable to create account. Please try again.' });
    }

    return res.status(201).json({
      message: 'Patient account created successfully.',
      user: {
        userId: savedUser.userId,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createUser,
  getDoctors,
  getPatients,
  getAppointmentDoctors,
  getDoctorProfile,
  updateDoctorAvailability,
  deleteDoctor,
  deletePatient,
  updateDoctor,
  updateDoctorStatus,
  getNextPatientId,
  getNextDoctorId,
  registerPatient,
};


