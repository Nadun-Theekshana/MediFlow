// src/components/Login.jsx

import { useState, useEffect } from 'react';
import '../styles/Login.css';
import { API_BASE_URL } from '../config/api';

export default function Login({ onLoginSuccess }) {
  // ---------------------------------------------------------------------------
  // AUTH MODE — 'login' | 'register'
  // ---------------------------------------------------------------------------
  const [authMode, setAuthMode] = useState('login');

  // ---------------------------------------------------------------------------
  // LOGIN STATE
  // ---------------------------------------------------------------------------
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // REGISTRATION STATE
  // ---------------------------------------------------------------------------
  const [registrationPatientId, setRegistrationPatientId] = useState('');
  const [patientIdLoading, setPatientIdLoading] = useState(false);
  const [patientIdError, setPatientIdError] = useState('');
  const [registrationName, setRegistrationName] = useState('');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');
  const [registrationConfirmPassword, setRegistrationConfirmPassword] = useState('');
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(null); // { userId, name }

  // ---------------------------------------------------------------------------
  // FETCH NEXT PATIENT ID PREVIEW when entering register mode
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (authMode !== 'register') {
      return;
    }
    const loadNextPatientId = async () => {
      try {
        setPatientIdLoading(true);
        setPatientIdError('');
        const response = await fetch(`${API_BASE_URL}/api/users/next-patient-id`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Unable to generate Patient ID.');
        }
        setRegistrationPatientId(data.nextPatientId);
      } catch (error) {
        setRegistrationPatientId('');
        setPatientIdError(error.message || 'Unable to generate Patient ID. Please try again.');
      } finally {
        setPatientIdLoading(false);
      }
    };
    loadNextPatientId();
  }, [authMode]);

  // ---------------------------------------------------------------------------
  // SWITCH MODES
  // ---------------------------------------------------------------------------
  const switchToRegister = () => {
    setError('');
    setRegistrationError('');
    setPatientIdError('');
    setRegistrationPatientId('');
    setRegistrationSuccess(null);
    setRegistrationName('');
    setRegistrationEmail('');
    setRegistrationPassword('');
    setRegistrationConfirmPassword('');
    setAuthMode('register');
  };

  const switchToLogin = () => {
    setRegistrationError('');
    setPatientIdError('');
    setRegistrationPatientId('');
    setRegistrationSuccess(null);
    setAuthMode('login');
  };

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUserId = userId.trim();

    if (!trimmedUserId || !password) {
      setError('User ID and password are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: trimmedUserId, password }),
      });

      if (res.status === 401) {
        setError('Invalid User ID or password.');
        return;
      }

      if (!res.ok) {
        setError('Unable to connect to the server. Please try again.');
        return;
      }

      const data = await res.json();
      const { token, user } = data;

      sessionStorage.setItem('token', token);
      sessionStorage.setItem(
        'user',
        JSON.stringify({
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        })
      );

      onLoginSuccess(user);
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REGISTRATION
  // ---------------------------------------------------------------------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError('');

    const trimmedName = registrationName.trim();
    const trimmedEmail = registrationEmail.trim();

    if (!trimmedName || !trimmedEmail || !registrationPassword || !registrationConfirmPassword) {
      setRegistrationError('All fields are required.');
      return;
    }

    if (patientIdLoading || !registrationPatientId || patientIdError) {
      setRegistrationError('Unable to generate Patient ID. Please try again.');
      return;
    }

    if (registrationPassword !== registrationConfirmPassword) {
      setRegistrationError('Passwords do not match.');
      return;
    }

    if (registrationPassword.length < 6) {
      setRegistrationError('Password must be at least 6 characters.');
      return;
    }

    setRegistrationLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register-patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: registrationPassword,
          // role / userId / isActive intentionally omitted — backend forces these
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegistrationError(
          data.message || 'Unable to create account. Please try again.'
        );
        return;
      }

      // Success — show the generated patient ID clearly
      setRegistrationSuccess({
        userId: data.user.userId,
        name: data.user.name,
      });

      // Clear sensitive fields
      setRegistrationName('');
      setRegistrationEmail('');
      setRegistrationPassword('');
      setRegistrationConfirmPassword('');
    } catch {
      setRegistrationError('Unable to connect to the server. Please try again.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SIMPLE MEDIFLOW LOGO
  // ---------------------------------------------------------------------------
  const MediFlowLogo = () => (
    <div className="login-logo">
      <svg
        className="login-logo-icon"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <rect x="22" y="4" width="20" height="56" rx="8" />
        <rect x="4" y="22" width="56" height="20" rx="8" />
        <path
          className="login-logo-pulse"
          d="M10 33h12l5-9 8 18 6-12 4 3h9"
        />
      </svg>

      <div className="login-wordmark">
        Medi<span>Flow</span>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // REGISTRATION SUCCESS CARD CONTENT
  // ---------------------------------------------------------------------------
  const renderRegisterSuccess = () => (
    <div className="patient-register-card">
      <div className="patient-register-success-icon" aria-hidden="true">✓</div>
      <h2 className="patient-register-title">Account Created!</h2>
      <p className="patient-register-subtitle">
        Your MediFlow Patient account has been successfully created.
      </p>

      <div className="patient-register-id-reveal">
        <p className="patient-register-id-label">Your Patient ID is:</p>
        <div className="patient-register-id-value">{registrationSuccess.userId}</div>
        <p className="patient-register-id-instruction">
          Use this Patient ID and your password to login.
        </p>
      </div>

      <button
        type="button"
        className="login-button patient-register-button"
        onClick={switchToLogin}
      >
        Go to Login
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // REGISTRATION FORM CARD CONTENT
  // ---------------------------------------------------------------------------
  const renderRegisterForm = () => (
    <div className="patient-register-card">
      <div className="login-card-header">
        <h2 className="patient-register-title">Create Patient Account</h2>
        <p className="patient-register-subtitle">
          Register to access MediFlow as a patient.
        </p>
      </div>

      <form onSubmit={handleRegisterSubmit} className="login-form" noValidate>

        {/* Patient ID — read-only preview */}
        <div className="login-form-group">
          <label htmlFor="reg-patient-id">Patient ID</label>
          <div className="patient-register-id-wrapper">
            <input
              id="reg-patient-id"
              type="text"
              className="patient-register-id-input"
              value={
                patientIdLoading
                  ? 'Loading...'
                  : (registrationPatientId || (patientIdError ? 'Unable to generate Patient ID. Please try again.' : ''))
              }
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
            <span
              className="patient-register-lock-icon"
              aria-hidden="true"
            >
              🔒
            </span>
          </div>
          {patientIdError ? (
            <span className="patient-register-error" role="alert" style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: '#dc2626' }}>
              Unable to generate Patient ID. Please try again.
            </span>
          ) : (
            <span className="patient-register-helper">
              Your Patient ID is automatically generated.
            </span>
          )}
        </div>

        {/* Full Name */}
        <div className="login-form-group">
          <label htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            type="text"
            value={registrationName}
            onChange={(e) => setRegistrationName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </div>

        {/* Email */}
        <div className="login-form-group">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={registrationEmail}
            onChange={(e) => setRegistrationEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div className="login-form-group">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={registrationPassword}
            onChange={(e) => setRegistrationPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="login-form-group">
          <label htmlFor="reg-confirm-password">Confirm Password</label>
          <input
            id="reg-confirm-password"
            type="password"
            value={registrationConfirmPassword}
            onChange={(e) => setRegistrationConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
          />
        </div>

        {registrationError && (
          <div className="login-error patient-register-error" role="alert">
            {registrationError}
          </div>
        )}

        <button
          type="submit"
          className="login-button patient-register-button"
          disabled={registrationLoading || patientIdLoading || !registrationPatientId || Boolean(patientIdError)}
        >
          {registrationLoading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>

      <p className="login-note patient-register-switch">
        Already have an account?{' '}
        <button
          type="button"
          className="patient-register-link"
          onClick={switchToLogin}
        >
          Login
        </button>
      </p>
    </div>
  );

  // ---------------------------------------------------------------------------
  // LOGIN CARD CONTENT
  // ---------------------------------------------------------------------------
  const renderLoginCard = () => (
    <div className="login-card">
      <div className="login-card-header">
        <h2>Welcome Back</h2>
        <p>Sign in to continue to MediFlow.</p>
      </div>

      <form onSubmit={handleLoginSubmit} className="login-form">

        <div className="login-form-group">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your User ID"
            autoComplete="username"
            required
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

      </form>

      <p className="login-note">
        Accounts are provided by the hospital administrator.
      </p>

      <p className="login-note patient-register-switch">
        New patient?{' '}
        <button
          type="button"
          className="patient-register-link"
          onClick={switchToRegister}
        >
          Create Patient Account
        </button>
      </p>
    </div>
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="login-page">

      <main className="login-main">

        {/* LEFT SIDE — unchanged */}
        <section className="login-brand-section">
          <MediFlowLogo />
          <h1>
            Hospital Patient Management
            <br />
            &amp; Appointment System
          </h1>
          <p>
            Securely access the MediFlow hospital
            management system.
          </p>
        </section>

        {/* RIGHT SIDE */}
        <section className="login-card-section">
          {authMode === 'login' && renderLoginCard()}
          {authMode === 'register' && !registrationSuccess && renderRegisterForm()}
          {authMode === 'register' && registrationSuccess && renderRegisterSuccess()}
        </section>

      </main>

      <footer className="login-footer">
        All Rights Reserved | 2026 MediFlow Web Team
      </footer>

    </div>
  );
}