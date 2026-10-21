// src/components/DoctorDashboard.jsx

import { useEffect, useState } from 'react';
import '../styles/DoctorDashboard.css';

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

  useEffect(() => {
    if (view === 'appointments') {
      fetchAppointments();
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

        {/* HOSPITAL SERVICES */}

        <button
          type="button"
          className="doctor-feature-card"
        >
          <div className="doctor-card-icon">
            <HospitalIcon />
          </div>

          <h3>Hospital Services</h3>

          <p>
            Use MediFlow to access the hospital functions
            assigned to doctors.
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
  // CONTENT
  // =========================================================

  const renderContent = () => {
    switch (view) {
      case 'appointments':
        return renderAppointments();

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
            className="doctor-nav-btn"
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