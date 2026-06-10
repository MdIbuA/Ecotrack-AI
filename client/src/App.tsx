import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CarbonProvider } from './context/CarbonContext.js';
import LoadingSpinner from './components/ui/LoadingSpinner.js';

// Lazy-loaded Pages for code splitting
const Login = React.lazy(() => import('./pages/Login.js'));
const Register = React.lazy(() => import('./pages/Register.js'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword.js'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.js'));
const Calculator = React.lazy(() => import('./pages/Calculator.js'));
const Goals = React.lazy(() => import('./pages/Goals.js'));
const AiCoach = React.lazy(() => import('./pages/AiCoach.js'));
const ReceiptScanner = React.lazy(() => import('./pages/ReceiptScanner.js'));
const Reports = React.lazy(() => import('./pages/Reports.js'));
const Achievements = React.lazy(() => import('./pages/Achievements.js'));
const Profile = React.lazy(() => import('./pages/Profile.js'));

// Suspense fallback component for lazy-loaded routes
const SuspenseFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
    <LoadingSpinner size="lg" label="Loading page..." />
  </div>
);

// Route Guard for Protected Pages
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route Guard for Public Auth Pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CarbonProvider>
          <BrowserRouter>
            <React.Suspense fallback={<SuspenseFallback />}>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } />

                {/* Protected App Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/calculator" element={
                  <ProtectedRoute>
                    <Calculator />
                  </ProtectedRoute>
                } />
                <Route path="/goals" element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                } />
                <Route path="/ai-coach" element={
                  <ProtectedRoute>
                    <AiCoach />
                  </ProtectedRoute>
                } />
                <Route path="/receipt-scanner" element={
                  <ProtectedRoute>
                    <ReceiptScanner />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/achievements" element={
                  <ProtectedRoute>
                    <Achievements />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Fallback redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </React.Suspense>
          </BrowserRouter>
        </CarbonProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
