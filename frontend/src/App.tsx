import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import ConnectData from './pages/ConnectData';
import ScoreDashboard from './pages/ScoreDashboard';
import LoanApply from './pages/LoanApply';
import LoanStatus from './pages/LoanStatus';
import Repayment from './pages/Repayment';
import Vouching from './pages/Vouching';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-forest-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Auth />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/connect" element={<ProtectedRoute><ConnectData /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><ScoreDashboard /></ProtectedRoute>} />
      <Route path="/apply" element={<ProtectedRoute><LoanApply /></ProtectedRoute>} />
      <Route path="/loans/:id" element={<ProtectedRoute><LoanStatus /></ProtectedRoute>} />
      <Route path="/repayment/:loanId" element={<ProtectedRoute><Repayment /></ProtectedRoute>} />
      <Route path="/vouch" element={<ProtectedRoute><Vouching /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
