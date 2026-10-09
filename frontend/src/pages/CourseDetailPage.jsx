import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Star, 
  FileText, 
  Download,
  Lock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { courseService, resourceService } from '../services/lmsServices';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openSections, setOpenSections] = useState({ 1: true });

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await courseService.getCourseBySlug(slug);
        setCourse(data);
        // Expand all sections by default
        const map = {};
        data?.sections?.forEach(s => { map[s.id] = true; });
        setOpenSections(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [slug]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(`/courses/${slug}`));
      return;
    }

    setEnrolling(true);
    try {
      await courseService.enroll(course.id);
      setCourse(prev => ({ ...prev, isEnrolled: true }));
      navigate(`/player/${course.slug}`);
    } catch (err) {
      alert(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadResource = async (res) => {
    try {
      await resourceService.downloadPdf(res.id, res.file_name);
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading course details...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2>Course Not Found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const totalLessons = course.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) || 12;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>
      
      {/* 1. Hero Header Banner */}
      <section style={{
        background: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '3rem 0'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          {/* Left Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <span className="badge badge-primary">{course.category_name || 'Architecture'}</span>
              <span className="badge badge-secondary">{course.difficulty_level}</span>
            </div>

            <h1 style={{ lineHeight: 1.25, marginBottom: '0.85rem' }}>
              {course.title}
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {course.subtitle}
            </p>

            {/* Quick stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.835rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={15} color="var(--color-primary)" />
                <span>Instructor: <strong>{course.instructor_name || 'Dr. Sarah Mitchell'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} color="var(--color-secondary)" />
                <span>Duration: <strong>5h 07m</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BookOpen size={15} color="var(--color-accent)" />
                <span><strong>{totalLessons}</strong> Video Lectures</span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
              {course.isEnrolled ? (
                <Link to={`/player/${course.slug}`} className="btn btn-primary btn-lg">
                  <PlayCircle size={18} />
                  <span>Continue Learning (Go to Player)</span>
                </Link>
              ) : (
                <>
                  <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary btn-lg">
                    <Sparkles size={18} />
                    <span>{enrolling ? 'Enrolling...' : `Enroll Now for ${formatINR(course.discount_price || course.price)}`}</span>
                  </button>

                  {/* Free Preview button for lesson 1 */}
                  <Link to={`/player/${course.slug}`} className="btn btn-secondary btn-lg">
                    <PlayCircle size={18} />
                    <span>Watch Free Preview</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="card" style={{ padding: '0.85rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', background: '#020617' }}>
              <img
                src={course.thumbnail_url}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Link
                  to={`/player/${course.slug}`}
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform var(--transition-fast)'
                  }}
                  title="Watch Free Preview"
                >
                  <PlayCircle size={28} />
                </Link>
              </div>
            </div>

            <div style={{ padding: '1rem 0.5rem 0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Full Lifetime Access</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {formatINR(course.discount_price || course.price)}
                  </span>
                  {course.discount_price && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                      {formatINR(course.price)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.785rem', color: 'var(--color-success)', fontWeight: 500 }}>
                <ShieldCheck size={15} />
                <span>Instant Access • Dynamic Forensic Watermark Protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Course Curriculum Accordion */}
      <section className="container">
        <div style={{ maxWidth: '820px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>Curriculum Breakdown</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {course.sections?.length || 4} Modules • {totalLessons} Comprehensive Lessons • Production Ready Architecture
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {course.sections?.map((section) => {
              const isExpanded = openSections[section.id];

              return (
                <div key={section.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      background: 'var(--color-bg-elevated)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{section.title}</div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {section.lessons?.length || 0} Lessons • {section.description}
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '0.5rem 1rem 0.75rem' }}>
                      {section.lessons?.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.5rem',
                            borderBottom: lIdx === section.lessons.length - 1 ? 'none' : '1px solid var(--color-border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <PlayCircle size={16} color="var(--color-primary)" />
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lesson.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {Math.round(lesson.duration_seconds / 60)} mins
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {lesson.is_preview === 1 ? (
                              <Link
                                to={`/player/${course.slug}?lessonId=${lesson.id}`}
                                className="badge badge-primary"
                                style={{ textDecoration: 'none' }}
                              >
                                Preview
                              </Link>
                            ) : !course.isEnrolled ? (
                              <Lock size={14} color="var(--color-text-muted)" />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Free PDF Resources Section */}
      <section className="container">
        <div style={{ maxWidth: '820px' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>Downloadable Architecture Resources</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Free reference guides, schema diagrams, and checklists accompanying the lectures.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {course.courseResources?.concat(
              course.sections?.flatMap(s => s.lessons?.flatMap(l => l.resources || [])) || []
            ).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i).map((res) => (
              <div key={res.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(var(--color-primary-rgb), 0.1)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{res.title}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                      PDF Document • {res.is_free === 1 ? 'Free Download' : 'Enrolled'}
                    </div>
                  </div>
                </div>

                {res.is_free === 1 || course.isEnrolled ? (
                  <button
                    onClick={() => handleDownloadResource(res)}
                    className="btn btn-secondary btn-sm"
                    title="Download Free PDF"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                ) : (
                  <Lock size={15} color="var(--color-text-muted)" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Student Reviews */}
      <section className="container">
        <div style={{ maxWidth: '820px' }}>
          <h2 style={{ fontSize: '1.65rem', marginBottom: '1.25rem' }}>Student Reviews &amp; Feedback</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {course.reviews?.map((rev) => (
              <div key={rev.id} className="card" style={{ padding: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rev.student_name}</div>
                  <div style={{ display: 'flex', gap: '0.15rem', color: '#f59e0b' }}>
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={13} fill="#f59e0b" />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                  {rev.review_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
