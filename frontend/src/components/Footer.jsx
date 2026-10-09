import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { platformSettings } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--color-bg-surface)',
      borderTop: '1px solid var(--color-border-subtle)',
      paddingTop: '3.5rem',
      paddingBottom: '2rem',
      marginTop: 'auto'
    }}>
      <div className="container">
        {/* Main Footer Navigation Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem 1.5rem',
          paddingBottom: '3rem'
        }}>
          {/* Col 1: Platform Overview */}
          <div style={{ maxWidth: '320px' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <BookOpen size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                {platformSettings.platform_name || 'Vaibhav Dhus LMS'}
              </span>
            </Link>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Enterprise online learning ecosystem tailored for the Indian tech workforce. Featuring DRM-ready video protection, byte-range streaming, and hands-on production engineering.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.785rem', color: 'var(--color-success)', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Session Shield & Watermark Protected</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <li>
                <Link to="/courses" style={{ transition: 'color var(--transition-fast)' }}>
                  Explore Courses
                </Link>
              </li>
              <li>
                <Link to="/dashboard" style={{ transition: 'color var(--transition-fast)' }}>
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/verify-certificate/VDLMS-CERT-DEMO" style={{ transition: 'color var(--transition-fast)' }}>
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link to="/login" style={{ transition: 'color var(--transition-fast)' }}>
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" style={{ transition: 'color var(--transition-fast)' }}>
                  New Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Notes */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
              Free Resources
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <li>
                <Link to="/courses/enterprise-full-stack-mastery" style={{ transition: 'color var(--transition-fast)' }}>
                  Architecture Blueprint (PDF)
                </Link>
              </li>
              <li>
                <Link to="/courses/enterprise-full-stack-mastery" style={{ transition: 'color var(--transition-fast)' }}>
                  JWT & Video Security Notes
                </Link>
              </li>
              <li>
                <Link to="/courses/enterprise-full-stack-mastery" style={{ transition: 'color var(--transition-fast)' }}>
                  MySQL Production Indexing Guide
                </Link>
              </li>
              <li>
                <Link to="/courses/enterprise-full-stack-mastery" style={{ transition: 'color var(--transition-fast)' }}>
                  Production Readiness Checklist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
              Legal & Support
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <li>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: All student data is encrypted and strictly maintained under Indian data protection standards.'); }}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Course access is authorized for personal single-user learning. Recording or redistribution is strictly prohibited.'); }}>
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#refund" onClick={(e) => { e.preventDefault(); alert('Refund Policy: 7-day satisfaction guarantee for all enrolled verified Indian masterclass students.'); }}>
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="mailto:support@vaibhavdhuslms.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} />
                  <span>support@vaibhavdhuslms.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Mandatory Developer Credit */}
        <div style={{
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '1.75rem',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.835rem',
          color: 'var(--color-text-secondary)'
        }}>
          <div>
            &copy; {currentYear} {platformSettings.platform_name || 'Vaibhav Dhus LMS'}. All rights reserved.
          </div>

          {/* Official Clickable NEOTECHKING Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Designed &amp; Developed by</span>
            <a
              href="https://neotechking.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: 600,
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(var(--color-primary-rgb), 0.3)'
              }}
            >
              <span>NEOTECHKING Global Solutions Private Limited</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
