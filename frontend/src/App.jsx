import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UnifiedLogin } from './components/auth/UnifiedLogin';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { TenantDashboard } from './components/dashboard/TenantDashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('bap_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('bap_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bap_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <UnifiedLogin onLoginSuccess={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={
            !user ? <Navigate to="/" replace /> :
            user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> :
            <TenantDashboard user={user} onLogout={handleLogout} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;