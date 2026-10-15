// server/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Patient creates appointment request
const createAppointment = async (req, res) => {
  try {
    const { doctorUserId, appointmentDate, reason } = req.body;
    if (!doctorUserId || !appointmentDate || !reason) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    // Verify doctor exists and has role doctor
    const doctor = await User.findOne({ userId: doctorUserId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    const appointment = new Appointment({
      patientUserId: req.user.userId,
      doctorUserId,
      appointmentDate,
      reason,
      status: 'pending'
    });
    await appointment.save();
    res.status(201).json({ message: 'Appointment created.', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Patient view own appointments
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientUserId: req.user.userId })
      .sort({ appointmentDate: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Doctor view assigned appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorUserId: req.user.userId })
      .sort({ appointmentDate: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Doctor update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    const appointment = await Appointment.findOne({ _id: id, doctorUserId: req.user.userId });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled appointments cannot be updated.' });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be updated.' });
    }
    appointment.status = status;
    await appointment.save();
    res.json({ message: 'Status updated.', appointment });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid appointment ID.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Patient cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    let appointment;
    try {
      appointment = await Appointment.findById(id);
    } catch (err) {
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Appointment not found.' });
      }
      throw err;
    }

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.patientUserId !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this appointment.' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return res.status(200).json({
      message: 'Appointment cancelled successfully.',
      appointment
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment
};
