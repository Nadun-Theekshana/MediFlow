import { useState } from 'react';
import Login from './components/Login.jsx';
import './App.css';
import './styles/Login.css';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = (loggedUser) => {
    setUser(loggedUser);
    setError('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const userId = e.target.userId.value.trim();
    const password = e.target.password.value;
    if (!userId || !password) {
      setError('User ID and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      if (!res.ok) {
        if (res.status === 401) setError('Invalid User ID or password.');
        else setError('Unable to connect to the server. Please try again.');
        return;
      }
      const data = await res.json();
      const { token, user: loggedUser } = data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify({ userId: loggedUser.userId, name: loggedUser.name, role: loggedUser.role }));
      handleLoginSuccess(loggedUser);
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Login onLoginSuccess={handleLoginSuccess} />
    );
  }

  return (
    <>
      {user.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
      {user.role === 'doctor' && <DoctorDashboard user={user} onLogout={handleLogout} />}
      {user.role === 'patient' && <PatientDashboard user={user} onLogout={handleLogout} />}
    </>
  );




}

export default App;
