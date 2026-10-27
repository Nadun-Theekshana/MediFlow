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

    const patientIds = [...new Set(appointments.map((a) => a.patientUserId))];
    const patients = await User.find({ userId: { $in: patientIds } }).select('userId name');
    const patientMap = Object.fromEntries(patients.map((p) => [p.userId, p.name]));

    const enriched = appointments.map((a) => ({
      ...a.toObject(),
      patientName: patientMap[a.patientUserId] || 'Unknown Patient'
    }));

    res.json({ appointments: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Doctor update appointment status (reject only — approve is Admin-only)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Block Doctor from approving — only Admin can approve
    if (status === 'approved') {
      return res.status(403).json({ message: 'Only the Administrator can approve appointments.' });
    }

    if (!['rejected'].includes(status)) {
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

// Admin: get ALL appointments with patient + doctor names resolved
const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });

    // Collect unique user IDs to resolve names in one query each
    const patientIds = [...new Set(appointments.map((a) => a.patientUserId))];
    const doctorIds  = [...new Set(appointments.map((a) => a.doctorUserId))];

    const [patientUsers, doctorUsers] = await Promise.all([
      User.find({ userId: { $in: patientIds } }).select('userId name'),
      User.find({ userId: { $in: doctorIds  } }).select('userId name'),
    ]);

    const patientMap = {};
    patientUsers.forEach((u) => { patientMap[u.userId] = u.name; });

    const doctorMap = {};
    doctorUsers.forEach((u) => { doctorMap[u.userId] = u.name; });

    const result = appointments.map((a) => ({
      _id:             a._id,
      patientUserId:   a.patientUserId,
      patientName:     patientMap[a.patientUserId] || 'Unknown Patient',
      doctorUserId:    a.doctorUserId,
      doctorName:      doctorMap[a.doctorUserId]   || 'Unknown Doctor',
      appointmentDate: a.appointmentDate,
      reason:          a.reason,
      status:          a.status,
      createdAt:       a.createdAt,
    }));

    res.json({ appointments: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: approve a single pending appointment
const approveAppointmentByAdmin = async (req, res) => {
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

    if (appointment.status === 'approved') {
      return res.status(400).json({ message: 'Appointment is already approved.' });
    }
    if (appointment.status === 'rejected') {
      return res.status(400).json({ message: 'Rejected appointments cannot be approved.' });
    }
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled appointments cannot be approved.' });
    }

    appointment.status = 'approved';
    await appointment.save();

    res.status(200).json({ message: 'Appointment approved successfully.', appointment });
  } catch (err) {
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

// Admin: permanently delete a cancelled appointment
const deleteCancelledAppointmentByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found.'
      });
    }

    if (appointment.status !== 'cancelled') {
      return res.status(400).json({
        message: 'Only cancelled appointments can be deleted.'
      });
    }

    await Appointment.deleteOne({
      _id: appointment._id
    });

    return res.status(200).json({
      message: 'Cancelled appointment deleted successfully.'
    });
  } catch (error) {
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Appointment not found.'
      });
    }

    console.error(
      'Delete cancelled appointment error:',
      error.message
    );

    return res.status(500).json({
      message: 'Unable to delete appointment.'
    });
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAdminAppointments,
  approveAppointmentByAdmin,
  deleteCancelledAppointmentByAdmin,
};
