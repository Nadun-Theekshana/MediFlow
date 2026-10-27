// src/components/DoctorDashboard.jsx

import { useEffect, useState } from 'react';
import '../styles/DoctorDashboard.css';

// Helpers for current calendar week (Monday 00:00:00.000 to Sunday 23:59:59.999)
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function isDateInCurrentWeek(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const { monday, sunday } = getCurrentWeekRange();
  return d >= monday && d <= sunday;
}

function formatWeekRangeDisplay() {
  const { monday, sunday } = getCurrentWeekRange();
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
}

export default function DoctorDashboard({ user, onLogout }) {
  // =========================================================
  // STATE
  // =========================================================

  const [view, setView] = useState('home');

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // approvingId removed — Admin now handles approval
  const [rejectingId, setRejectingId] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const token = sessionStorage.getItem('token');

  // Doctor Profile & Schedule state
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  // Weekly Patients for Prescriptions state
  const [prescriptionPatientPage, setPrescriptionPatientPage] = useState(1);
  const [selectedPrescriptionAppointment, setSelectedPrescriptionAppointment] = useState(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([
    { medication: '', dosage: '', instructions: '' },
  ]);
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [prescriptionMessage, setPrescriptionMessage] = useState('');
  const [prescriptionError, setPrescriptionError] = useState('');
  const [prescriptionModalError, setPrescriptionModalError] = useState('');

  // =========================================================
  // ROLE GUARD
  // =========================================================

  if (!user || user.role !== 'doctor') {
    return (
      <div className="doctor-unauthorized">
        <h2>Unauthorized access</h2>
      </div>
    );
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  const changeView = (newView) => {
    setError('');
    setSuccessMessage('');
    setPrescriptionMessage('');
    setPrescriptionError('');
    setPrescriptionPatientPage(1);
    setView(newView);
  };

  // =========================================================
  // FETCH APPOINTMENTS
  // =========================================================

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/appointments/doctor',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        onLogout();
        return;
      }

      if (response.status === 403) {
        setError(
          'You are not authorized to perform this action.'
        );
        return;
      }

      if (!response.ok) {
        setError(
          'Unable to connect to the server. Please try again.'
        );
        return;
      }

      const data = await response.json();

      setAppointments(
        Array.isArray(data)
          ? data
          : data.appointments || []
      );
    } catch (error) {
      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // NOTE: Approve functionality moved to Admin — Doctors can only Reject.

  // =========================================================
  // REJECT
  // =========================================================

  const rejectAppointment = async (id) => {
    setRejectingId(id);
    setSuccessMessage('');
    setError('');

    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/${id}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: 'rejected',
          }),
        }
      );

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        onLogout();
        return;
      }

      if (response.status === 403) {
        setError(
          'You are not authorized to perform this action.'
        );
        return;
      }

      if (response.status === 404) {
        setError('Appointment not found.');
        return;
      }

      if (response.status === 400) {
        setError('Invalid request.');
        return;
      }

      if (!response.ok) {
        setError(
          'Unable to connect to the server. Please try again.'
        );
        return;
      }

      setSuccessMessage(
        'Appointment rejected successfully.'
      );

      await fetchAppointments();
    } catch (error) {
      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setRejectingId('');
    }
  };

  // =========================================================
  // LOAD APPOINTMENTS WHEN VIEW OPENS
  // =========================================================

  // Fetch doctor profile when doctorProfile view is opened
  const fetchDoctorProfile = async () => {
    setAvailabilityLoading(true);
    setAvailabilityError('');
    setAvailabilityMessage('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/users/doctor/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setAvailabilityError(data.message || 'Unable to load profile.');
        return;
      }

      setDoctorProfile(data.doctor);
      setWeeklyAvailability(
        Array.isArray(data.doctor?.weeklyAvailability)
          ? data.doctor.weeklyAvailability.map((s) => ({ day: s.day, time: s.time }))
          : []
      );
    } catch (err) {
      setAvailabilityError('Unable to connect to the server. Please try again.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Save weekly availability
  const saveAvailability = async () => {
    setAvailabilitySaving(true);
    setAvailabilityError('');
    setAvailabilityMessage('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/users/doctor/availability',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ weeklyAvailability }),
        }
      );

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setAvailabilityError(data.message || 'Unable to save availability.');
        return;
      }

      setAvailabilityMessage(data.message || 'Availability updated successfully.');
      setWeeklyAvailability(
        Array.isArray(data.weeklyAvailability)
          ? data.weeklyAvailability.map((s) => ({ day: s.day, time: s.time }))
          : weeklyAvailability
      );
    } catch (err) {
      setAvailabilityError('Unable to connect to the server. Please try again.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  useEffect(() => {
    if (view === 'appointments' || view === 'prescriptionPatients') {
      fetchAppointments();
    } else if (view === 'doctorProfile') {
      fetchDoctorProfile();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // =========================================================
  // ICONS
  // =========================================================

  const LogoIcon = () => (
    <svg
      className="doctor-logo-icon"
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <rect x="22" y="4" width="20" height="56" rx="8" />
      <rect x="4" y="22" width="56" height="20" rx="8" />

      <path
        className="doctor-logo-pulse"
        d="M10 33h12l5-9 8 18 6-12 4 3h9"
      />
    </svg>
  );

  const DoctorIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="17" r="10" />

      <path d="M16 57c1-16 7-25 16-25s15 9 16 25" />

      <path
        className="doctor-stethoscope"
        d="M21 35v9c0 5 4 9 9 9s9-4 9-9v-9M39 51c0 4 3 7 7 7"
      />

      <circle
        className="doctor-stethoscope"
        cx="48"
        cy="57"
        r="3"
      />
    </svg>
  );

  const PatientCareIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="20" r="10" />
      <circle cx="15" cy="26" r="7" />
      <circle cx="49" cy="26" r="7" />

      <path d="M17 54c1-12 6-18 15-18s14 6 15 18H17z" />
      <path d="M2 52c1-9 5-14 13-14 4 0 7 1 9 4-3 3-5 6-6 10H2z" />
      <path d="M46 52c-1-4-3-7-6-10 2-3 5-4 9-4 8 0 12 5 13 14H46z" />
    </svg>
  );

  const HospitalIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M13 18h38v39H13z" />
      <path d="M22 8h20v49H22z" />

      <rect x="29" y="13" width="6" height="18" />
      <rect x="23" y="19" width="18" height="6" />

      <rect x="18" y="35" width="6" height="6" />
      <rect x="40" y="35" width="6" height="6" />
      <rect x="18" y="46" width="6" height="6" />
      <rect x="40" y="46" width="6" height="6" />
    </svg>
  );

  const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );

  // =========================================================
  // HOME
  // =========================================================

  const renderHome = () => (
    <section className="doctor-home">
      <div className="doctor-welcome">
        <h2>
          Welcome, <span>{user.name}</span>
        </h2>

        <p>
          Doctor ID: {user.userId}
        </p>
      </div>

      <div className="doctor-card-grid">

        {/* DOCTOR ACCESS */}

        <button
          type="button"
          className="doctor-feature-card"
          onClick={() =>
            changeView('doctorProfile')
          }
        >
          <div className="doctor-card-icon">
            <DoctorIcon />
          </div>

          <h3>Doctor Access</h3>

          <p>
            Access your MediFlow doctor workspace.
          </p>

          <div className="doctor-card-arrow">
            <ArrowIcon />
          </div>
        </button>

        {/* PATIENT CARE */}

        <button
          type="button"
          className="doctor-feature-card"
          onClick={() =>
            changeView('appointments')
          }
        >
          <div className="doctor-card-icon">
            <PatientCareIcon />
          </div>

          <h3>Patient Care</h3>

          <p>
            Patient-related functions will be available
            from your authorized workspace.
          </p>

          <div className="doctor-card-arrow">
            <ArrowIcon />
          </div>
        </button>

        {/* PRESCRIPTIONS */}

        <button
          type="button"
          className="doctor-feature-card"
          onClick={() =>
            changeView('prescriptionPatients')
          }
        >
          <div className="doctor-card-icon">
            <HospitalIcon />
          </div>

          <h3>Prescriptions</h3>

          <p>
            Manage weekly patient prescriptions and prescribed medicines.
          </p>

          <div className="doctor-card-arrow">
            <ArrowIcon />
          </div>
        </button>

      </div>
    </section>
  );

  // =========================================================
  // APPOINTMENTS
  // =========================================================

  const renderAppointments = () => (
    <section className="doctor-appointments-view">

      <div className="doctor-section-heading">
        <p>APPOINTMENTS</p>

        <h2>My Appointments</h2>

        <span>
          Review and manage appointments assigned to you.
        </span>
      </div>

      {error && (
        <div className="doctor-message error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="doctor-message success">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="doctor-empty-state">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="doctor-empty-state">
          No appointments assigned.
        </div>
      ) : (
        <div className="doctor-appointment-grid">

          {appointments.map((appt) => (
            <article
              key={appt._id}
              className="doctor-appointment-card"
            >
              <div className="doctor-appointment-top">

                <h3>
                  Appointment
                </h3>

                <span
                  className={`doctor-status ${appt.status}`}
                >
                  {appt.status
                    ? appt.status.charAt(0).toUpperCase() +
                    appt.status.slice(1)
                    : 'Pending'}
                </span>

              </div>

              <div className="doctor-appointment-row">
                <span>Patient ID</span>

                <strong>
                  {appt.patientUserId}
                </strong>
              </div>

              <div className="doctor-appointment-row">
                <span>Date</span>

                <strong>
                  {new Date(
                    appt.appointmentDate
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="doctor-appointment-row">
                <span>Reason</span>

                <strong>
                  {appt.reason}
                </strong>
              </div>

              {appt.status === 'pending' && (
                <div className="doctor-appointment-actions">

                  <button
                    type="button"
                    className="doctor-reject-btn"
                    onClick={() =>
                      rejectAppointment(appt._id)
                    }
                    disabled={rejectingId === appt._id}
                  >
                    {rejectingId === appt._id
                      ? 'Rejecting...'
                      : 'Reject'}
                  </button>

                </div>
              )}

            </article>
          ))}

        </div>
      )}

    </section>
  );

  // =========================================================
  // DOCTOR PROFILE & SCHEDULE
  // =========================================================

  const handleAvailabilityDayChange = (index, value) => {
    setWeeklyAvailability((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, day: value } : slot
      )
    );
  };

  const handleAvailabilityTimeChange = (index, value) => {
    setWeeklyAvailability((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, time: value } : slot
      )
    );
  };

  const removeAvailabilityRow = (index) => {
    setWeeklyAvailability((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const addAvailabilityRow = () => {
    setWeeklyAvailability((prev) => [
      ...prev,
      { day: '', time: '' },
    ]);
  };

  const renderDoctorProfile = () => (
    <section className="dps-page">

      <div className="doctor-section-heading">
        <p>DOCTOR WORKSPACE</p>
        <h2>Doctor Profile &amp; Schedule</h2>
        <span>
          View your professional information and manage your weekly availability.
        </span>
      </div>

      {availabilityLoading ? (
        <div className="doctor-empty-state">
          Loading profile...
        </div>
      ) : (
        <>
          {/* DOCTOR INFORMATION CARD */}
          <div className="dps-info-card">
            <h3 className="dps-card-title">Doctor Information</h3>

            <div className="dps-info-grid">
              <div className="dps-info-row">
                <span>Doctor ID</span>
                <strong>{doctorProfile?.userId || user.userId}</strong>
              </div>

              <div className="dps-info-row">
                <span>Name</span>
                <strong>{doctorProfile?.name || user.name}</strong>
              </div>

              <div className="dps-info-row">
                <span>Email</span>
                <strong>{doctorProfile?.email || user.email || 'N/A'}</strong>
              </div>

              <div className="dps-info-row">
                <span>Specialization</span>
                <strong>{doctorProfile?.specialization || 'N/A'}</strong>
              </div>

              <div className="dps-info-row">
                <span>Account Status</span>
                <strong>
                  <span
                    className={
                      (doctorProfile?.isActive !== false)
                        ? 'dps-status active'
                        : 'dps-status inactive'
                    }
                  >
                    {(doctorProfile?.isActive !== false)
                      ? '● Active'
                      : '● Inactive'}
                  </span>
                </strong>
              </div>
            </div>
          </div>

          {/* WEEKLY AVAILABILITY CARD */}
          <div className="dps-availability-card">
            <h3 className="dps-card-title">Weekly Availability</h3>
            <p className="dps-card-subtitle">
              Set the weekly times when Patients can request appointments with you.
            </p>

            {availabilityError && (
              <div className="doctor-message error">
                {availabilityError}
              </div>
            )}

            {availabilityMessage && (
              <div className="doctor-message success">
                {availabilityMessage}
              </div>
            )}

            {weeklyAvailability.length === 0 ? (
              <div className="dps-empty-state">
                No weekly availability configured.
              </div>
            ) : (
              <table className="dps-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyAvailability.map((slot, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          className="dps-day-select"
                          value={slot.day}
                          onChange={(e) =>
                            handleAvailabilityDayChange(
                              index,
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select day</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="time"
                          className="dps-time-input"
                          value={slot.time}
                          onChange={(e) =>
                            handleAvailabilityTimeChange(
                              index,
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dps-remove-btn"
                          onClick={() =>
                            removeAvailabilityRow(index)
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="dps-actions">
              <button
                type="button"
                className="dps-add-btn"
                onClick={addAvailabilityRow}
              >
                + Add Availability
              </button>

              <button
                type="button"
                className="dps-save-btn"
                onClick={saveAvailability}
                disabled={availabilitySaving}
              >
                {availabilitySaving
                  ? 'Saving...'
                  : 'Save Availability'}
              </button>
            </div>
          </div>
        </>
      )}

    </section>
  );

  // =========================================================
  // WEEKLY PATIENTS FOR PRESCRIPTIONS HANDLERS
  // =========================================================

  const openPrescriptionModal = (appt) => {
    setSelectedPrescriptionAppointment(appt);
    setPrescriptionMedicines([
      { medication: '', dosage: '', instructions: '' },
    ]);
    setPrescriptionModalError('');
    setPrescriptionModalOpen(true);
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setSelectedPrescriptionAppointment(null);
    setPrescriptionMedicines([
      { medication: '', dosage: '', instructions: '' },
    ]);
    setPrescriptionModalError('');
  };

  const addMedicineRow = () => {
    setPrescriptionMedicines((prev) => [
      ...prev,
      { medication: '', dosage: '', instructions: '' },
    ]);
  };

  const removeMedicineRow = (index) => {
    setPrescriptionMedicines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMedicineChange = (index, field, value) => {
    setPrescriptionMedicines((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const savePrescription = async () => {
    setPrescriptionModalError('');
    setPrescriptionError('');

    const hasEmptyField = prescriptionMedicines.some(
      (m) => !m.medication.trim() || !m.dosage.trim() || !m.instructions.trim()
    );

    if (hasEmptyField) {
      setPrescriptionModalError('Please complete all medicine details.');
      return;
    }

    setPrescriptionSaving(true);

    try {
      for (const med of prescriptionMedicines) {
        const res = await fetch('http://localhost:5000/api/prescriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentId: selectedPrescriptionAppointment?._id,
            patientUserId: selectedPrescriptionAppointment.patientUserId,
            medication: med.medication.trim(),
            dosage: med.dosage.trim(),
            instructions: med.instructions.trim(),
          }),
        });

        if (res.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          onLogout();
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Unable to save prescription.');
        }
      }

      closePrescriptionModal();
      setPrescriptionMessage('Prescription saved successfully.');
    } catch (err) {
      setPrescriptionModalError(
        err.message || 'Unable to save prescription. Please try again.'
      );
    } finally {
      setPrescriptionSaving(false);
    }
  };

  // =========================================================
  // WEEKLY PATIENTS FOR PRESCRIPTIONS VIEW
  // =========================================================

  const renderWeeklyPrescriptionPatients = () => {
    const weeklyApprovedAppointments = appointments.filter((appt) => {
      return (
        appt.status === 'approved' &&
        isDateInCurrentWeek(appt.appointmentDate)
      );
    });

    const PAGE_SIZE = 7;
    const totalPages =
      Math.ceil(weeklyApprovedAppointments.length / PAGE_SIZE) || 1;
    const currentPage = Math.min(prescriptionPatientPage, totalPages);
    const pagedAppointments = weeklyApprovedAppointments.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

    return (
      <section className="wps-page">
        <div className="wps-header-row">
          <div className="doctor-section-heading">
            <p>PRESCRIPTIONS</p>
            <h2>Weekly Patients for Prescriptions</h2>
            <span>
              View this week's appointed patients and add prescriptions.
            </span>
          </div>

          <div className="wps-week-label">
            {formatWeekRangeDisplay()}
          </div>
        </div>

        {prescriptionError && (
          <div className="doctor-message error">
            {prescriptionError}
          </div>
        )}

        {prescriptionMessage && (
          <div className="doctor-message success">
            {prescriptionMessage}
          </div>
        )}

        {loading ? (
          <div className="doctor-empty-state">
            Loading appointments...
          </div>
        ) : weeklyApprovedAppointments.length === 0 ? (
          <div className="wps-card">
            <div className="doctor-empty-state">
              No approved patient appointments for this week.
            </div>
          </div>
        ) : (
          <div className="wps-card">
            <table className="wps-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Appointment Date &amp; Time</th>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedAppointments.map((appt, idx) => {
                  const rowNumber = (currentPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={appt._id}>
                      <td>{rowNumber}</td>
                      <td>
                        {new Date(appt.appointmentDate).toLocaleString()}
                      </td>
                      <td>{appt.patientUserId}</td>
                      <td>{appt.patientName || appt.patientUserId}</td>
                      <td>{appt.reason}</td>
                      <td>
                        <span className="wps-status approved">
                          Approved
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="wps-add-prescription-btn"
                          onClick={() => openPrescriptionModal(appt)}
                        >
                          Add Prescription
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="wps-pagination">
                <button
                  type="button"
                  className="wps-page-btn"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPrescriptionPatientPage((p) => Math.max(1, p - 1))
                  }
                >
                  Previous
                </button>

                <span className="wps-page-info">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="wps-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPrescriptionPatientPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODAL */}
        {prescriptionModalOpen && selectedPrescriptionAppointment && (
          <div
            className="wps-modal-overlay"
            onClick={closePrescriptionModal}
          >
            <div
              className="wps-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wps-modal-title"
            >
              <div className="wps-modal-header">
                <h3 id="wps-modal-title">Add Prescription</h3>
                <button
                  type="button"
                  className="wps-modal-close"
                  onClick={closePrescriptionModal}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="wps-patient-summary">
                <div className="wps-summary-item">
                  <span className="wps-summary-label">Patient:</span>
                  <span className="wps-summary-value">
                    {selectedPrescriptionAppointment.patientName ||
                      selectedPrescriptionAppointment.patientUserId}{' '}
                    ({selectedPrescriptionAppointment.patientUserId})
                  </span>
                </div>

                <div className="wps-summary-item">
                  <span className="wps-summary-label">Appointment:</span>
                  <span className="wps-summary-value">
                    {new Date(
                      selectedPrescriptionAppointment.appointmentDate
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="wps-summary-item">
                  <span className="wps-summary-label">Reason:</span>
                  <span className="wps-summary-value">
                    {selectedPrescriptionAppointment.reason}
                  </span>
                </div>
              </div>

              {prescriptionModalError && (
                <div className="doctor-message error">
                  {prescriptionModalError}
                </div>
              )}

              <div className="wps-modal-body">
                <div className="wps-table-heading">
                  Prescription Details
                </div>

                <table className="wps-medicine-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Instructions</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionMedicines.map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="wps-medicine-input"
                            placeholder="e.g. Paracetamol"
                            value={row.medication}
                            onChange={(e) =>
                              handleMedicineChange(
                                index,
                                'medication',
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="wps-medicine-input"
                            placeholder="e.g. 500 mg"
                            value={row.dosage}
                            onChange={(e) =>
                              handleMedicineChange(
                                index,
                                'dosage',
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="wps-medicine-input"
                            placeholder="e.g. Twice daily after meals"
                            value={row.instructions}
                            onChange={(e) =>
                              handleMedicineChange(
                                index,
                                'instructions',
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="wps-remove-medicine-btn"
                            disabled={prescriptionMedicines.length <= 1}
                            onClick={() => removeMedicineRow(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="wps-add-medicine-row">
                  <button
                    type="button"
                    className="wps-add-medicine-btn"
                    onClick={addMedicineRow}
                  >
                    + Add Another Medicine
                  </button>
                </div>
              </div>

              <div className="wps-modal-actions">
                <button
                  type="button"
                  className="wps-cancel-btn"
                  onClick={closePrescriptionModal}
                  disabled={prescriptionSaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="wps-save-btn"
                  onClick={savePrescription}
                  disabled={prescriptionSaving}
                >
                  {prescriptionSaving
                    ? 'Saving...'
                    : 'Save Prescription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  // =========================================================
  // CONTENT
  // =========================================================

  const renderContent = () => {
    switch (view) {
      case 'appointments':
        return renderAppointments();

      case 'doctorProfile':
        return renderDoctorProfile();

      case 'prescriptionPatients':
        return renderWeeklyPrescriptionPatients();

      default:
        return renderHome();
    }
  };

  // =========================================================
  // MAIN RETURN
  // =========================================================

  return (
    <div className="doctor-dashboard">

      {/* HEADER */}

      <header className="doctor-header">

        <button
          type="button"
          className="doctor-brand"
          onClick={() =>
            changeView('home')
          }
        >
          <LogoIcon />

          <span className="doctor-wordmark">
            Medi<span>Flow</span>
          </span>
        </button>

        <nav className="doctor-nav">

          <button
            type="button"
            onClick={() =>
              changeView('home')
            }
            className={
              view === 'home'
                ? 'doctor-nav-btn active'
                : 'doctor-nav-btn'
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              changeView('appointments')
            }
            className={
              view === 'appointments'
                ? 'doctor-nav-btn active'
                : 'doctor-nav-btn'
            }
          >
            My Appointments
          </button>

          <button
            type="button"
            onClick={() =>
              changeView('prescriptionPatients')
            }
            className={
              view === 'prescriptionPatients'
                ? 'doctor-nav-btn active'
                : 'doctor-nav-btn'
            }
          >
            Prescriptions
          </button>

          <button
            type="button"
            className="doctor-nav-btn"
          >
            Patients
          </button>

        </nav>

        <button
          type="button"
          className="doctor-logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>

      </header>

      {/* MAIN */}

      <main className="doctor-content">
        {renderContent()}
      </main>

      {/* FOOTER */}

      <footer className="doctor-footer">
        All Rights Reserved | 2026 MediFlow Web Team
      </footer>

    </div>
  );
}