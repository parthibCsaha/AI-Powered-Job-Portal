
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import AIChatWidget from './components/common/AIChatWidget';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CandidateDashboard from './pages/CandidateDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import MyApplications from './pages/MyApplications';
import PostJob from './pages/PostJob';
import MyJobs from './pages/MyJobs';
import Applicants from './pages/Applicants';
import Companies from './pages/Companies';
import CandidateProfile from './pages/CandidateProfile';
import EmployerProfile from './pages/EmployerProfile';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/companies" element={<Companies />} />

              {/* Protected Routes - Common */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Profile Route - Role-based redirect */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Candidate */}
              <Route
                path="/my-applications"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <MyApplications />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Employer */}
              <Route
                path="/post-job"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYER']}>
                    <PostJob />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-jobs"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYER']}>
                    <MyJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applicants/:jobId"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYER']}>
                    <Applicants />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Notifications */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Error Routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <AIChatWidget />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (user?.user?.role === 'CANDIDATE') {
    return <CandidateDashboard />;
  } else if (user?.user?.role === 'EMPLOYER') {
    return <EmployerDashboard />;
  } else {
    return <Navigate to="/" replace />;
  }
};

// Profile Redirect Component
const ProfileRedirect = () => {
  const { user } = useAuth();

  if (user?.user?.role === 'CANDIDATE') {
    return <CandidateProfile />;
  } else if (user?.user?.role === 'EMPLOYER') {
    return <EmployerProfile />;
  } else {
    return <Navigate to="/" replace />;
  }
};

export default App;
