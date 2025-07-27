import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Calls from './pages/Calls';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Profile from './pages/Profile';
import MetaIntegration from './pages/MetaIntegration';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Leads Management */}
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            
            {/* Call Management */}
            <Route path="calls" element={<Calls />} />
            
            {/* Reports */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:id" element={<ReportDetail />} />
            
            {/* User Management (Admin/Supervisor only) */}
            <Route path="users" element={
              <ProtectedRoute roles={['admin', 'supervisor']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="users/:id" element={
              <ProtectedRoute roles={['admin', 'supervisor']}>
                <UserDetail />
              </ProtectedRoute>
            } />
            
            {/* Meta Integration (Admin only) */}
            <Route path="meta" element={
              <ProtectedRoute roles={['admin']}>
                <MetaIntegration />
              </ProtectedRoute>
            } />
            
            {/* Analytics (Admin/Supervisor only) */}
            <Route path="analytics" element={
              <ProtectedRoute roles={['admin', 'supervisor']}>
                <Analytics />
              </ProtectedRoute>
            } />
            
            {/* Profile */}
            <Route path="profile" element={<Profile />} />
            
            {/* Settings (Admin only) */}
            <Route path="settings" element={
              <ProtectedRoute roles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;