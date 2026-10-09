import React, { useState } from 'react';
import { 
  CheckCircle2, 
  PlayCircle, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  FileText,
  Award,
  X
} from 'lucide-react';

export default function CourseSidebar({ 
  course, 
  currentLessonId, 
  onSelectLesson, 
  progressData = {},
  isEnrolled = false,
  isOpen = true,
  onCloseMobile
}) {
  // Track open state for module accordions (default open all)
  const [openSections, setOpenSections] = useState(() => {
    const map = {};
    course?.sections?.forEach(s => { map[s.id] = true; });
    return map;
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalLessons = course?.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 12;
  const completedLessonsCount = Object.values(progressData).filter(p => p?.is_completed).length;
  const progressPercent = Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100));

  return (
    <aside style={{
      width: '100%',
      maxWidth: '380px',
      height: '100%',
      background: 'var(--color-bg-surface)',
      borderRight: '1px solid var(--color-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Course Title & Progress Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Course Content
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="course-sidebar-mobile-close"
              aria-label="Close curriculum sidebar"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                padding: '0.3rem',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.75rem' }}>
          {course?.title}
        </h2>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
            <span>{completedLessonsCount} / {totalLessons} Completed</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{progressPercent}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Sections and Lessons List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {course?.sections?.map((section, idx) => {
          const isExpanded = openSections[section.id];
          const sectionCompletedCount = section.lessons?.filter(l => progressData[l.id]?.is_completed).length || 0;

          return (
            <div key={section.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              {/* Section Accordion Header */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text-primary)',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-surface)'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{section.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {sectionCompletedCount}/{section.lessons?.length || 0} Lessons
                  </span>
                </div>
                {isExpanded ? <ChevronDown size={17} color="var(--color-text-muted)" /> : <ChevronRight size={17} color="var(--color-text-muted)" />}
              </button>

              {/* Lesson Items */}
              {isExpanded && (
                <div style={{ background: 'var(--color-bg-base)' }}>
                  {section.lessons?.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = progressData[lesson.id]?.is_completed;
                    const isLocked = !isEnrolled && lesson.is_preview !== 1 && lesson.is_free !== 1;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          if (!isLocked) {
                            onSelectLesson(lesson);
                            if (onCloseMobile) onCloseMobile();
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.75rem 1.25rem 0.75rem 1.5rem',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          background: isActive 
                            ? 'rgba(var(--color-primary-rgb), 0.12)' 
                            : 'transparent',
                          borderLeft: isActive 
                            ? '3px solid var(--color-primary)' 
                            : '3px solid transparent',
                          opacity: isLocked ? 0.6 : 1,
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive && !isLocked) e.currentTarget.style.background = 'var(--color-bg-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive && !isLocked) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Status Icon */}
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>
                          {isCompleted ? (
                            <CheckCircle2 size={16} color="var(--color-success)" />
                          ) : isActive ? (
                            <PlayCircle size={16} color="var(--color-primary)" className="pulse-active" />
                          ) : isLocked ? (
                            <Lock size={15} color="var(--color-text-muted)" />
                          ) : (
                            <div style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: 'var(--radius-full)',
                              border: '1.5px solid var(--color-border-strong)'
                            }} />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            lineHeight: 1.4,
                            marginBottom: '0.2rem'
                          }}>
                            {lesson.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Clock size={12} />
                              {formatDuration(lesson.duration_seconds)}
                            </span>
                            {lesson.resources?.length > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <FileText size={12} />
                                {lesson.resources.length} PDF
                              </span>
                            )}
                            {lesson.is_preview === 1 && (
                              <span className="badge badge-primary" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                                Free Preview
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .course-sidebar-mobile-close {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
}
