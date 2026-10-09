import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  PlayCircle, 
  Download, 
  Zap, 
  Users, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Award,
  BookOpen,
  Server,
  Database
} from 'lucide-react';
import { courseService } from '../services/lmsServices';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatINR } from '../utils/formatters';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { platformSettings } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await courseService.getCourses();
        setCourses(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const flagshipCourse = courses[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '4rem' }}>
      
      {/* 1. Hero Section */}
      <section style={{
        padding: '3.5rem 0 2.5rem',
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.785rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            marginBottom: '1.25rem'
          }}>
            <ShieldCheck size={14} />
            <span>ENTERPRISE FULL-STACK &amp; VIDEO SECURITY MASTERCLASS</span>
          </div>

          <h1 style={{
            lineHeight: 1.2,
            marginBottom: '1.25rem',
            letterSpacing: '-0.025em'
          }}>
            Master Industrial-Grade Full-Stack Architecture &amp; Secure Video Systems
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '680px',
            margin: '0 auto 2rem'
          }}>
            Built for engineering leaders and full-stack software developers in India. Master byte-range video streaming, ephemeral HMAC access tokens, dynamic forensic watermarking, and resilient MySQL clustering.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.85rem' }}>
            {flagshipCourse ? (
              <Link to={`/courses/${flagshipCourse.slug}`} className="btn btn-primary btn-lg">
                <PlayCircle size={18} />
                <span>Explore Masterclass ({flagshipCourse.lesson_count || 12} Lessons)</span>
              </Link>
            ) : (
              <Link to="/courses" className="btn btn-primary btn-lg">
                <span>Explore Course Catalog</span>
              </Link>
            )}

            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-secondary btn-lg">
                <span>Go to My Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/register" className="btn btn-secondary btn-lg">
                <span>Create Free Student Account</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {/* Key Metric Badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginTop: '2.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--color-border-subtle)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Zap size={18} color="var(--color-primary)" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>HMAC Stream Tokens</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Expiring cryptographic access</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ShieldCheck size={18} color="var(--color-success)" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Forensic Watermarking</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Dynamic anti-leak canvas layer</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Download size={18} color="var(--color-info)" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Free PDF Engineering Guides</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Downloadable system blueprints</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Flagship Featured Masterclass Card (With strict INR pricing) */}
      {flagshipCourse && (
        <section className="container">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.35rem' }}>FEATURED CURRICULUM</span>
              <h2 style={{ fontSize: '1.65rem' }}>Production Masterclass Course</h2>
            </div>
            <Link to="/courses" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All Courses</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="card" style={{
            padding: '1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
            {/* Thumbnail with overlay info */}
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', background: '#020617' }}>
              <img
                src={flagshipCourse.thumbnail_url}
                alt={flagshipCourse.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <PlayCircle size={16} color="var(--color-primary)" />
                  <span>12 Comprehensive Video Lessons</span>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-secondary">{flagshipCourse.category_name || 'Full-Stack Architecture'}</span>
                <span className="badge badge-primary">{flagshipCourse.difficulty_level}</span>
              </div>

              <h3 style={{ fontSize: '1.35rem', lineHeight: 1.35 }}>
                {flagshipCourse.title}
              </h3>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                {flagshipCourse.subtitle}
              </p>

              {/* Meta stats bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                padding: '0.85rem 0',
                borderTop: '1px solid var(--color-border-subtle)',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Lessons</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{flagshipCourse.lesson_count || 12} Lectures</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Duration</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>5h 07m</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rating</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-warning)' }}>★ 4.9 (Mastery)</div>
                </div>
              </div>

              {/* Pricing & CTA in INR */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Special Indian Student Offer</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatINR(flagshipCourse.discount_price || flagshipCourse.price)}
                    </span>
                    {flagshipCourse.discount_price && (
                      <span style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                        {formatINR(flagshipCourse.price)}
                      </span>
                    )}
                  </div>
                </div>

                <Link to={`/courses/${flagshipCourse.slug}`} className="btn btn-primary" style={{ padding: '0.65rem 1.35rem' }}>
                  <span>View Syllabus &amp; Enroll</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Core Architectural Engineering Pillars */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
          <span className="badge badge-success" style={{ marginBottom: '0.35rem' }}>SECURITY &amp; SYSTEM INTEGRITY</span>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Enterprise-Grade Intellectual Property Shield</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Built using industry-standard defense-in-depth principles to protect course media and curb unauthorized distribution.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Card 1 */}
          <div className="card">
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(var(--color-primary-rgb), 0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Zap size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.45rem' }}>Signed Ephemeral Video Stream</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Videos are never exposed via static URLs. Every stream chunk requires a cryptographically signed HMAC token verifying active enrollment and expiry.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card">
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.45rem' }}>Dynamic Canvas Forensic Watermark</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Subtle canvas watermark rotates student email, user ID, and timestamp across screen quadrants, providing forensic audit trails against screen recording.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card">
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(2, 132, 199, 0.1)',
              color: 'var(--color-info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.45rem' }}>Single-Device Concurrency Shield</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Prevents password sharing. Logging in on a second device alerts the learner and securely revokes older sessions via real-time session invalidation.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
