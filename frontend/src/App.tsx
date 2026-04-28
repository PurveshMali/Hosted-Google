import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/ngo/Dashboard';
import TeamManagement from './pages/ngo/TeamManagement';
import { ReportNeed } from './pages/reporter/ReportNeed';
import { VolunteerHome } from './pages/volunteer/VolunteerHome';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ResetPassword from './pages/auth/ResetPassword';
import { ProtectedRoute } from './router/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#111827',
            borderRadius: '0px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            fontWeight: '600'
          },
          success: {
            iconTheme: {
              primary: '#0891b2',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* NGO Admin Routes */}
        <Route 
          path="/ngo/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['ngo_admin', 'super_admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ngo/team" 
          element={
            <ProtectedRoute allowedRoles={['ngo_admin', 'super_admin']}>
              <TeamManagement />
            </ProtectedRoute>
          } 
        />

        {/* Placeholder Routes for Sidebar Sections */}
        {['heatmap', 'tasks', 'reports', 'settings'].map(path => (
          <Route 
            key={path}
            path={`/ngo/${path}`} 
            element={
              <ProtectedRoute allowedRoles={['ngo_admin', 'super_admin']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        ))}
        
        {/* Field Reporter Routes */}
        <Route 
          path="/reporter/report" 
          element={
            <ProtectedRoute allowedRoles={['field_reporter']}>
              <ReportNeed />
            </ProtectedRoute>
          } 
        />
        
        {/* Volunteer Routes */}
        <Route 
          path="/volunteer" 
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerHome />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
