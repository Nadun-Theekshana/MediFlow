// src/components/PatientDashboard.jsx

import { useEffect, useState } from 'react';
import '../styles/PatientDashboard.css';

export default function PatientDashboard({ user, onLogout }) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [view, setView] = useState('home');

  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [reason, setReason] = useState('');

  const [msg, setMsg] = useState({
    type: '',
    text: '',
  });

  const [loading, setLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);

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
    setView(newView);
  };

  // ---------------------------------------------------------------------------
  // REQUEST APPOINTMENT
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMsg({
      type: '',
      text: '',
    });

    const trimmedDoctor = doctorId.trim();
    const trimmedReason = reason.trim();

    if (!trimmedDoctor) {
      setMsg({
        type: 'error',
        text: 'Doctor User ID is required.',
      });
      return;
    }

    if (!/^D/i.test(trimmedDoctor)) {
      setMsg({
        type: 'error',
        text: 'Doctor User ID must start with "D".',
      });
      return;
    }

    if (!appointmentDate) {
      setMsg({
        type: 'error',
        text: 'Appointment Date is required.',
      });
      return;
    }

    const selectedDate = new Date(appointmentDate);

    if (selectedDate <= new Date()) {
      setMsg({
        type: 'error',
        text: 'Appointment Date must be in the future.',
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
          doctorUserId: trimmedDoctor,
          appointmentDate: selectedDate.toISOString(),
          reason: trimmedReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg({
          type: 'success',
          text: 'Appointment request submitted successfully.',
        });

        setDoctorId('');
        setAppointmentDate('');
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

  useEffect(() => {
    if (view === 'appointments') {
      fetchAppointments();
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
          onClick={() => changeView('healthtips')}
        >
          <div className="feature-icon">
            <HeartIcon />
          </div>

          <h3>Health Tips</h3>

          <p>
            Get simple tips for a healthier you.
          </p>
        </button>

      </div>
    </section>
  );

  // ---------------------------------------------------------------------------
  // REQUEST APPOINTMENT VIEW
  // ---------------------------------------------------------------------------

  const renderRequestForm = () => (
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
          <label htmlFor="doctorId">
            Doctor User ID
          </label>

          <input
            id="doctorId"
            type="text"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            placeholder="e.g. D001"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="appointmentDate">
            Appointment Date
          </label>

          <input
            id="appointmentDate"
            type="datetime-local"
            value={appointmentDate}
            onChange={(e) =>
              setAppointmentDate(e.target.value)
            }
            required
          />
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