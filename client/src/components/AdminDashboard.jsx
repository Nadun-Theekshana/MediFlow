// src/components/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';

export default function AdminDashboard({ user, onLogout }) {
  // =========================================================
  // STATE
  // =========================================================

  const [view, setView] = useState('dashboard');

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  // Doctor form
  const [docId, setDocId] = useState('');
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Patient form
  const [patId, setPatId] = useState('');
  const [patName, setPatName] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patLoading, setPatLoading] = useState(false);

  // Doctor management state
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  // Track which doctor's status is being updated
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [doctorDeletingId, setDoctorDeletingId] = useState(null);
  // Helper to treat undefined isActive as active
  const isDoctorActive = (doc) => doc.isActive !== false;

  const token = sessionStorage.getItem('token');

  // =========================================================
  // ROLE GUARD
  // =========================================================

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>Unauthorized access</h2>
      </div>
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  const resetMsg = () => {
    setMsg('');
    setMsgType('');
  };

  const changeView = (newView) => {
    resetMsg();
    setView(newView);
  };

  // Fetch doctors when doctorManagement view is active
  useEffect(() => {
    if (view !== 'doctorManagement') return;
    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError('');
      try {
        const res = await fetch('http://localhost:5000/api/users/doctors', {
          method: 'GET',
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
        if (res.status === 403) {
          setDoctorsError('Unauthorized to view doctor accounts.');
          setDoctorsLoading(false);
          return;
        }
        if (!res.ok) {
          setDoctorsError('Unable to load Doctor accounts.');
          setDoctorsLoading(false);
          return;
        }
        const data = await res.json();
        setDoctors(data.doctors || []);
      } catch (e) {
        setDoctorsError('Unable to load Doctor accounts.');
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
  }, [view]);

  // =========================================================
  // EXISTING BACKEND REQUEST
  // DO NOT CHANGE API
  // =========================================================

  const apiRequest = async (payload, setLoading) => {
    resetMsg();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        onLogout();

        return false;
      }

      if (res.status === 403) {
        setMsg('You are not authorized to perform this action.');
        setMsgType('error');

        return false;
      }

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || 'Request failed.');
        setMsgType('error');

        return false;
      }

      setMsg(data.message || 'Account added successfully.');
      setMsgType('success');

      return true;
    } catch (error) {
      setMsg('Unable to connect to the server. Please try again.');
      setMsgType('error');

      return false;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ADD DOCTOR
  // =========================================================

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();

    resetMsg();

    const doctorId = docId.trim();
    const doctorName = docName.trim();
    const doctorEmail = docEmail.trim();
    const doctorSpecialization = specialization.trim();

    if (
      !doctorId ||
      !doctorName ||
      !doctorEmail ||
      !docPassword ||
      !doctorSpecialization
    ) {
      setMsg('All fields are required.');
      setMsgType('error');

      return;
    }

    if (!doctorId.startsWith('D')) {
      setMsg('Doctor User ID must start with "D".');
      setMsgType('error');

      return;
    }

    const payload = {
      userId: doctorId,
      name: doctorName,
      email: doctorEmail,
      password: docPassword,
      role: 'doctor',
      specialization: doctorSpecialization,
    };

    const success = await apiRequest(
      payload,
      setDocLoading
    );

    if (success) {
      setDocId('');
      setDocName('');
      setDocEmail('');
      setDocPassword('');
      setSpecialization('');

      setMsg('Doctor account added successfully.');
      setMsgType('success');
    }
  };

  // =========================================================
  // ADD PATIENT
  // =========================================================

  const handlePatientSubmit = async (e) => {
    e.preventDefault();

    resetMsg();

    const patientId = patId.trim();
    const patientName = patName.trim();
    const patientEmail = patEmail.trim();

    if (
      !patientId ||
      !patientName ||
      !patientEmail ||
      !patPassword
    ) {
      setMsg('All fields are required.');
      setMsgType('error');

      return;
    }

    if (!patientId.startsWith('P')) {
      setMsg('Patient User ID must start with "P".');
      setMsgType('error');

      return;
    }

    const payload = {
      userId: patientId,
      name: patientName,
      email: patientEmail,
      password: patPassword,
      role: 'patient',
    };

    const success = await apiRequest(
      payload,
      setPatLoading
    );

    if (success) {
      setPatId('');
      setPatName('');
      setPatEmail('');
      setPatPassword('');

      setMsg('Patient account added successfully.');
      setMsgType('success');
    }
  };

  // =========================================================
  // MEDIFLOW LOGO
  // =========================================================

  const LogoIcon = () => (
    <svg
      className="admin-logo-icon"
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <rect
        x="22"
        y="4"
        width="20"
        height="56"
        rx="8"
      />

      <rect
        x="4"
        y="22"
        width="56"
        height="20"
        rx="8"
      />

      <path
        className="admin-logo-pulse"
        d="M10 33h12l5-9 8 18 6-12 4 3h9"
      />
    </svg>
  );

  // =========================================================
  // ADMIN ICON
  // =========================================================

  const AdministratorIcon = () => (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <circle cx="32" cy="21" r="10" />

      <circle cx="15" cy="27" r="7" />

      <circle cx="49" cy="27" r="7" />

      <path d="M16 53c1-13 7-19 16-19s15 6 16 19H16z" />

      <path d="M2 51c1-10 5-15 13-15 4 0 7 1 9 4-4 3-6 7-7 11H2z" />

      <path d="M47 51c-1-4-3-8-7-11 2-3 5-4 9-4 8 0 12 5 13 15H47z" />
    </svg>
  );

  // =========================================================
  // DOCTOR ICON
  // =========================================================

  const DoctorIcon = () => (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
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

  // =========================================================
  // PATIENT ICON
  // =========================================================

  const PatientIcon = () => (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <circle cx="32" cy="20" r="12" />

      <path d="M13 56c1-14 8-21 19-21s18 7 19 21H13z" />
    </svg>
  );

  // =========================================================
  // ARROW ICON
  // =========================================================

  const ArrowIcon = () => (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );

  // =========================================================
  // DASHBOARD
  // =========================================================

  const renderHome = () => (
    <section className="admin-home">
      <div className="admin-welcome">
        <h2>
          Welcome, <span>{user.name}</span>
        </h2>

        <p className="admin-id">
          Admin ID: {user.userId}
        </p>
      </div>

      <div className="admin-card-grid">
        {/* ADMINISTRATOR CARD */}

        <button
          type="button"
          className="admin-management-card"
          onClick={() =>
            changeView('adminOverview')
          }
        >
          <div className="admin-card-icon">
            <AdministratorIcon />
          </div>

          <h3>
            Administrator Access
          </h3>

          <p>
            Manage Doctor and Patient accounts.
          </p>

          <div className="admin-card-arrow">
            <ArrowIcon />
          </div>
        </button>

        {/* DOCTOR CARD */}

        <button
          type="button"
          className="admin-management-card"
          onClick={() =>
            changeView('doctorManagement')
          }
        >
          <div className="admin-card-icon">
            <DoctorIcon />
          </div>

          <h3>
            Doctor Account
            <br />
            Management
          </h3>

          <p>
            Create and manage authorized Doctor
            accounts.
          </p>

          <div className="admin-card-arrow">
            <ArrowIcon />
          </div>
        </button>

        {/* PATIENT CARD */}

        <button
          type="button"
          className="admin-management-card"
          onClick={() =>
            changeView('patient')
          }
        >
          <div className="admin-card-icon">
            <PatientIcon />
          </div>

          <h3>
            Patient Account
            <br />
            Management
          </h3>

          <p>
            Create and manage Patient accounts.
          </p>

          <div className="admin-card-arrow">
            <ArrowIcon />
          </div>
        </button>
      </div>
    </section>
  );

  // =========================================================
  // ADD DOCTOR FORM
  // =========================================================

  const renderDoctorForm = () => (
    <section className="admin-page-section">
      <div className="admin-section-heading">
        <p>ACCOUNT MANAGEMENT</p>

        <h2>Add Doctor</h2>

        <span>
          Create a new authorized Doctor account.
        </span>
      </div>

      <form
        className="admin-form"
        onSubmit={handleDoctorSubmit}
      >
        <div className="admin-form-group">
          <label htmlFor="doctorId">
            Doctor User ID
          </label>

          <input
            id="doctorId"
            type="text"
            value={docId}
            onChange={(e) =>
              setDocId(e.target.value)
            }
            placeholder="e.g. D001"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="doctorName">
            Name
          </label>

          <input
            id="doctorName"
            type="text"
            value={docName}
            onChange={(e) =>
              setDocName(e.target.value)
            }
            placeholder="Doctor name"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="doctorEmail">
            Email
          </label>

          <input
            id="doctorEmail"
            type="email"
            value={docEmail}
            onChange={(e) =>
              setDocEmail(e.target.value)
            }
            placeholder="doctor@example.com"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="doctor-specialization">
            Consultant Type
          </label>

          <select
            id="doctor-specialization"
            name="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            required
          >
            <option value="" disabled>Select consultant type</option>
            {[
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
            ].map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="admin-form-group">
          <label htmlFor="doctorPassword">
            Initial Password
          </label>

          <input
            id="doctorPassword"
            type="password"
            value={docPassword}
            onChange={(e) =>
              setDocPassword(e.target.value)
            }
            placeholder="Enter initial password"
            required
          />
        </div>

        <button
          type="submit"
          className="admin-primary-btn"
          disabled={docLoading}
        >
          {docLoading
            ? 'Adding...'
            : 'Add Doctor'}
        </button>
      </form>
    </section>
  );

  // =========================================================
  // ADD PATIENT FORM
  // =========================================================

  const renderPatientForm = () => (
    <section className="admin-page-section">
      <div className="admin-section-heading">
        <p>ACCOUNT MANAGEMENT</p>

        <h2>Add Patient</h2>

        <span>
          Create a new Patient account.
        </span>
      </div>

      <form
        className="admin-form"
        onSubmit={handlePatientSubmit}
      >
        <div className="admin-form-group">
          <label htmlFor="patientId">
            Patient User ID
          </label>

          <input
            id="patientId"
            type="text"
            value={patId}
            onChange={(e) =>
              setPatId(e.target.value)
            }
            placeholder="e.g. P001"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="patientName">
            Name
          </label>

          <input
            id="patientName"
            type="text"
            value={patName}
            onChange={(e) =>
              setPatName(e.target.value)
            }
            placeholder="Patient name"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="patientEmail">
            Email
          </label>

          <input
            id="patientEmail"
            type="email"
            value={patEmail}
            onChange={(e) =>
              setPatEmail(e.target.value)
            }
            placeholder="patient@example.com"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="patientPassword">
            Initial Password
          </label>

          <input
            id="patientPassword"
            type="password"
            value={patPassword}
            onChange={(e) =>
              setPatPassword(e.target.value)
            }
            placeholder="Enter initial password"
            required
          />
        </div>

        <button
          type="submit"
          className="admin-primary-btn"
          disabled={patLoading}
        >
          {patLoading
            ? 'Adding...'
            : 'Add Patient'}
        </button>
      </form>
    </section>
  );

  // =========================================================
  // ADMIN OVERVIEW
  // =========================================================

  const renderAdminOverview = () => (
    <section className="admin-page-section">
      <div className="admin-section-heading">
        <p>ADMINISTRATOR</p>

        <h2>Administrator Access</h2>

        <span>
          Your MediFlow administrator account
          information.
        </span>
      </div>

      <div className="admin-overview-card">
        <div className="overview-icon">
          <AdministratorIcon />
        </div>

        <div className="overview-information">
          <div className="overview-row">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>

          <div className="overview-row">
            <span>Admin ID</span>
            <strong>{user.userId}</strong>
          </div>

          <div className="overview-row">
            <span>Role</span>
            <strong>Administrator</strong>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <button
          type="button"
          onClick={() =>
            changeView('doctor')
          }
        >
          Add Doctor
        </button>

        <button
          type="button"
          onClick={() =>
            changeView('patient')
          }
        >
          Add Patient
        </button>
      </div>
    </section>
  );

  // =========================================================
  // CONTENT
  // =========================================================

  const renderDoctorManagement = () => {
    // Filter doctors based on search input
    const filteredDoctors = doctors.filter((doc) => {
      const search = doctorSearch.toLowerCase();
      return (
        doc.userId?.toLowerCase().includes(search) ||
        doc.name?.toLowerCase().includes(search) ||
        doc.email?.toLowerCase().includes(search)
      );
    });

  // Toggle doctor active status
  const toggleStatus = async (doc) => {
    const newStatus = !isDoctorActive(doc);
    const userId = doc.userId;
    if (!userId) {
      setMsg('Unable to identify doctor account.');
      setMsgType('error');
      return;
    }
    const encodedId = encodeURIComponent(userId);
    setStatusUpdatingId(userId);
    try {
      const res = await fetch(`http://localhost:5000/api/users/doctors/${encodedId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }
      if (res.status === 403) {
        const data = await res.json();
        setMsg(data.message || 'Forbidden');
        setMsgType('error');
        return;
      }
      if (res.status === 404) {
        setMsg('Doctor account not found.');
        setMsgType('error');
        return;
      }
      if (res.status === 400) {
        const data = await res.json();
        setMsg(data.message || 'Invalid request');
        setMsgType('error');
        return;
      }
      if (!res.ok) {
        setMsg('Unable to update Doctor account status.');
        setMsgType('error');
        return;
      }
      // Update UI
      setDoctors((prev) =>
        prev.map((d) => (d.userId === userId ? { ...d, isActive: newStatus } : d))
      );
    } catch (e) {
      setMsg('Error updating doctor status');
      setMsgType('error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Delete doctor account
  const handleDeleteDoctor = async (userId) => {
    if (!userId) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete Doctor ${userId}?`
    );

    if (confirmed === false) {
      return;
    }

    setDoctorDeletingId(userId);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        setDoctors((currentDoctors) =>
          currentDoctors.filter((doctor) => doctor.userId !== userId)
        );
        const data = await res.json().catch(() => ({}));
        setMsg(data.message || 'Doctor account deleted successfully.');
        setMsgType('success');
        return;
      }

      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      if (res.status === 403) {
        setMsg('You are not authorized to delete Doctor accounts.');
        setMsgType('error');
        return;
      }

      if (res.status === 404) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.message || 'Doctor account not found.');
        setMsgType('error');
        return;
      }

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setMsg(
          data.message ||
            'This Doctor has existing appointments or prescriptions. Deactivate the account instead.'
        );
        setMsgType('error');
        return;
      }

      setMsg('Unable to delete Doctor account.');
      setMsgType('error');
    } catch (e) {
      setMsg('Unable to delete Doctor account.');
      setMsgType('error');
    } finally {
      setDoctorDeletingId(null);
    }
  };

      return (
        <section className="admin-page-section doctor-management-page">
          <div className="admin-section-heading">
            <p>ACCOUNT MANAGEMENT</p>
            <h2>Doctor Account Management</h2>
            <span>Registered Doctor Accounts</span>
          </div>

          <div className="doctor-management-toolbar">
            <button
              type="button"
              className="doctor-add-btn"
              onClick={() => changeView('doctor')}
            >
              + Add Doctor
            </button>
            <div className="doctor-search-wrapper">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                className="doctor-search-input"
                placeholder="Search doctors..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
              />
            </div>
          </div>

          {doctorsLoading && <p className="admin-doctor-loading">Loading registered doctors...</p>}
          {doctorsError && <p className="admin-doctor-error">{doctorsError}</p>}
          {!doctorsLoading && !doctorsError && doctors.length === 0 && (
            <p className="admin-doctor-empty">No Doctor accounts found.</p>
          )}

          {!doctorsLoading && !doctorsError && filteredDoctors.length > 0 && (
            <div className="doctor-table-card">
              <div className="doctor-table-scroll">
                <table className="doctor-management-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Doctor ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Specialization</th>
                      <th>Status</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map((doctor, index) => {
                      const doctorIsActive = doctor.isActive !== false;
                      return (
                        <tr key={doctor._id || doctor.userId}>
                          <td>{index + 1}</td>
                          <td>{doctor.userId}</td>
                          <td>{doctor.name}</td>
                          <td>{doctor.email}</td>
                                                     <td>{doctor.specialization || 'Not specified'}</td>
                          <td>
                            <button
                              type="button"
                              className={`doctor-status-pill ${doctorIsActive ? 'is-active' : 'is-inactive'}`}
                              onClick={() => toggleStatus(doctor)}
                              disabled={statusUpdatingId === doctor.userId}
                              title={doctorIsActive ? 'Click to deactivate Doctor' : 'Click to activate Doctor'}
                            >
                              <span className="doctor-status-dot"></span>
                              {statusUpdatingId === doctor.userId
                                ? 'Updating...'
                                : doctorIsActive
                                ? 'Active'
                                : 'Inactive'}
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="doctor-delete-btn"
                              onClick={() =>
                                handleDeleteDoctor(doctor.userId)
                              }
                              disabled={
                                doctorDeletingId === doctor.userId
                              }
                            >
                              {doctorDeletingId === doctor.userId
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="doctor-table-footer">
                Showing {filteredDoctors.length === 0 ? 0 : 1} to {filteredDoctors.length} of {filteredDoctors.length} doctors
              </div>
            </div>
          )}
        </section>
      );
  };

  const renderContent = () => {
    switch (view) {
      case 'doctor':
        return renderDoctorForm();

      case 'patient':
        return renderPatientForm();

      case 'adminOverview':
        return renderAdminOverview();

      case 'doctorManagement':
        return renderDoctorManagement();

      default:
        return renderHome();
    }
  };

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="admin-dashboard">
      {/* HEADER */}

      <header className="admin-header">
        <button
          type="button"
          className="admin-brand"
          onClick={() =>
            changeView('dashboard')
          }
        >
          <LogoIcon />

          <span className="admin-wordmark">
            Medi<span>Flow</span>
          </span>
        </button>

        <nav className="admin-nav">
          <button
            type="button"
            onClick={() =>
              changeView('dashboard')
            }
            className={
              view === 'dashboard'
                ? 'admin-nav-btn active'
                : 'admin-nav-btn'
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => changeView('doctor')}
            className={
              view === 'doctor'
                ? 'admin-nav-btn active'
                : 'admin-nav-btn'
            }
          >
            Add Doctor
          </button>

          <button
            type="button"
            onClick={() =>
              changeView('patient')
            }
            className={
              view === 'patient'
                ? 'admin-nav-btn active'
                : 'admin-nav-btn'
            }
          >
            Add Patient
          </button>
        </nav>

        <button
          type="button"
          className="admin-logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      {/* MESSAGE */}

      {msg && (
        <div
          className={`admin-message ${msgType}`}
        >
          {msg}
        </div>
      )}

      {/* CONTENT */}

      <main className="admin-content">
        {renderContent()}
      </main>

      {/* FOOTER */}

      <footer className="admin-footer">
        All Rights Reserved | 2026 MediFlow Web Team
      </footer>
    </div>
  );
}