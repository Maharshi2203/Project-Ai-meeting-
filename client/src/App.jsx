import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import CreateMeeting from './pages/CreateMeeting';
import EditMeeting from './pages/EditMeeting';
import MeetingDetails from './pages/MeetingDetails';
import ActionTracker from './pages/ActionTracker';

/**
 * Root Route handler:
 * Directs unauthenticated users to /login immediately when opening the web app,
 * while logged-in users are routed straight to /dashboard.
 */
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Landing Route - Defaults to Login if not authenticated */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected SaaS App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/meetings/new" element={<CreateMeeting />} />
                <Route path="/meetings/:id" element={<MeetingDetails />} />
                <Route path="/meetings/:id/edit" element={<EditMeeting />} />
                <Route path="/actions" element={<ActionTracker />} />
              </Route>
            </Route>

            {/* Catch-all Fallback -> RootRedirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
