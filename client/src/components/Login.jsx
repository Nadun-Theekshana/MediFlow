// src/components/Login.jsx

import { useState } from 'react';
import '../styles/Login.css';

export default function Login({ onLoginSuccess }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUserId = userId.trim();

    if (!trimmedUserId || !password) {
      setError('User ID and password are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: trimmedUserId,
          password,
        }),
      });

      // Invalid credentials
      if (res.status === 401) {
        setError('Invalid User ID or password.');
        return;
      }

      // Other backend errors
      if (!res.ok) {
        setError('Unable to connect to the server. Please try again.');
        return;
      }

      const data = await res.json();

      const { token, user } = data;

      // Store token
      sessionStorage.setItem('token', token);

      // Store only minimal safe user information
      sessionStorage.setItem(
        'user',
        JSON.stringify({
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        })
      );

      // Continue existing role-based flow in App.jsx
      onLoginSuccess(user);
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className="login-page">

      {/* MAIN AREA */}
      <main className="login-main">

        {/* LEFT SIDE */}
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

          <div className="login-card">

            <div className="login-card-header">
              <h2>Welcome Back</h2>

              <p>
                Sign in to continue to MediFlow.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              <div className="login-form-group">
                <label htmlFor="userId">
                  User ID
                </label>

                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) =>
                    setUserId(e.target.value)
                  }
                  placeholder="Enter your User ID"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div
                  className="login-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? 'Logging in...'
                  : 'Login'}
              </button>

            </form>

            <p className="login-note">
              Accounts are provided by the hospital
              administrator.
            </p>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="login-footer">
        All Rights Reserved | 2026 MediFlow Web Team
      </footer>

    </div>
  );
}