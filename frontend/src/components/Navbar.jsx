import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  BookOpen, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  ShieldCheck, 
  LayoutDashboard, 
  Settings, 
  Menu, 
  X,
  Award,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { themeMode, toggleTheme, platformSettings } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isPlayerRoute = location.pathname.startsWith('/player');

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--color-border-subtle)',
      backgroundColor: 'var(--color-bg-surface)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BookOpen size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
              {platformSettings.platform_name || 'Vaibhav Dhus LMS'}
            </span>
            <span style={{ fontSize: '0.685rem', color: 'var(--color-text-muted)', marginTop: '-2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Online Learning Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', gap: '1.75rem', alignItems: 'center' }} className="hide-mobile">
          <Link 
            to="/courses" 
            style={{ 
              fontSize: '0.875rem', 
              fontWeight: 500, 
              color: location.pathname === '/courses' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)'
            }}
          >
            Explore Courses
          </Link>

          {isAuthenticated && (
            <Link 
              to="/dashboard" 
              style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: location.pathname === '/dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
            >
              My Learning
            </Link>
          )}

          {isAdmin && (
            <Link 
              to="/admin" 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: location.pathname.startsWith('/admin') ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
            >
              <Settings size={14} />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Light / Dark Mode Toggle */}
          <button 
            onClick={toggleTheme}
            title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
            aria-label="Toggle theme"
          >
            {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Desktop Auth State */}
          <div className="hide-mobile">
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <div style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(var(--color-primary-rgb), 0.12)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span style={{ fontSize: '0.835rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '220px',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '0.5rem',
                    zIndex: 100
                  }}>
                    <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '0.35rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.email}</div>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.825rem',
                          color: 'var(--color-primary)',
                          fontWeight: 600
                        }}
                      >
                        <Settings size={15} />
                        Admin Console
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        color: 'var(--color-danger)',
                        textAlign: 'left',
                        marginTop: '0.25rem'
                      }}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="hide-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
            aria-label="Open mobile navigation"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          Off-Canvas Mobile Navigation Drawer
          ------------------------------------------------------------- */}
      {mobileDrawerOpen && (
        <>
          <div 
            className="mobile-drawer-overlay" 
            onClick={() => setMobileDrawerOpen(false)} 
          />
          <div className="mobile-drawer">
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={16} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                  {platformSettings.platform_name || 'Vaibhav Dhus LMS'}
                </span>
              </div>
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-sm)'
                }}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* User status card (if logged in) */}
            {isAuthenticated ? (
              <div style={{
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{user?.email}</div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{user?.role?.toUpperCase()}</span>
              </div>
            ) : null}

            {/* Navigation items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <Link 
                to="/courses"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}
              >
                <span>Explore Courses</span>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </Link>

              {isAuthenticated && (
                <Link 
                  to="/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    borderBottom: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <span>Student Dashboard</span>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </Link>
              )}

              {isAdmin && (
                <Link 
                  to="/admin"
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    borderBottom: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <span>Admin Console</span>
                  <ChevronRight size={16} color="var(--color-primary)" />
                </Link>
              )}

              <Link 
                to="/verify-certificate/VDLMS-DEMO-SAMPLE"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}
              >
                <span>Verify Certificate</span>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </Link>
            </div>

            {/* Bottom Drawer Actions */}
            <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isAuthenticated ? (
                <button
                  onClick={() => { setMobileDrawerOpen(false); handleLogout(); }}
                  className="btn btn-secondary"
                  style={{ width: '100%', color: 'var(--color-danger)' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link 
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
