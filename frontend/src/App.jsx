import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UnifiedLogin from './components/auth/UnifiedLogin';
import AdminDashboard from './components/dashboard/AdminDashboard';
import TenantDashboard from './components/dashboard/TenantDashboard';
import DashboardLayout from './layouts/DashboardLayout';
import { DashboardProvider } from './context/DashboardContext';
import { adminTabs, tenantTabs } from './config/dashboardTabs';

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
  localStorage.removeItem('bap_token'); // 👈 agregar
  localStorage.removeItem('bap_session');
};

  const tabs = user?.role === 'admin' ? adminTabs : tenantTabs;

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
            !user ? (
              <Navigate to="/" replace />
            ) : (
              <DashboardProvider>
                <DashboardLayout user={user} onLogout={handleLogout} tabs={tabs}>
                  {user.role === 'admin' ? (
                    <AdminDashboard user={user} />
                  ) : (
                    <TenantDashboard user={user} onLogout={handleLogout} />
                  )}
                </DashboardLayout>
              </DashboardProvider>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;