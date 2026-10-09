import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SessionRevokedModal from './components/SessionRevokedModal';

import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';

import './styles/theme.css';

function AppLayout() {
  const location = useLocation();
  const isPlayerView = location.pathname.startsWith('/player');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <SessionRevokedModal />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/player/:slug" element={<CoursePlayerPage />} />
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-certificate/:code" element={<CertificateVerifyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isPlayerView && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
