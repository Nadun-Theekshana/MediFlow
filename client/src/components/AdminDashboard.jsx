// src/components/AdminDashboard.jsx

// Admin dashboard component: manage doctors, patients, and appointments
import { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';
import { API_BASE_URL } from '../config/api';

// AdminDashboard component: main admin interface
export default function AdminDashboard({ user, onLogout }) {

  // STATE
  const [view, setView] = useState('dashboard');

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  // Doctor form
  const [docId, setDocId] = useState('');
  const [docIdLoading, setDocIdLoading] = useState(false);
  const [docIdError, setDocIdError] = useState('');
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('1234');
  const [specialization, setSpecialization] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Patient form
  const [patId, setPatId] = useState('');
  const [patIdLoading, setPatIdLoading] = useState(false);
  const [patIdError, setPatIdError] = useState('');
  const [patName, setPatName] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patPassword, setPatPassword] = useState('1234');
  const [patLoading, setPatLoading] = useState(false);

  // Admin form
  const [adminId, setAdminId] = useState('');
  const [adminIdLoading, setAdminIdLoading] = useState(false);
  const [adminIdError, setAdminIdError] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Doctor management state
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  // Track which doctor's status is being updated
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [doctorDeletingId, setDoctorDeletingId] = useState(null);
  // Patient management state
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPage, setPatientPage] = useState(1);
  const itemsPerPage = 7; // patients per page
  const [patientDeletingId, setPatientDeletingId] = useState(null);

  // Appointment management state
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [approvingAppointmentId, setApprovingAppointmentId] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');
  const [deletingAppointmentId, setDeletingAppointmentId] = useState(null);

  // Helper to treat undefined isActive as active
  // Reset patient page when search changes
  useEffect(() => {
    setPatientPage(1);
  }, [patientSearch]);
  const isDoctorActive = (doc) => doc.isActive !== false;

  const token = sessionStorage.getItem('token');


  // ROLE GUARD


  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>Unauthorized access</h2>
      </div>
    );
  }


  // HELPERS
  const resetMsg = () => {
    setMsg('');
    setMsgType('');
  };

  const changeView = (newView) => {
    resetMsg();
    setView(newView);
  };

  const fetchNextDoctorId = async () => {
    setDocIdLoading(true);
    setDocIdError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/next-doctor-id`, {
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.message || 'Unable to load next Doctor ID.';
        setDocIdError(errorMsg);
        setMsg(errorMsg);
        setMsgType('error');
        setDocId('');
        return;
      }
      const data = await res.json();
      if (data.nextDoctorId) {
        setDocId(data.nextDoctorId);
      } else {
        const errorMsg = 'Unable to generate next Doctor ID.';
        setDocIdError(errorMsg);
        setMsg(errorMsg);
        setMsgType('error');
        setDocId('');
      }
    } catch (e) {
      const errorMsg = 'Unable to connect to server to fetch Doctor ID.';
      setDocIdError(errorMsg);
      setMsg(errorMsg);
      setMsgType('error');
      setDocId('');
    } finally {
      setDocIdLoading(false);
    }
  };

  const fetchNextPatientId = async () => {
    setPatIdLoading(true);
    setPatIdError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/next-patient-id`, {
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.message || 'Unable to load next Patient ID.';
        setPatIdError(errorMsg);
        setMsg(errorMsg);
        setMsgType('error');
        setPatId('');
        return;
      }
      const data = await res.json();
      if (data.nextPatientId) {
        setPatId(data.nextPatientId);
      } else {
        const errorMsg = 'Unable to generate next Patient ID.';
        setPatIdError(errorMsg);
        setMsg(errorMsg);
        setMsgType('error');
        setPatId('');
      }
    } catch (e) {
      const errorMsg = 'Unable to connect to server to fetch Patient ID.';
      setPatIdError(errorMsg);
      setMsg(errorMsg);
      setMsgType('error');
      setPatId('');
    } finally {
      setPatIdLoading(false);
    }
  };

  const fetchNextAdminId = async () => {
    setAdminIdLoading(true);
    setAdminIdError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/next-admin-id`, {
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.message || 'Unable to load next Admin ID.';
        setAdminIdError(errorMsg);
        setMsg(errorMsg);
        setMsgType('error');
        setAdminId('');
        return;
      }
      const data = await res.json();
      if (data.nextAdminId) {
        setAdminId(data.nextAdminId);
      } else {
        const errorMsg = 'Unable to generate next Admin ID.';
        setAdminIdError(errorMsg);
        setMsg(errorMsg);
        setMsgType('error');
        setAdminId('');
      }
    } catch (e) {
      const errorMsg = 'Unable to connect to server to fetch Admin ID.';
      setAdminIdError(errorMsg);
      setMsg(errorMsg);
      setMsgType('error');
      setAdminId('');
    } finally {
      setAdminIdLoading(false);
    }
  };

  // Fetch data based on active view
  useEffect(() => {
    if (view === 'doctor') {
      setDocPassword('1234');
      fetchNextDoctorId();
    } else if (view === 'patient') {
      setPatPassword('1234');
      fetchNextPatientId();
    } else if (view === 'admin') {
      setAdminPassword('');
      fetchNextAdminId();
    } else if (view === 'doctorManagement') {
      const fetchDoctors = async () => {
        setDoctorsLoading(true);
        setDoctorsError('');
        try {
          const res = await fetch(`${API_BASE_URL}/api/users/doctors`, {
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
    } else if (view === 'patientManagement') {
      const fetchPatients = async () => {
        setPatientsLoading(true);
        setPatientsError('');
        try {
          const res = await fetch(`${API_BASE_URL}/api/users/patients`, {
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
            setPatientsError('Unauthorized to view patient accounts.');
            setPatientsLoading(false);
            return;
          }
          if (!res.ok) {
            setPatientsError('Unable to load Patient accounts.');
            setPatientsLoading(false);
            return;
          }
          const data = await res.json();
          setPatients(data.patients || []);
        } catch (e) {
          setPatientsError('Unable to load Patient accounts.');
        } finally {
          setPatientsLoading(false);
        }
      };
      fetchPatients();
    } else if (view === 'appointmentManagement') {
      const fetchAdminAppointments = async () => {
        setAppointmentLoading(true);
        setAppointmentError('');
        try {
          const res = await fetch(`${API_BASE_URL}/api/appointments/admin`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            onLogout();
            return;
          }
          if (res.status === 403) {
            setAppointmentError('Unauthorized to view appointments.');
            setAppointmentLoading(false);
            return;
          }
          if (!res.ok) {
            setAppointmentError('Unable to load appointments.');
            setAppointmentLoading(false);
            return;
          }
          const data = await res.json();
          setAdminAppointments(data.appointments || []);
        } catch (e) {
          setAppointmentError('Unable to load appointments.');
        } finally {
          setAppointmentLoading(false);
        }
      };
      fetchAdminAppointments();
    }
  }, [view]);


  // EXISTING BACKEND REQUEST

  const apiRequest = async (payload, setLoading) => {
    resetMsg();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
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

        return null;
      }

      if (res.status === 403) {
        setMsg('You are not authorized to perform this action.');
        setMsgType('error');

        return null;
      }

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || 'Request failed.');
        setMsgType('error');

        return null;
      }

      return { success: true, user: data.user, message: data.message };
    } catch (error) {
      setMsg('Unable to connect to the server. Please try again.');
      setMsgType('error');

      return null;
    } finally {
      setLoading(false);
    }
  };


  // ADD DOCTOR

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();

    resetMsg();

    if (docIdLoading || !docId) {
      setMsg('Doctor User ID is not available. Please wait or refresh.');
      setMsgType('error');
      return;
    }

    if (docIdError) {
      setMsg(docIdError);
      setMsgType('error');
      return;
    }

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

    const resData = await apiRequest(
      payload,
      setDocLoading
    );

    if (resData && resData.success) {
      const createdId = resData.user?.userId || doctorId;
      setDocName('');
      setDocEmail('');
      setDocPassword('1234');
      setSpecialization('');

      setMsg(`Doctor ${createdId} successfully created.`);
      setMsgType('success');

      fetchNextDoctorId();
    }
  };


  // ADD PATIENT

  const handlePatientSubmit = async (e) => {
    e.preventDefault();

    resetMsg();

    if (patIdLoading || !patId) {
      setMsg('Patient User ID is not available. Please wait or refresh.');
      setMsgType('error');
      return;
    }

    if (patIdError) {
      setMsg(patIdError);
      setMsgType('error');
      return;
    }

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

    const resData = await apiRequest(
      payload,
      setPatLoading
    );

    if (resData && resData.success) {
      const createdId = resData.user?.userId || patientId;
      setPatName('');
      setPatEmail('');
      setPatPassword('1234');

      setMsg(`Patient ${createdId} successfully created.`);
      setMsgType('success');

      fetchNextPatientId();
    }
  };


  // ADD ADMIN

  const handleAdminSubmit = async (e) => {
    e.preventDefault();

    resetMsg();

    if (adminIdLoading || !adminId) {
      setMsg('Admin User ID is not available. Please wait or refresh.');
      setMsgType('error');
      return;
    }

    if (adminIdError) {
      setMsg(adminIdError);
      setMsgType('error');
      return;
    }

    const aId = adminId.trim();
    const aName = adminName.trim();
    const aEmail = adminEmail.trim();
    const aPassword = adminPassword;

    if (!aId || !aName || !aEmail || !aPassword) {
      setMsg('All fields are required.');
      setMsgType('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(aEmail)) {
      setMsg('Please enter a valid email address.');
      setMsgType('error');
      return;
    }

    if (aPassword.length < 12) {
      setMsg('Password must be at least 12 characters long.');
      setMsgType('error');
      return;
    }

    if (!aId.startsWith('A')) {
      setMsg('Admin User ID must start with "A".');
      setMsgType('error');
      return;
    }

    setAdminLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: aId,
          name: aName,
          email: aEmail,
          password: aPassword,
        }),
      });

      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      if (res.status === 403) {
        setMsg('You are not authorized to perform this action.');
        setMsgType('error');
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.message || 'Failed to create administrator account.');
        setMsgType('error');
        return;
      }

      const createdId = data.user?.userId || aId;
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');

      setMsg(`Administrator ${createdId} successfully created.`);
      setMsgType('success');

      fetchNextAdminId();
    } catch (err) {
      setMsg('Unable to connect to the server. Please try again.');
      setMsgType('error');
    } finally {
      setAdminLoading(false);
    }
  };


  // MEDIFLOW LOGO


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


  // ADMIN ICON
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


  // DOCTOR ICON

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


  // PATIENT ICON
  const PatientIcon = () => (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <circle cx="32" cy="20" r="12" />

      <path d="M13 56c1-14 8-21 19-21s18 7 19 21H13z" />
    </svg>
  );


  // ARROW ICON
  const ArrowIcon = () => (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );


  // DASHBOARD

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
            changeView('appointmentManagement')
          }
        >
          <div className="admin-card-icon">
            <AdministratorIcon />
          </div>

          <h3>
            All Appointments
          </h3>

          <p>
            View and manage all appointments.
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
            changeView('patientManagement')
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


  // ADD DOCTOR FORM
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
            value={docIdLoading ? 'Loading...' : docId}
            readOnly
            autoComplete="off"
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
          disabled={docLoading || docIdLoading || !docId || !!docIdError}
        >
          {docLoading
            ? 'Adding...'
            : 'Add Doctor'}
        </button>
      </form>
    </section>
  );


  // ADD PATIENT FORM

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
            value={patIdLoading ? 'Loading...' : patId}
            readOnly
            autoComplete="off"
            placeholder="e.g. P0001"
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
          disabled={patLoading || patIdLoading || !patId || !!patIdError}
        >
          {patLoading
            ? 'Adding...'
            : 'Add Patient'}
        </button>
      </form>
    </section>
  );


  // ADD ADMIN FORM

  const renderAdminForm = () => (
    <section className="admin-page-section">
      <div className="admin-section-heading">
        <p>ACCOUNT MANAGEMENT</p>

        <h2>Add Admin</h2>

        <span>
          Create a new administrator account.
        </span>
      </div>

      <form
        className="admin-form"
        onSubmit={handleAdminSubmit}
      >
        <div className="admin-form-group">
          <label htmlFor="adminId">
            Admin User ID
          </label>

          <input
            id="adminId"
            type="text"
            value={adminIdLoading ? 'Loading...' : adminId}
            readOnly
            autoComplete="off"
            placeholder="e.g. A001"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="adminName">
            Name
          </label>

          <input
            id="adminName"
            type="text"
            value={adminName}
            onChange={(e) =>
              setAdminName(e.target.value)
            }
            placeholder="Admin name"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="adminEmail">
            Email
          </label>

          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) =>
              setAdminEmail(e.target.value)
            }
            placeholder="admin@example.com"
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="adminPassword">
            Initial Password
          </label>

          <input
            id="adminPassword"
            type="password"
            value={adminPassword}
            onChange={(e) =>
              setAdminPassword(e.target.value)
            }
            placeholder="Enter initial password (min. 12 characters)"
            minLength={12}
            required
          />
        </div>

        <button
          type="submit"
          className="admin-primary-btn"
          disabled={adminLoading || adminIdLoading || !adminId || !!adminIdError}
        >
          {adminLoading
            ? 'Adding...'
            : 'Add Admin'}
        </button>
      </form>
    </section>
  );


  // ADMIN OVERVIEW

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


  // CONTENT

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
        const res = await fetch(`${API_BASE_URL}/api/users/doctors/${encodedId}/status`, {
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
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
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

  // Delete patient account (only user record)
  const handleDeletePatient = async (userId) => {
    if (!userId) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete Patient ${userId}?`
    );
    if (!confirmed) return;

    setPatientDeletingId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/patients/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        setPatients((current) => {
          const updated = current.filter((patient) => patient.userId !== userId);
          const searchVal = patientSearch.trim().toLowerCase();
          const remainingFiltered = updated.filter((p) => {
            if (!searchVal) return true;
            return (
              (p.userId || '').toLowerCase().includes(searchVal) ||
              (p.name || '').toLowerCase().includes(searchVal) ||
              (p.email || '').toLowerCase().includes(searchVal)
            );
          });
          const newTotalPages = Math.max(1, Math.ceil(remainingFiltered.length / 7));
          setPatientPage((prev) => Math.min(prev, newTotalPages));
          return updated;
        });

        const data = await res.json().catch(() => ({}));
        setMsg(data.message || 'Patient account deleted successfully.');
        setMsgType('success');
        return;
      }

      if (res.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        onLogout();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setMsg(data.message || 'Unable to delete Patient account.');
      setMsgType('error');
    } catch (e) {
      setMsg('Unable to delete Patient account.');
      setMsgType('error');
    } finally {
      setPatientDeletingId(null);
    }
  };

  const renderPatientManagement = () => {
    const sortedPatients = [...patients].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    const searchValue = patientSearch.trim().toLowerCase();

    const filteredPatients = sortedPatients.filter((patient) => {
      if (!searchValue) return true;
      return (
        (patient.userId || '').toLowerCase().includes(searchValue) ||
        (patient.name || '').toLowerCase().includes(searchValue) ||
        (patient.email || '').toLowerCase().includes(searchValue)
      );
    });

    const PATIENTS_PER_PAGE = 7;
    const totalPatientPages = Math.max(1, Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE));
    const safePage = Math.min(patientPage, totalPatientPages);
    const startIndex = (safePage - 1) * PATIENTS_PER_PAGE;
    const visiblePatients = filteredPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE);
    const showingStart = filteredPatients.length === 0 ? 0 : startIndex + 1;
    const showingEnd = Math.min(startIndex + PATIENTS_PER_PAGE, filteredPatients.length);

    return (
      <div className="admin-page-section pam-page">

        <div className="pam-heading">
          <div className="pam-eyebrow">ACCOUNT MANAGEMENT</div>
          <h2>Patient Account Management</h2>
          <p>Registered Patient Accounts (Newly Created First)</p>
        </div>

        <div className="pam-toolbar">
          <button
            type="button"
            className="pam-add-button"
            onClick={() => changeView('patient')}
          >
            + Add Patient
          </button>
          <div className="pam-search">
            <span className="pam-search-icon" aria-hidden="true"></span>
            <input
              type="text"
              placeholder="Search patients..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setPatientPage(1);
              }}
            />
          </div>
        </div>

        {patientsLoading && (
          <p className="admin-patient-loading">Loading registered patients...</p>
        )}
        {patientsError && (
          <p className="admin-patient-error">{patientsError}</p>
        )}

        {!patientsLoading && !patientsError && (
          <div className="pam-table-card">
            <div className="pam-table-scroll">
              <table className="pam-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePatients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="pam-empty">
                        No matching Patient accounts found.
                      </td>
                    </tr>
                  ) : (
                    visiblePatients.map((patient, index) => {
                      const active = patient.isActive !== false;
                      return (
                        <tr key={patient._id || patient.userId}>
                          <td className="pam-number">{startIndex + index + 1}</td>
                          <td className="pam-id">{patient.userId}</td>
                          <td className="pam-name">{patient.name}</td>
                          <td>{patient.email}</td>
                          <td>
                            {patient.createdAt
                              ? new Date(patient.createdAt).toLocaleString()
                              : 'Not available'}
                          </td>
                          <td className="pam-center">
                            <span
                              className={
                                active
                                  ? 'pam-status pam-status-active'
                                  : 'pam-status pam-status-inactive'
                              }
                            >
                              <span className="pam-status-dot"></span>
                              {active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="pam-center">
                            <button
                              type="button"
                              className="pam-delete-button"
                              onClick={() => handleDeletePatient(patient.userId)}
                              disabled={patientDeletingId === patient.userId}
                            >
                              {patientDeletingId === patient.userId
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pam-footer">
              <div className="pam-count">
                Showing {showingStart} to {showingEnd} of {filteredPatients.length} patients
              </div>
              <div className="pam-pagination">
                <button
                  type="button"
                  className="pam-page-button"
                  disabled={safePage === 1}
                  onClick={() => setPatientPage(Math.max(1, safePage - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalPatientPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={
                      safePage === pageNumber
                        ? 'pam-page-button pam-page-active'
                        : 'pam-page-button'
                    }
                    onClick={() => setPatientPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="pam-page-button"
                  disabled={safePage === totalPatientPages}
                  onClick={() => setPatientPage(Math.min(totalPatientPages, safePage + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAppointmentManagement = () => {
    // Reset page when search or filter changes
    const APPT_PER_PAGE = 7;

    const searchVal = appointmentSearch.trim().toLowerCase();

    const filtered = adminAppointments.filter((a) => {
      const matchesSearch =
        !searchVal ||
        (a.patientUserId || '').toLowerCase().includes(searchVal) ||
        (a.patientName || '').toLowerCase().includes(searchVal) ||
        (a.doctorUserId || '').toLowerCase().includes(searchVal) ||
        (a.doctorName || '').toLowerCase().includes(searchVal) ||
        (a.reason || '').toLowerCase().includes(searchVal);

      const matchesStatus =
        appointmentStatusFilter === 'all' ||
        a.status === appointmentStatusFilter;

      return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / APPT_PER_PAGE));
    const safePage = Math.min(appointmentPage, totalPages);
    const startIndex = (safePage - 1) * APPT_PER_PAGE;
    const visible = filtered.slice(startIndex, startIndex + APPT_PER_PAGE);
    const showStart = filtered.length === 0 ? 0 : startIndex + 1;
    const showEnd = Math.min(startIndex + APPT_PER_PAGE, filtered.length);

    const handleAdminApproveAppointment = async (appointmentId) => {
      const confirmed = window.confirm('Approve this appointment request?');
      if (!confirmed) return;

      setApprovingAppointmentId(appointmentId);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/appointments/${appointmentId}/admin-approve`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          onLogout();
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMsg(data.message || 'Unable to approve appointment.');
          setMsgType('error');
          return;
        }
        // Update UI without reload
        setAdminAppointments((current) =>
          current.map((appointment) =>
            appointment._id === appointmentId
              ? { ...appointment, status: 'approved' }
              : appointment
          )
        );
      } catch (e) {
        setMsg('Unable to approve appointment.');
        setMsgType('error');
      } finally {
        setApprovingAppointmentId(null);
      }
    };

    const handleDeleteCancelledAppointment = async (appointmentId) => {
      const confirmed = window.confirm(
        'Are you sure you want to permanently delete this cancelled appointment?'
      );
      if (!confirmed) {
        return;
      }

      try {
        setDeletingAppointmentId(appointmentId);
        setMsg('');
        setMsgType('');

        const token = sessionStorage.getItem('token');

        const response = await fetch(
          `${API_BASE_URL}/api/appointments/${appointmentId}/admin-delete`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          onLogout();
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to delete appointment.'
          );
        }

        setAdminAppointments((current) =>
          current.filter(
            (appointment) => appointment._id !== appointmentId
          )
        );

        // Clamp page to valid range after deletion
        setAppointmentPage((prev) => {
          const remainAfterDelete = filtered.length - 1;
          const newTotalPages = Math.max(1, Math.ceil(remainAfterDelete / APPT_PER_PAGE));
          return Math.min(prev, newTotalPages);
        });
      } catch (error) {
        setMsg(
          error.message || 'Unable to delete appointment.'
        );
        setMsgType('error');
      } finally {
        setDeletingAppointmentId(null);
      }
    };

    const renderStatusBadge = (status) => {
      const classMap = {
        pending: 'aam-status aam-status-pending',
        approved: 'aam-status aam-status-approved',
        rejected: 'aam-status aam-status-rejected',
        cancelled: 'aam-status aam-status-cancelled',
      };
      const label = status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : 'Pending';
      return (
        <span className={classMap[status] || 'aam-status'}>
          <span className="aam-status-dot" />
          {label}
        </span>
      );
    };

    const renderActionButton = (appt) => {
      const isApproving = approvingAppointmentId === appt._id;
      const isDeleting = deletingAppointmentId === appt._id;

      if (appt.status === 'pending') {
        return (
          <button
            type="button"
            className="aam-approve-button"
            onClick={() => handleAdminApproveAppointment(appt._id)}
            disabled={isApproving}
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
        );
      }
      if (appt.status === 'cancelled') {
        return (
          <button
            type="button"
            className="aam-delete-button"
            onClick={() => handleDeleteCancelledAppointment(appt._id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        );
      }
      const labelMap = {
        approved: 'Approved',
        rejected: 'Rejected',
      };
      return (
        <button
          type="button"
          className="aam-approve-button"
          disabled
        >
          {labelMap[appt.status] || appt.status}
        </button>
      );
    };

    return (
      <div className="aam-page">
        <div className="aam-heading">
          <p className="aam-eyebrow">ADMINISTRATOR ACCESS</p>
          <h2>All Appointments</h2>
          <span>View and approve patient appointment requests.</span>
        </div>

        <div className="aam-card">
          {/* Toolbar */}
          <div className="aam-toolbar">
            <div className="aam-search">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="aam-search-icon">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                className="aam-search-input"
                placeholder="Search by patient, doctor or reason..."
                value={appointmentSearch}
                onChange={(e) => {
                  setAppointmentSearch(e.target.value);
                  setAppointmentPage(1);
                }}
              />
            </div>
            <select
              className="aam-filter"
              value={appointmentStatusFilter}
              onChange={(e) => {
                setAppointmentStatusFilter(e.target.value);
                setAppointmentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Loading / Error */}
          {appointmentLoading && (
            <p className="aam-loading">Loading appointments...</p>
          )}
          {appointmentError && (
            <p className="aam-error">{appointmentError}</p>
          )}

          {!appointmentLoading && !appointmentError && (
            <>
              {/* Table */}
              <div className="aam-table-scroll">
                <table className="aam-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Patient ID</th>
                      <th>Patient Name</th>
                      <th>Doctor ID</th>
                      <th>Doctor Name</th>
                      <th>Date &amp; Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="aam-empty">
                          No matching appointments found.
                        </td>
                      </tr>
                    ) : (
                      visible.map((appt, index) => (
                        <tr key={appt._id}>
                          <td>{startIndex + index + 1}</td>
                          <td>{appt.patientUserId}</td>
                          <td>{appt.patientName}</td>
                          <td>{appt.doctorUserId}</td>
                          <td>{appt.doctorName}</td>
                          <td>{new Date(appt.appointmentDate).toLocaleString()}</td>
                          <td className="aam-reason">{appt.reason}</td>
                          <td>{renderStatusBadge(appt.status)}</td>
                          <td>{renderActionButton(appt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="aam-footer">
                <div className="aam-count">
                  Showing {showStart} to {showEnd} of {filtered.length} appointments
                </div>
                <div className="aam-pagination">
                  <button
                    type="button"
                    className="aam-page-button"
                    disabled={safePage === 1}
                    onClick={() => setAppointmentPage(Math.max(1, safePage - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      type="button"
                      key={pageNum}
                      className={
                        safePage === pageNum
                          ? 'aam-page-button aam-page-active'
                          : 'aam-page-button'
                      }
                      onClick={() => setAppointmentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="aam-page-button"
                    disabled={safePage === totalPages}
                    onClick={() => setAppointmentPage(Math.min(totalPages, safePage + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case 'doctor':
        return renderDoctorForm();

      case 'patient':
        return renderPatientForm();

      case 'admin':
        return renderAdminForm();

      case 'adminOverview':
        return renderAdminOverview();

      case 'doctorManagement':
        return renderDoctorManagement();

      case 'patientManagement':
        return renderPatientManagement();

      case 'appointmentManagement':
        return renderAppointmentManagement();

      default:
        return renderHome();
    }
  };


  // MAIN PAGE

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

          <button
            type="button"
            onClick={() =>
              changeView('admin')
            }
            className={
              view === 'admin'
                ? 'admin-nav-btn active'
                : 'admin-nav-btn'
            }
          >
            Add Admin
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

      <main
        className={`admin-content ${view === 'doctorManagement' || view === 'doctor' || view === 'patientManagement' || view === 'appointmentManagement' || view === 'admin'
          ? 'admin-content-scrollable'
          : ''
          }`}
      >
        {renderContent()}
      </main>

      {/* FOOTER */}

      <footer className="admin-footer">
        All Rights Reserved | 2026 MediFlow Web Team
      </footer>
    </div>
  );
}
