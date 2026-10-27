// server/controllers/prescriptionController.js
const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Doctor creates a prescription for a patient
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, patientUserId, medication, dosage, instructions } = req.body;
    // Validate required fields
    if (!patientUserId || !medication || !dosage || !instructions) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    // Verify patient exists and has role 'patient'
    const patient = await User.findOne({ userId: patientUserId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    let validAppointmentId = null;
    if (appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID.' });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (
        !appointment ||
        appointment.doctorUserId !== req.user.userId ||
        appointment.patientUserId !== patientUserId ||
        appointment.status !== 'approved'
      ) {
        return res.status(400).json({
          message: 'Invalid or unauthorized appointment for prescription attachment.'
        });
      }

      validAppointmentId = appointment._id;
    }

    // Create prescription, doctorUserId from JWT (req.user.userId)
    const prescriptionData = {
      doctorUserId: req.user.userId,
      patientUserId,
      medication: medication.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim()
    };

    if (validAppointmentId) {
      prescriptionData.appointmentId = validAppointmentId;
    }

    const prescription = new Prescription(prescriptionData);
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

    const doctorUserIds = [...new Set(prescriptions.map((p) => p.doctorUserId).filter(Boolean))];
    const appointmentIds = [...new Set(prescriptions.map((p) => p.appointmentId).filter(Boolean))];

    const [doctorUsers, appointments] = await Promise.all([
      User.find({ userId: { $in: doctorUserIds } }).select('userId name specialization'),
      Appointment.find({ _id: { $in: appointmentIds } }).select('_id appointmentDate reason')
    ]);

    const doctorMap = {};
    doctorUsers.forEach((u) => {
      doctorMap[u.userId] = {
        name: u.name,
        specialization: u.specialization || ''
      };
    });

    const appointmentMap = {};
    appointments.forEach((a) => {
      appointmentMap[a._id.toString()] = {
        appointmentDate: a.appointmentDate,
        reason: a.reason
      };
    });

    const enriched = prescriptions.map((p) => {
      const doc = doctorMap[p.doctorUserId] || {};
      const appt = p.appointmentId ? appointmentMap[p.appointmentId.toString()] : null;

      return {
        _id: p._id,
        appointmentId: p.appointmentId || null,
        doctorUserId: p.doctorUserId,
        doctorName: doc.name || 'Unknown Doctor',
        doctorSpecialization: doc.specialization || '',
        appointmentDate: appt ? appt.appointmentDate : null,
        appointmentReason: appt ? appt.reason : 'Not available',
        medication: p.medication,
        dosage: p.dosage,
        instructions: p.instructions,
        createdAt: p.createdAt
      };
    });

    res.json({ prescriptions: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions
};
