import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlayCircle, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Award, 
  ArrowRight,
  LogOut,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { courseService, authService } from '../services/lmsServices';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [courses, sessions] = await Promise.all([
        courseService.getMyCourses(),
        authService.getSessions()
      ]);
      setEnrolledCourses(courses || []);
      setActiveSessions(sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/dashboard');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated]);

  const handleRevokeOthers = async () => {
    setSessionActionLoading(true);
    try {
      await authService.revokeOtherSessions();
      setNotice('All other devices have been logged out successfully.');
      const sessions = await authService.getSessions();
      setActiveSessions(sessions || []);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to revoke other sessions');
    } finally {
      setSessionActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading student dashboard...
      </div>
    );
  }

  // Continue Learning Course (primary active course)
  const continueCourse = enrolledCourses[0];

  return (
    <div className="container" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem 5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. Header Greeting & Quick Stats */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary">STUDENT PORTAL</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Protected Learning Environment</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)' }}>
            Welcome back, {user?.name || 'Learner'}!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Track your lecture progress, resume playback, and manage device sessions.
          </p>
        </div>

        {/* Learning Stats Cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '120px', flex: '1 1 120px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {enrolledCourses.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Enrolled Courses</div>
          </div>

          <div className="card" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '120px', flex: '1 1 120px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {enrolledCourses.reduce((sum, c) => sum + (c.completed_lessons || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Completed Lectures</div>
          </div>
        </div>
      </div>

      {notice && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--color-success)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-success)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. "Continue Learning" Hero Card */}
      {continueCourse && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Continue Learning</h2>
          </div>

          <div className="card" style={{
            padding: 'clamp(1.25rem, 3vw, 2rem)',
            background: 'var(--color-bg-surface)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1.75rem',
            alignItems: 'center'
          }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>LAST ACCESSED</span>
              <h3 style={{ fontSize: '1.45rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                {continueCourse.title}
              </h3>
              
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Last watched: <strong>{continueCourse.last_watched_lesson_title || '01. Architectural Patterns & Decoupled LMS Systems'}</strong>
                {continueCourse.last_watched_second > 0 && (
                  <span> — {Math.floor(continueCourse.last_watched_second / 60)}:{Math.floor(continueCourse.last_watched_second % 60) < 10 ? '0' : ''}{Math.floor(continueCourse.last_watched_second % 60)}</span>
                )}
              </p>

              {/* Progress Bar */}
              <div style={{ maxWidth: '420px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Overall Course Progress</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{continueCourse.progressPercent}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${continueCourse.progressPercent}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)'
                  }} />
                </div>
              </div>

              <Link
                to={`/player/${continueCourse.slug}${continueCourse.last_watched_lesson_id ? `?lessonId=${continueCourse.last_watched_lesson_id}` : ''}`}
                className="btn btn-primary btn-lg"
              >
                <PlayCircle size={20} />
                Continue Learning
              </Link>
            </div>

            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', maxHeight: '240px' }}>
              <img
                src={continueCourse.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'}
                alt={continueCourse.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. Enrolled Courses Grid */}
      <section>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          My Enrolled Courses ({enrolledCourses.length})
        </h2>

        {enrolledCourses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <BookOpen size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Explore Course Catalog
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '1.75rem'
          }}>
            {enrolledCourses.map((c) => (
              <div key={c.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '1rem' }}>
                  <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <h3 style={{ fontSize: '1.1rem', lineHeight: 1.35, marginBottom: '0.5rem' }}>{c.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Instructor: {c.instructor_name}
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 'auto', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Progress: {c.completed_lessons || 0} / {c.total_lessons || 12} Lectures</span>
                    <span style={{ fontWeight: 600 }}>{c.progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${c.progressPercent}%`, height: '100%', background: c.progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/player/${c.slug}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <PlayCircle size={15} />
                    Open Player
                  </Link>

                  {c.progressPercent === 100 && (
                    <Link to={`/verify-certificate/VDLMS-COMPLETED-${c.id}`} className="btn btn-secondary btn-sm" title="View Certificate">
                      <Award size={15} color="var(--color-success)" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Active Device Sessions & Concurrency Shield */}
      <section>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Security & Active Device Sessions</h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              To safeguard course content, account sharing is prevented by active device monitoring.
            </p>
          </div>

          <button
            onClick={handleRevokeOthers}
            disabled={sessionActionLoading || activeSessions.length <= 1}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <LogOut size={15} />
            <span>Log Out All Other Devices</span>
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Device & Client</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>IP Address</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Last Activity</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((session, index) => (
                  <tr key={session.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(var(--color-primary-rgb), 0.12)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {session.device_type === 'mobile' ? <Smartphone size={16} /> : <Laptop size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{session.device_name || 'Web Browser'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {session.os || 'Windows'} • {session.browser || 'Browser'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {session.ip_address}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-muted)' }}>
                      {new Date(session.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {index === 0 ? (
                        <span className="badge badge-success">This Active Device</span>
                      ) : (
                        <span className="badge badge-warning">Active Device</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
