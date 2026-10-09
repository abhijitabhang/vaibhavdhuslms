import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Menu, 
  X, 
  FileText, 
  Info, 
  Award,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import CourseSidebar from '../components/CourseSidebar';
import ResourcesTab from '../components/ResourcesTab';
import { courseService, progressService, certificateService } from '../services/lmsServices';
import { useAuth } from '../context/AuthContext';

export default function CoursePlayerPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources'
  const [celebrationAwarded, setCelebrationAwarded] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  // 1. Flatten all lessons for easy previous/next navigation
  const allLessons = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.flatMap(section => section.lessons || []);
  }, [course]);

  // Current lesson index in flattened list
  const currentIndex = useMemo(() => {
    if (!currentLesson || !allLessons.length) return 0;
    return allLessons.findIndex(l => l.id === currentLesson.id);
  }, [currentLesson, allLessons]);

  // Load course details and user progress
  useEffect(() => {
    async function initPlayer() {
      try {
        const courseData = await courseService.getCourseBySlug(slug);
        setCourse(courseData);

        // Fetch user progress across lessons
        let progMap = {};
        if (isAuthenticated) {
          try {
            const progRes = await progressService.getCourseProgress(courseData.id);
            progRes.lessonsProgress?.forEach(p => {
              progMap[p.lesson_id] = p;
            });
            setProgressMap(progMap);

            if (progRes.percentage === 100) {
              setCelebrationAwarded(true);
            }
          } catch (e) {
            console.warn('Could not load course progress:', e);
          }
        }

        // Determine which lesson to activate:
        // Priority 1: URL parameter ?lessonId=...
        // Priority 2: Last watched lesson
        // Priority 3: First lesson of the course
        const lessons = courseData.sections?.flatMap(s => s.lessons || []) || [];
        const paramId = searchParams.get('lessonId');
        let initialLesson = null;

        if (paramId) {
          initialLesson = lessons.find(l => l.id === parseInt(paramId, 10));
        }

        if (!initialLesson) {
          // Find last watched uncompleted lesson or first lesson
          const inProgressLessonId = Object.keys(progMap).find(id => !progMap[id].is_completed);
          if (inProgressLessonId) {
            initialLesson = lessons.find(l => l.id === parseInt(inProgressLessonId, 10));
          }
        }

        if (!initialLesson && lessons.length > 0) {
          initialLesson = lessons[0];
        }

        setCurrentLesson(initialLesson);
      } catch (err) {
        console.error('Failed to load course player:', err);
      } finally {
        setLoading(false);
      }
    }

    initPlayer();
  }, [slug, isAuthenticated]);

  // Handle lesson selection
  const handleSelectLesson = (lesson) => {
    setCurrentLesson(lesson);
    setSearchParams({ lessonId: lesson.id });
  };

  // Navigate Previous
  const handlePreviousLesson = () => {
    if (currentIndex > 0) {
      handleSelectLesson(allLessons[currentIndex - 1]);
    }
  };

  // Navigate Next
  const handleNextLesson = () => {
    if (currentIndex < allLessons.length - 1) {
      handleSelectLesson(allLessons[currentIndex + 1]);
    }
  };

  // Mark lesson completed manually or automatically
  const handleToggleComplete = async () => {
    if (!currentLesson) return;
    const isCurrentlyCompleted = progressMap[currentLesson.id]?.is_completed;
    const newStatus = !isCurrentlyCompleted;

    try {
      const res = await progressService.saveProgress(currentLesson.id, {
        currentTime: currentLesson.duration_seconds || 100,
        duration: currentLesson.duration_seconds || 100,
        isCompleted: newStatus
      });

      setProgressMap(prev => ({
        ...prev,
        [currentLesson.id]: {
          ...prev[currentLesson.id],
          is_completed: newStatus,
          watch_percentage: newStatus ? 100 : 0
        }
      }));

      // Check if course 100% complete
      if (res?.isCourseFinished && !celebrationAwarded) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setCelebrationAwarded(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle completion triggered from player onEnded
  const handleVideoEnded = () => {
    handleToggleComplete();
    // Auto advance after 2 seconds
    if (currentIndex < allLessons.length - 1) {
      setTimeout(() => {
        handleNextLesson();
      }, 2000);
    }
  };

  const handleClaimCertificate = async () => {
    try {
      const cert = await certificateService.getCertificate(course.id);
      setCertificateData(cert);
      navigate(cert.verification_url);
    } catch (err) {
      alert(err.message || 'Could not issue certificate');
    }
  };

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 4.25rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Initializing secure playback workspace...
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h3>Lesson or Course unavailable</h3>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Courses
        </Link>
      </div>
    );
  }

  const isCurrentCompleted = progressMap[currentLesson.id]?.is_completed;
  const initialTime = progressMap[currentLesson.id]?.last_watched_second || 0;

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 4.25rem)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* 1. Desktop & Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="player-sidebar-backdrop"
          aria-hidden="true"
        />
      )}
      <div className={`player-sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
        <CourseSidebar
          course={course}
          currentLessonId={currentLesson.id}
          onSelectLesson={handleSelectLesson}
          progressData={progressMap}
          isEnrolled={course.isEnrolled}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* 2. Main Player Work Area */}
      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-base)'
      }}>
        
        {/* Top Mini Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile toggle button */}
            <button
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="mobile-sidebar-toggle btn btn-secondary btn-sm"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.4rem 0.65rem'
              }}
            >
              <Menu size={16} />
              <span>Curriculum</span>
            </button>

            <Link to={`/courses/${course.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              <ArrowLeft size={14} />
              <span>Course Overview</span>
            </Link>
          </div>

          {/* Certificate Award Button if 100% completed */}
          {celebrationAwarded && (
            <button
              onClick={handleClaimCertificate}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.4rem', animation: 'fadeIn 0.3s' }}
            >
              <Award size={15} />
              <span>Claim Certificate</span>
            </button>
          )}
        </div>

        {/* Video Player Canvas Container */}
        <div style={{ background: '#020617', padding: '1rem 1.5rem 0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <SecureVideoPlayer
              key={currentLesson.id}
              lessonId={currentLesson.id}
              initialTime={initialTime}
              onEnded={handleVideoEnded}
              onProgressUpdate={(p) => {
                setProgressMap(prev => ({ ...prev, [currentLesson.id]: p }));
              }}
              courseId={course.id}
            />
          </div>
        </div>

        {/* Lesson Details & Navigation Controls */}
        <div style={{ flex: 1, padding: '1.5rem', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
          
          {/* Action Row: Title + Next/Previous + Mark as complete */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  Lesson {currentIndex + 1} of {allLessons.length}
                </span>
                {initialTime > 0 && !isCurrentCompleted && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Resumed from {Math.floor(initialTime / 60)}:{Math.floor(initialTime % 60) < 10 ? '0' : ''}{Math.floor(initialTime % 60)}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '1.45rem', lineHeight: 1.3 }}>{currentLesson.title}</h1>
            </div>

            {/* Previous / Next / Complete Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handlePreviousLesson}
                disabled={currentIndex === 0}
                className="btn btn-secondary btn-sm"
                style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                onClick={handleToggleComplete}
                className={`btn btn-sm ${isCurrentCompleted ? 'btn-secondary' : 'btn-primary'}`}
              >
                <CheckCircle size={15} color={isCurrentCompleted ? 'var(--color-success)' : '#ffffff'} />
                {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
              </button>

              <button
                onClick={handleNextLesson}
                disabled={currentIndex === allLessons.length - 1}
                className="btn btn-secondary btn-sm"
                style={{ opacity: currentIndex === allLessons.length - 1 ? 0.4 : 1 }}
              >
                Next Lesson
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Tab Navigation: Overview vs Resources */}
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)', marginTop: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '0.75rem 0.25rem',
                borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Info size={16} />
              <span>Lecture Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              style={{
                padding: '0.75rem 0.25rem',
                borderBottom: activeTab === 'resources' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'resources' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <FileText size={16} />
              <span>Attached PDFs & Notes ({currentLesson.resources?.length || 0})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ paddingTop: '1.5rem' }}>
            {activeTab === 'overview' ? (
              <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  {currentLesson.description || 'In this lecture, we analyze high-performance system architecture patterns, covering decoupled frontend-backend communication, security controls, and production optimization.'}
                </p>

                <div style={{
                  background: 'var(--color-bg-surface)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  marginTop: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Lecture Key Takeaways:
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
                    <li>Decoupled modular architectures enable independent scaling of API and client applications.</li>
                    <li>Security parameters must always be enforced server-side with cryptographic validations.</li>
                    <li>Ephemeral tokens with tight lifecycles prevent hotlinking and direct stream distribution.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <ResourcesTab
                resources={currentLesson.resources?.length ? currentLesson.resources : course.courseResources}
                isEnrolled={course.isEnrolled}
              />
            )}
          </div>
        </div>
      </main>

      {/* Responsive layout CSS */}
      <style>{`
        .player-sidebar {
          display: block;
          height: 100%;
        }
        .player-sidebar-backdrop {
          position: fixed;
          top: 4.25rem;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(2px);
          z-index: 45;
        }
        @media (max-width: 900px) {
          .player-sidebar {
            position: fixed;
            top: 4.25rem;
            bottom: 0;
            left: 0;
            width: min(85vw, 360px);
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
          }
          .player-sidebar.sidebar-open {
            transform: translateX(0);
          }
          .mobile-sidebar-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
