// src/components/PatientDashboard.jsx

import { useEffect, useState } from 'react';
import '../styles/PatientDashboard.css';

const CONSULTANT_TYPES = [
  'Consultant Physician / Internal Medicine',
  'Cardiologist',
  'Neurologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Nephrologist',
  'Pulmonologist / Respiratory Physician',
  'Oncologist',
  'General Surgeon',
  'Orthopaedic Surgeon',
  'ENT Surgeon',
  'Ophthalmologist',
  'Obstetrician & Gynaecologist',
  'Paediatrician',
  'Psychiatrist',
  'Anaesthetist',
  'Radiologist',
  'Urologist',
];

const DAY_MAP = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function buildNextDoctorSlot(dayName, time) {
  if (!dayName || !time) {
    return null;
  }

  const now = new Date();
  const targetDay = DAY_MAP[dayName];
  const [hours, minutes] = time.split(':').map(Number);
  const slot = new Date(now);

  let daysAhead = (targetDay - now.getDay() + 7) % 7;
  slot.setDate(now.getDate() + daysAhead);
  slot.setHours(hours, minutes, 0, 0);

  if (slot <= now) {
    slot.setDate(slot.getDate() + 7);
  }

  return slot;
}

function formatSlotDisplay(slotDate) {
  if (!slotDate) return '';
  const dateStr = slotDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = slotDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} - ${timeStr}`;
}

export default function PatientDashboard({ user, onLogout }) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [view, setView] = useState('home');

  const [appointmentDoctors, setAppointmentDoctors] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctorUserId, setSelectedDoctorUserId] = useState('');
  const [selectedAppointmentSlot, setSelectedAppointmentSlot] = useState('');
  const [reason, setReason] = useState('');

  const [msg, setMsg] = useState({
    type: '',
    text: '',
  });

  const [loading, setLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);

  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState('');
  const [prescriptionDoctorFilter, setPrescriptionDoctorFilter] = useState('all');

  const token = sessionStorage.getItem('token');

  // ---------------------------------------------------------------------------
  // ROLE GUARD
  // ---------------------------------------------------------------------------

  if (!user || user.role !== 'patient') {
    return (
      <div className="patient-unauthorized">
        <h2>Unauthorized access</h2>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------------------

  const changeView = (newView) => {
    setMsg({ type: '', text: '' });
    if (newView === 'prescriptions') {
      setPrescriptionDoctorFilter('all');
    }
    setView(newView);
  };

  // ---------------------------------------------------------------------------
  // REQUEST APPOINTMENT
  // ---------------------------------------------------------------------------

  const handleSpecializationChange = (e) => {
    setSelectedSpecialization(e.target.value);
    setSelectedDoctorUserId('');
    setSelectedAppointmentSlot('');
  };

  const handleDoctorChange = (e) => {
    setSelectedDoctorUserId(e.target.value);
    setSelectedAppointmentSlot('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMsg({
      type: '',
      text: '',
    });

    const trimmedReason = reason.trim();

    if (!selectedSpecialization) {
      setMsg({
        type: 'error',
        text: 'Please select a consultant type.',
      });
      return;
    }

    if (!selectedDoctorUserId) {
      setMsg({
        type: 'error',
        text: 'Please select a consultant.',
      });
      return;
    }

    if (!selectedAppointmentSlot) {
      setMsg({
        type: 'error',
        text: 'Please select an available date and time.',
      });
      return;
    }

    if (!trimmedReason) {
      setMsg({
        type: 'error',
        text: 'Reason is required.',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorUserId: selectedDoctorUserId,
          appointmentDate: selectedAppointmentSlot,
          reason: trimmedReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg({
          type: 'success',
          text: 'Appointment request submitted successfully.',
        });

        setSelectedSpecialization('');
        setSelectedDoctorUserId('');
        setSelectedAppointmentSlot('');
        setReason('');
      } else if (res.status === 400 || res.status === 404) {
        setMsg({
          type: 'error',
          text: data.message || 'Invalid appointment request.',
        });
      } else if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
      } else if (res.status === 403) {
        setMsg({
          type: 'error',
          text: 'You are not authorized to perform this action.',
        });
      } else {
        setMsg({
          type: 'error',
          text: data.message || 'Server error. Please try again.',
        });
      }
    } catch (error) {
      setMsg({
        type: 'error',
        text: 'Unable to connect to the server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // LOAD APPOINTMENTS
  // ---------------------------------------------------------------------------

  const fetchAppointments = async () => {
    setLoadingAppts(true);
    setMsg({
      type: '',
      text: '',
    });

    try {
      const res = await fetch(
        'http://localhost:5000/api/appointments/patient',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Works whether backend returns [] directly
        // or { appointments: [] }
        const appointmentData = Array.isArray(data)
          ? data
          : data.appointments || [];

        setAppointments(appointmentData);
      } else if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
      } else if (res.status === 403) {
        setMsg({
          type: 'error',
          text: 'You are not authorized to perform this action.',
        });
      } else {
        setMsg({
          type: 'error',
          text: data.message || 'Unable to load appointments.',
        });
      }
    } catch (error) {
      setMsg({
        type: 'error',
        text: 'Unable to connect to the server. Please try again.',
      });
    } finally {
      setLoadingAppts(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CANCEL APPOINTMENT
  // ---------------------------------------------------------------------------

  const handleCancelAppointment = async (appointmentId) => {
    if (!appointmentId) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );

    if (!confirmed) {
      return;
    }

    setMsg({ type: '', text: '' });
    setCancellingAppointmentId(appointmentId);

    try {
      const res = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.status === 200) {
        setAppointments((current) =>
          current.map((appointment) =>
            appointment._id === appointmentId
              ? {
                  ...appointment,
                  status: 'cancelled',
                }
              : appointment
          )
        );
        setMsg({
          type: 'success',
          text: data.message || 'Appointment cancelled successfully.',
        });
        return;
      }

      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      if (res.status === 403) {
        setMsg({
          type: 'error',
          text: data.message || 'You are not authorized to cancel this appointment.',
        });
        return;
      }

      if (res.status === 404) {
        setMsg({
          type: 'error',
          text: 'Appointment not found.',
        });
        return;
      }

      if (res.status === 400) {
        setMsg({
          type: 'error',
          text: data.message || 'Appointment is already cancelled.',
        });
        return;
      }

      setMsg({
        type: 'error',
        text: 'Unable to cancel appointment.',
      });
    } catch (err) {
      setMsg({
        type: 'error',
        text: 'Unable to cancel appointment.',
      });
    } finally {
      setCancellingAppointmentId(null);
    }
  };

  const fetchAppointmentDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/appointment-doctors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAppointmentDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Error loading appointment doctors:', err);
    }
  };

  const fetchPatientPrescriptions = async () => {
    setPrescriptionLoading(true);
    setPrescriptionError('');
    try {
      const res = await fetch('http://localhost:5000/api/prescriptions/patient', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setPrescriptionError(
          data.message || 'Unable to load prescriptions. Please try again.'
        );
        return;
      }

      setPatientPrescriptions(data.prescriptions || []);
    } catch (err) {
      setPrescriptionError('Unable to load prescriptions. Please try again.');
    } finally {
      setPrescriptionLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'appointments') {
      fetchAppointments();
    } else if (view === 'request') {
      fetchAppointmentDoctors();
    } else if (view === 'prescriptions') {
      fetchPatientPrescriptions();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ---------------------------------------------------------------------------
  // SIMPLE SVG ICONS
  // ---------------------------------------------------------------------------

  const LogoIcon = () => (
    <svg
      className="mediflow-logo-icon"
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <rect x="22" y="4" width="20" height="56" rx="8" />
      <rect x="4" y="22" width="56" height="20" rx="8" />
      <path
        className="logo-pulse"
        d="M10 33h12l5-9 8 18 6-12 4 3h9"
      />
    </svg>
  );

  const ProfileIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="22" r="12" />
      <path d="M14 55c1-13 8-20 18-20s17 7 18 20H14z" />
    </svg>
  );

  const AppointmentIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="15" width="44" height="39" rx="5" />
      <path d="M10 25h44M21 8v14M43 8v14" />
    </svg>
  );

  const HeartIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 55S8 41 8 23c0-9 6-15 14-15 5 0 9 3 10 7 2-4 6-7 11-7 8 0 13 6 13 15 0 18-24 32-24 32z" />
      <path
        className="heart-pulse"
        d="M14 31h10l4-8 7 17 5-10 4 3h7"
      />
    </svg>
  );

  const PrescriptionIcon = () => (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 8h24l14 14v34H14z" />
      <path
        className="doc-symbol"
        d="M26 34h12M32 28v12M24 48h16"
      />
    </svg>
  );

  // ---------------------------------------------------------------------------
  // HOME
  // ---------------------------------------------------------------------------

  const renderHome = () => (
    <section className="patient-home">
      <div className="welcome-area">
        <p className="welcome-small">PATIENT PORTAL</p>

        <h2>
          Welcome, <span>{user.name}</span>
        </h2>

        <p className="patient-id">
          Patient ID: <strong>{user.userId}</strong>
        </p>
      </div>

      <div className="patient-feature-grid">

        <button
          type="button"
          className="patient-feature-card"
          onClick={() => changeView('profile')}
        >
          <div className="feature-icon">
            <ProfileIcon />
          </div>

          <h3>Profile</h3>

          <p>
            View and manage your personal details.
          </p>
        </button>

        <button
          type="button"
          className="patient-feature-card"
          onClick={() => changeView('appointments')}
        >
          <div className="feature-icon">
            <AppointmentIcon />
          </div>

          <h3>Appointments</h3>

          <p>
            View and manage your appointments.
          </p>
        </button>

        <button
          type="button"
          className="patient-feature-card"
          onClick={() => changeView('prescriptions')}
        >
          <div className="feature-icon">
            <PrescriptionIcon />
          </div>

          <h3>Prescriptions</h3>

          <p>
            View prescriptions added by your doctors.
          </p>
        </button>

      </div>
    </section>
  );

  // ---------------------------------------------------------------------------
  // REQUEST APPOINTMENT VIEW
  // ---------------------------------------------------------------------------

  const renderRequestForm = () => {
    const filteredDoctors = appointmentDoctors.filter(
      (doc) => doc.specialization === selectedSpecialization
    );

    const selectedDoctor = appointmentDoctors.find(
      (doc) => doc.userId === selectedDoctorUserId
    );

    // Build all upcoming slots from doctor's weeklyAvailability
    const availableSlots = [];
    if (selectedDoctor && Array.isArray(selectedDoctor.weeklyAvailability)) {
      for (const slot of selectedDoctor.weeklyAvailability) {
        const nextDate = buildNextDoctorSlot(slot.day, slot.time);
        if (nextDate) {
          availableSlots.push(nextDate);
        }
      }
      // Sort earliest date first
      availableSlots.sort((a, b) => a.getTime() - b.getTime());
    }

    const hasNoAvailability =
      selectedDoctor &&
      (!selectedDoctor.weeklyAvailability ||
        selectedDoctor.weeklyAvailability.length === 0);

    return (
      <section className="patient-page-section">
        <div className="section-heading">
          <div>
            <p className="section-label">APPOINTMENTS</p>
            <h2>Request Appointment</h2>
            <p>
              Send an appointment request to a registered MediFlow doctor.
            </p>
          </div>
        </div>

        <form
          className="appointment-form"
          onSubmit={handleSubmit}
        >
          {msg.text && (
            <div className={`patient-message ${msg.type}`}>
              {msg.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="consultantType">
              Consultant Type
            </label>
            <select
              id="consultantType"
              className="patient-appointment-select"
              value={selectedSpecialization}
              onChange={handleSpecializationChange}
              required
            >
              <option value="">Select consultant type</option>
              {CONSULTANT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="consultant">
              Consultant
            </label>
            <select
              id="consultant"
              className="patient-appointment-select"
              value={selectedDoctorUserId}
              onChange={handleDoctorChange}
              disabled={!selectedSpecialization}
              required
            >
              <option value="">
                {!selectedSpecialization
                  ? 'Select consultant'
                  : filteredDoctors.length === 0
                  ? 'No available consultants for this type.'
                  : 'Select consultant'}
              </option>
              {filteredDoctors.map((doc) => {
                const displayName =
                  doc.name.startsWith('Dr.') || doc.name.startsWith('Dr ')
                    ? `${doc.name} (${doc.userId})`
                    : `Dr. ${doc.name} (${doc.userId})`;
                return (
                  <option key={doc.userId} value={doc.userId}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="appointmentSlot">
              Available Date & Time
            </label>
            <select
              id="appointmentSlot"
              className="patient-appointment-select"
              value={selectedAppointmentSlot}
              onChange={(e) => setSelectedAppointmentSlot(e.target.value)}
              disabled={!selectedDoctorUserId || hasNoAvailability}
              required
            >
              <option value="">
                {hasNoAvailability
                  ? 'No available appointment times'
                  : 'Select available date & time'}
              </option>
              {availableSlots.map((slot, idx) => (
                <option key={idx} value={slot.toISOString()}>
                  {formatSlotDisplay(slot)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason">
              Reason
            </label>

            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your appointment"
              rows="5"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-action-btn"
            disabled={loading}
          >
            {loading
              ? 'Submitting...'
              : 'Submit Request'}
          </button>
        </form>
      </section>
    );
  };

  // ---------------------------------------------------------------------------
  // MY APPOINTMENTS
  // ---------------------------------------------------------------------------

  const renderAppointments = () => (
    <section className="patient-page-section">
      <div className="section-heading">
        <div>
          <p className="section-label">APPOINTMENTS</p>
          <h2>My Appointments</h2>
          <p>
            View your current appointment requests and their status.
          </p>
        </div>
      </div>

      {msg.text && (
        <div className={`patient-message ${msg.type}`}>
          {msg.text}
        </div>
      )}

      {loadingAppts ? (
        <div className="simple-state">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="simple-state">
          No appointments found.
        </div>
      ) : (
        <div className="appointment-grid">
          {appointments.map((appt) => (
            <article
              key={appt._id}
              className="appointment-card"
            >
              <div className="appointment-card-top">
                <h3>
                  Appointment
                </h3>

                <span
                  className={`status-pill ${appt.status}`}
                >
                  {appt.status
                    ? appt.status.charAt(0).toUpperCase() +
                    appt.status.slice(1)
                    : 'Pending'}
                </span>
              </div>

              <div className="appointment-detail">
                <span>Doctor ID</span>
                <strong>
                  {appt.doctorUserId}
                </strong>
              </div>

              <div className="appointment-detail">
                <span>Date</span>
                <strong>
                  {new Date(
                    appt.appointmentDate
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="appointment-detail">
                <span>Reason</span>
                <strong>
                  {appt.reason}
                </strong>
              </div>

              {appt.status !== 'cancelled' && (
                <button
                  type="button"
                  className="patient-cancel-appointment-btn"
                  onClick={() =>
                    handleCancelAppointment(appt._id)
                  }
                  disabled={
                    cancellingAppointmentId === appt._id
                  }
                >
                  {cancellingAppointmentId === appt._id
                    ? 'Cancelling...'
                    : 'Cancel Appointment'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );

  // ---------------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------------

  const renderProfile = () => (
    <section className="patient-page-section">
      <div className="section-heading">
        <div>
          <p className="section-label">ACCOUNT</p>
          <h2>My Profile</h2>
          <p>
            Your basic MediFlow account information.
          </p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <ProfileIcon />
        </div>

        <div className="profile-information">

          <div className="profile-row">
            <span>Name</span>
            <strong>
              {user.name}
            </strong>
          </div>

          <div className="profile-row">
            <span>User ID</span>
            <strong>
              {user.userId}
            </strong>
          </div>

          <div className="profile-row">
            <span>Email</span>
            <strong>
              {user.email || 'N/A'}
            </strong>
          </div>

          <div className="profile-row">
            <span>Role</span>
            <strong>
              Patient
            </strong>
          </div>

        </div>
      </div>
    </section>
  );

  // ---------------------------------------------------------------------------
  // HEALTH TIPS
  // ---------------------------------------------------------------------------

  const renderHealthTips = () => (
    <section className="patient-page-section">
      <div className="section-heading">
        <div>
          <p className="section-label">WELLNESS</p>
          <h2>Health Tips</h2>
          <p>
            Simple everyday habits for a healthier lifestyle.
          </p>
        </div>
      </div>

      <div className="health-tip-list">

        <div className="health-tip">
          <span>01</span>
          <p>
            Stay hydrated throughout the day.
          </p>
        </div>

        <div className="health-tip">
          <span>02</span>
          <p>
            Get enough sleep every night.
          </p>
        </div>

        <div className="health-tip">
          <span>03</span>
          <p>
            Eat balanced and nutritious meals.
          </p>
        </div>

        <div className="health-tip">
          <span>04</span>
          <p>
            Exercise regularly and stay active.
          </p>
        </div>

        <div className="health-tip">
          <span>05</span>
          <p>
            Attend regular medical check-ups.
          </p>
        </div>

      </div>
    </section>
  );

  // ---------------------------------------------------------------------------
  // MY PRESCRIPTIONS (SAMPLE 2 - CARD LAYOUT GROUPED BY APPOINTMENT)
  // ---------------------------------------------------------------------------

  const groupPrescriptions = (prescriptions) => {
    const groups = {};

    prescriptions.forEach((p) => {
      let key;
      if (p.appointmentId) {
        key = `appt_${p.appointmentId}`;
      } else {
        const dateKey = p.createdAt
          ? new Date(p.createdAt).toISOString().split('T')[0]
          : 'unknown-date';
        key = `fallback_${p.doctorUserId || 'doc'}_${dateKey}`;
      }

      if (!groups[key]) {
        const dateToUse = p.appointmentDate
          ? new Date(p.appointmentDate)
          : (p.createdAt ? new Date(p.createdAt) : null);

        let dateMonth = 'N/A';
        let dateDay = '--';
        let dateYear = '----';

        if (dateToUse && !isNaN(dateToUse.getTime())) {
          dateMonth = dateToUse.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          dateDay = dateToUse.getDate();
          dateYear = dateToUse.getFullYear();
        }

        let appointmentTime = 'Not available';
        if (p.appointmentDate) {
          const apptDateObj = new Date(p.appointmentDate);
          if (!isNaN(apptDateObj.getTime())) {
            appointmentTime = apptDateObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          }
        }

        const rawDoctorName = p.doctorName || 'Doctor';
        const formattedDoctorName =
          rawDoctorName.startsWith('Dr.') || rawDoctorName.startsWith('Dr ')
            ? rawDoctorName
            : `Dr. ${rawDoctorName}`;

        groups[key] = {
          id: key,
          appointmentId: p.appointmentId,
          doctorUserId: p.doctorUserId,
          doctorName: formattedDoctorName,
          doctorSpecialization: p.doctorSpecialization || 'Doctor',
          appointmentDate: p.appointmentDate,
          appointmentTime,
          appointmentReason: p.appointmentReason || 'Not available',
          createdAt: p.createdAt,
          dateMonth,
          dateDay,
          dateYear,
          sortTimestamp: p.appointmentDate
            ? new Date(p.appointmentDate).getTime()
            : (p.createdAt ? new Date(p.createdAt).getTime() : 0),
          medicines: [],
        };
      }

      groups[key].medicines.push({
        _id: p._id,
        medication: p.medication,
        dosage: p.dosage,
        instructions: p.instructions,
      });
    });

    return Object.values(groups).sort(
      (a, b) => b.sortTimestamp - a.sortTimestamp
    );
  };

  const renderPrescriptions = () => {
    const allCards = groupPrescriptions(patientPrescriptions);
    const doctorOptions = [...new Set(allCards.map((c) => c.doctorName))];
    const displayedCards =
      prescriptionDoctorFilter === 'all'
        ? allCards
        : allCards.filter((c) => c.doctorName === prescriptionDoctorFilter);

    return (
      <section className="patient-page-section ppc-page">
        <div className="section-heading ppc-heading">
          <div>
            <p className="section-label">PRESCRIPTIONS</p>
            <h2>My Prescriptions</h2>
            <p>
              View prescriptions grouped by appointment.
            </p>
          </div>

          {doctorOptions.length > 0 && (
            <div className="ppc-toolbar">
              <select
                id="doctor-filter"
                className="ppc-filter"
                value={prescriptionDoctorFilter}
                onChange={(e) => setPrescriptionDoctorFilter(e.target.value)}
                aria-label="Filter by Doctor"
              >
                <option value="all">All Doctors</option>
                {doctorOptions.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {prescriptionError && (
          <div className="patient-message error">
            {prescriptionError}
          </div>
        )}

        {prescriptionLoading ? (
          <div className="simple-state">
            Loading prescriptions...
          </div>
        ) : patientPrescriptions.length === 0 ? (
          <div className="ppc-empty">
            <h3>No prescriptions available yet.</h3>
            <p>Prescriptions added by your doctors will appear here.</p>
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="ppc-empty">
            <h3>No prescriptions found for this doctor.</h3>
          </div>
        ) : (
          <div className="ppc-list">
            {displayedCards.map((card) => (
              <article key={card.id} className="ppc-card">
                <div className="ppc-date">
                  <span className="ppc-date-month">{card.dateMonth}</span>
                  <span className="ppc-date-day">{card.dateDay}</span>
                  <span className="ppc-date-year">{card.dateYear}</span>
                </div>

                <div className="ppc-doctor">
                  <h3>{card.doctorName}</h3>
                  <div className="ppc-specialization">{card.doctorSpecialization}</div>
                  <div className="ppc-appointment">Appointment: {card.appointmentTime}</div>
                  <div className="ppc-reason">Reason: {card.appointmentReason}</div>
                </div>

                <div className="ppc-medicines">
                  <ul className="ppc-medicines-list">
                    {card.medicines.map((med, idx) => (
                      <li key={med._id || idx} className="ppc-medicine-item">
                        <div className="ppc-medicine-name-dosage">
                          <span className="ppc-bullet">•</span> {med.medication} - {med.dosage}
                        </div>
                        <div className="ppc-medicine-instructions">
                          {med.instructions}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  // ---------------------------------------------------------------------------
  // PAGE CONTENT
  // ---------------------------------------------------------------------------

  const renderContent = () => {
    switch (view) {
      case 'request':
        return renderRequestForm();

      case 'appointments':
        return renderAppointments();

      case 'profile':
        return renderProfile();

      case 'prescriptions':
        return renderPrescriptions();

      case 'healthtips':
        return renderHealthTips();

      default:
        return renderHome();
    }
  };

  // ---------------------------------------------------------------------------
  // MAIN RETURN
  // ---------------------------------------------------------------------------

  return (
    <div className="patient-dashboard">

      <header className="patient-header">

        <button
          type="button"
          className="mediflow-brand"
          onClick={() => changeView('home')}
        >
          <LogoIcon />

          <span className="mediflow-wordmark">
            Medi<span>Flow</span>
          </span>
        </button>

        <nav className="patient-nav">

          <button
            type="button"
            onClick={() => changeView('home')}
            className={
              view === 'home'
                ? 'nav-button active'
                : 'nav-button'
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => changeView('request')}
            className={
              view === 'request'
                ? 'nav-button active'
                : 'nav-button'
            }
          >
            Request Appointment
          </button>

          <button
            type="button"
            onClick={() => changeView('appointments')}
            className={
              view === 'appointments'
                ? 'nav-button active'
                : 'nav-button'
            }
          >
            My Appointments
          </button>

        </nav>

        <button
          type="button"
          className="patient-logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>

      </header>

      <main className="patient-content">
        {renderContent()}
      </main>

      <footer className="patient-footer">
        All Rights Reserved | 2026 MediFlow Web Team
      </footer>

    </div>
  );
}