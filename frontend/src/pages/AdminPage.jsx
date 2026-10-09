import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Layers, 
  Save, 
  Video,
  Palette,
  FileText,
  Upload,
  Eye,
  Filter,
  FolderPlus,
  Play
} from 'lucide-react';
import { adminService, settingsService, resourceService } from '../services/lmsServices';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatINR } from '../utils/formatters';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { platformSettings, reloadSettings } = useTheme();
  const navigate = useNavigate();

  // Active tab: 'analytics' | 'courses' | 'resources' | 'students' | 'sessions' | 'settings'
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [availableVideos, setAvailableVideos] = useState([]);
  
  // Student search & filter
  const [searchStudent, setSearchStudent] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'
  const [statusNotice, setStatusNotice] = useState(null);

  // Modal states
  // 1. Course Modal (Create & Edit)
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    subtitle: '',
    price: 4999,
    discount_price: 2499,
    difficulty_level: 'All Levels',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    is_published: 1
  });

  // 2. Curriculum Manager Modal
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [curriculumCourse, setCurriculumCourse] = useState(null);
  const [curriculumData, setCurriculumData] = useState([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  // New Section form inside Curriculum
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // 3. Lesson Modal (Create & Edit)
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    course_id: 1,
    section_id: 1,
    title: '',
    duration_seconds: 900,
    is_preview: false,
    is_free: false,
    video_storage_key: 'sample_masterclass.mp4'
  });

  // 4. Resource / PDF Modal (Create & Edit)
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    course_id: 1,
    lesson_id: '',
    title: '',
    description: '',
    is_free: 1,
    file_name: '',
    file_path: 'architecture_blueprint.pdf'
  });
  const [resourceUploadFile, setResourceUploadFile] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    platform_name: 'Vaibhav Dhus LMS',
    platform_tagline: 'Modern, Secure & Scalable Learning Ecosystem',
    primary_color: '#6366f1',
    secondary_color: '#06b6d4',
    accent_color: '#10b981',
    bg_base: '#090d16',
    bg_surface: '#111827',
    max_concurrent_sessions: 1,
    watermark_enabled: true,
    watermark_interval_seconds: 12,
    watermark_opacity: 0.22
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login?redirect=/admin');
      return;
    }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, coursesData, studentsData, sessionsData, resourcesData, videosData, settingsData] = await Promise.all([
        adminService.getAnalytics().catch(() => null),
        adminService.getCourses().catch(() => []),
        adminService.getStudents().catch(() => []),
        adminService.getActiveSessions().catch(() => []),
        adminService.getResources().catch(() => []),
        adminService.getVideos().catch(() => []),
        settingsService.getSettings().catch(() => null)
      ]);

      setAnalytics(analyticsData);
      setCourses(coursesData || []);
      setStudents(studentsData || []);
      setSessions(sessionsData || []);
      setResources(resourcesData || []);
      setAvailableVideos(videosData || []);
      if (settingsData) {
        setSettingsForm(prev => ({ ...prev, ...settingsData }));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 4500);
  };

  // -------------------------------------------------------------
  // Course Handlers
  // -------------------------------------------------------------
  const handleOpenCreateCourse = () => {
    setEditingCourseId(null);
    setCourseForm({
      title: '',
      subtitle: '',
      price: 4999,
      discount_price: 2499,
      difficulty_level: 'All Levels',
      thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      is_published: 1
    });
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      subtitle: course.subtitle || '',
      price: course.price,
      discount_price: course.discount_price || 0,
      difficulty_level: course.difficulty_level || 'All Levels',
      thumbnail_url: course.thumbnail_url || '',
      is_published: course.is_published ? 1 : 0
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await adminService.updateCourse(editingCourseId, courseForm);
        showNotification('Course updated successfully!');
      } else {
        await adminService.createCourse(courseForm);
        showNotification('New course created successfully!');
      }
      setShowCourseModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Course save failed');
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseTitle}"? This will remove all associated lessons and enrollments.`)) {
      return;
    }
    try {
      await adminService.deleteCourse(courseId);
      showNotification('Course deleted.');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleTogglePublishCourse = async (course) => {
    try {
      const newStatus = course.is_published ? 0 : 1;
      await adminService.updateCourse(course.id, { is_published: newStatus });
      showNotification(`Course is now ${newStatus ? 'Published' : 'Unpublished'}`);
      loadData();
    } catch (err) {
      alert(err.message || 'Toggle publish failed');
    }
  };

  // -------------------------------------------------------------
  // Curriculum Manager Handlers
  // -------------------------------------------------------------
  const handleOpenCurriculum = async (course) => {
    setCurriculumCourse(course);
    setShowCurriculumModal(true);
    setCurriculumLoading(true);
    try {
      const data = await adminService.getCourseCurriculum(course.id);
      setCurriculumData(data || []);
    } catch (err) {
      alert('Could not fetch curriculum');
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    try {
      await adminService.createSection({
        course_id: curriculumCourse.id,
        title: newSectionTitle.trim(),
        sort_order: curriculumData.length + 1
      });
      setNewSectionTitle('');
      setShowNewSectionForm(false);
      showNotification('Section added to course.');
      // Refresh curriculum
      const updated = await adminService.getCourseCurriculum(curriculumCourse.id);
      setCurriculumData(updated || []);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create section');
    }
  };

  const handleDeleteSection = async (sectionId, title) => {
    if (!window.confirm(`Delete module section "${title}"? Lessons inside will also be removed.`)) return;
    try {
      await adminService.deleteSection(sectionId);
      showNotification('Section removed.');
      const updated = await adminService.getCourseCurriculum(curriculumCourse.id);
      setCurriculumData(updated || []);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Lesson Handlers
  // -------------------------------------------------------------
  const handleOpenAddLesson = (course, sectionId) => {
    setSelectedCourseForLesson(course);
    setEditingLessonId(null);
    setLessonForm({
      course_id: course.id,
      section_id: sectionId || (course.sections?.[0]?.id || 1),
      title: '',
      duration_seconds: 900,
      is_preview: false,
      is_free: false,
      video_storage_key: availableVideos[0]?.filename || 'sample_masterclass.mp4'
    });
    setShowLessonModal(true);
  };

  const handleOpenEditLesson = (lesson, course) => {
    setSelectedCourseForLesson(course);
    setEditingLessonId(lesson.id);
    setLessonForm({
      course_id: lesson.course_id,
      section_id: lesson.section_id,
      title: lesson.title,
      duration_seconds: lesson.duration_seconds || 900,
      is_preview: !!lesson.is_preview,
      is_free: !!lesson.is_free,
      video_storage_key: lesson.video_storage_key || 'sample_masterclass.mp4'
    });
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    try {
      if (editingLessonId) {
        await adminService.updateLesson(editingLessonId, lessonForm);
        showNotification('Lesson updated successfully!');
      } else {
        await adminService.createLesson(lessonForm);
        showNotification('Lesson added to course successfully!');
      }
      setShowLessonModal(false);
      if (curriculumCourse) {
        const updated = await adminService.getCourseCurriculum(curriculumCourse.id);
        setCurriculumData(updated || []);
      }
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId, title) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      await adminService.deleteLesson(lessonId);
      showNotification('Lesson removed.');
      if (curriculumCourse) {
        const updated = await adminService.getCourseCurriculum(curriculumCourse.id);
        setCurriculumData(updated || []);
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // PDF Resource Handlers
  // -------------------------------------------------------------
  const handleOpenCreateResource = () => {
    setEditingResourceId(null);
    setResourceUploadFile(null);
    setResourceForm({
      course_id: courses[0]?.id || 1,
      lesson_id: '',
      title: '',
      description: '',
      is_free: 1,
      file_name: '',
      file_path: 'architecture_blueprint.pdf'
    });
    setShowResourceModal(true);
  };

  const handleOpenEditResource = (res) => {
    setEditingResourceId(res.id);
    setResourceUploadFile(null);
    setResourceForm({
      course_id: res.course_id,
      lesson_id: res.lesson_id || '',
      title: res.title,
      description: res.description || '',
      is_free: res.is_free ? 1 : 0,
      file_name: res.file_name,
      file_path: res.file_path
    });
    setShowResourceModal(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResourceId) {
        await adminService.updateResource(editingResourceId, {
          title: resourceForm.title,
          description: resourceForm.description,
          is_free: resourceForm.is_free,
          course_id: resourceForm.course_id,
          lesson_id: resourceForm.lesson_id || null
        });
        showNotification('Resource updated.');
      } else {
        if (resourceUploadFile) {
          const formData = new FormData();
          formData.append('file', resourceUploadFile);
          formData.append('course_id', resourceForm.course_id);
          if (resourceForm.lesson_id) formData.append('lesson_id', resourceForm.lesson_id);
          formData.append('title', resourceForm.title);
          formData.append('description', resourceForm.description);
          formData.append('is_free', resourceForm.is_free);
          await adminService.createResource(formData);
        } else {
          await adminService.createResource({
            ...resourceForm,
            lesson_id: resourceForm.lesson_id || null
          });
        }
        showNotification('PDF Resource added to course.');
      }
      setShowResourceModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save resource');
    }
  };

  const handleDeleteResource = async (id, title) => {
    if (!window.confirm(`Delete resource "${title}"?`)) return;
    try {
      await adminService.deleteResource(id);
      showNotification('Resource deleted.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Student & Session Handlers
  // -------------------------------------------------------------
  const handleToggleStudent = async (studentId, currentStatus) => {
    try {
      await adminService.toggleStudentStatus(studentId, !currentStatus);
      showNotification(`Student status updated to ${!currentStatus ? 'Active' : 'Suspended'}`);
      const updated = await adminService.getStudents(searchStudent);
      setStudents(updated || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await adminService.revokeSession(sessionId);
      showNotification('Session revoked remotely. Connected device is logged out.');
      const updatedSessions = await adminService.getActiveSessions();
      setSessions(updatedSessions || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateSettings(settingsForm);
      await reloadSettings();
      showNotification('Platform & Theme settings saved live!');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    }
  };

  // Filter students based on search & status filter
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchStudent.toLowerCase());
    if (!matchesSearch) return false;
    if (studentStatusFilter === 'active') return s.is_active === 1;
    if (studentStatusFilter === 'suspended') return s.is_active === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading enterprise admin control suite...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      
      {/* Admin Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary">SUPERADMIN CONSOLE</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Enterprise Platform Management & Security</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Administrator Dashboard</h1>
        </div>

        {statusNotice && (
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--color-success)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{statusNotice}</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--color-border-subtle)',
        paddingBottom: '0.75rem'
      }}>
        {[
          { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart3 },
          { id: 'courses', label: `Courses (${courses.length})`, icon: BookOpen },
          { id: 'resources', label: `PDF Resources (${resources.length})`, icon: FileText },
          { id: 'students', label: `Students (${students.length})`, icon: Users },
          { id: 'sessions', label: `Device Sessions (${sessions.length})`, icon: ShieldCheck },
          { id: 'settings', label: 'Platform & Theme Customizer', icon: Palette }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ gap: '0.4rem' }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: Analytics */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>TOTAL STUDENTS</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>{analytics.totalStudents}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ACTIVE ENROLLMENTS</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{analytics.totalEnrollments}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>LECTURES & VIDEOS</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{analytics.totalLessons}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>VIDEO CONTENT (HOURS)</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{(analytics.totalVideoDurationMinutes / 60).toFixed(1)} hrs</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>PDF DOWNLOADS LOGGED</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success)' }}>{analytics.totalPdfDownloads}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ACTIVE SESSIONS</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-warning)' }}>{analytics.activeSessionsCount}</div>
            </div>
          </div>

          {/* Top Watched Lessons */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Top Watched Lectures</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics.topLessons?.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.course_title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {item.learners_count} learners
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {Math.round(item.avg_completion)}% avg completed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: Courses & Curriculum */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Course Catalog Management</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Create, edit courses, publish/unpublish, and organize multi-module curriculums.
              </p>
            </div>
            <button onClick={handleOpenCreateCourse} className="btn btn-primary btn-sm">
              <Plus size={16} />
              New Course
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {courses.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                    {c.is_published ? (
                      <span className="badge badge-success">Published</span>
                    ) : (
                      <span className="badge badge-warning">Draft</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', lineHeight: 1.3 }}>{c.title}</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                    {c.subtitle || 'Production-grade enterprise system curriculum'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>{c.total_lessons || 0} Lessons</span>
                    <span>•</span>
                    <span>{c.total_students || 0} Students</span>
                    <span>•</span>
                    <span>{c.total_resources || 0} PDFs</span>
                    <span>•</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{formatINR(c.discount_price || c.price)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <button
                    onClick={() => handleOpenCurriculum(c)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, gap: '0.35rem', fontSize: '0.75rem' }}
                  >
                    <Layers size={14} />
                    Curriculum & Lessons
                  </button>

                  <button
                    onClick={() => handleOpenEditCourse(c)}
                    className="btn btn-secondary btn-sm"
                    title="Edit Course"
                    style={{ padding: '0.4rem 0.65rem' }}
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() => handleTogglePublishCourse(c)}
                    className="btn btn-secondary btn-sm"
                    title={c.is_published ? 'Unpublish' : 'Publish'}
                    style={{ padding: '0.4rem 0.65rem' }}
                  >
                    {c.is_published ? <Eye size={14} color="var(--color-success)" /> : <Eye size={14} color="var(--color-text-muted)" />}
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(c.id, c.title)}
                    className="btn btn-danger btn-sm"
                    title="Delete Course"
                    style={{ padding: '0.4rem 0.65rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PDF Resources Management */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>PDF Resources & Downloadable Notes ({resources.length})</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Upload and organize free or enrolled-only PDF notes, cheat sheets, and blueprints. All downloads are tracked.
              </p>
            </div>
            <button onClick={handleOpenCreateResource} className="btn btn-primary btn-sm">
              <Upload size={16} />
              Upload New PDF
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Resource Document</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Attached Course</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Lesson Unit</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Access Policy</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Downloads</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.2rem',
                            height: '2.2rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(var(--color-primary-rgb), 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)'
                          }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{res.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{res.file_name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                        {res.course_title}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {res.lesson_title || 'Course-wide Resource'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {res.is_free === 1 ? (
                          <span className="badge badge-success">Free PDF</span>
                        ) : (
                          <span className="badge badge-primary">Enrolled Only</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                        {res.download_count || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => resourceService.downloadPdf(res.id, res.file_name)}
                            className="btn btn-secondary btn-sm"
                            title="Download Test"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditResource(res)}
                            className="btn btn-secondary btn-sm"
                            title="Edit"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(res.id, res.title)}
                            className="btn btn-danger btn-sm"
                            title="Delete"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: Students & Users */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Registered Students ({filteredStudents.length})</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Search learners, view enrolled courses, inspect device connections, and manage account access.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name or email..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                style={{ width: '220px' }}
              />

              <select
                className="form-input"
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                style={{ width: '130px' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Student Name</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Email</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Active Enrollments</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Connected Devices</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>{s.email}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{s.active_enrollments} courses</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{s.active_sessions_count} device(s)</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {s.is_active === 1 ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-warning">Suspended</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <button
                          onClick={() => handleToggleStudent(s.id, s.is_active === 1)}
                          className={`btn ${s.is_active === 1 ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          {s.is_active === 1 ? 'Suspend Account' : 'Activate Account'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: Active Sessions & Concurrency Shield Inspector */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Active Device Sessions ({sessions.length})</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Real-time audit log of active user tokens and connected devices. Administrators can remotely terminate any session to stop unauthorized streams.
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '0.85rem 1.5rem' }}>User</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Device Details</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>IP Address</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Last Active Heartbeat</th>
                    <th style={{ padding: '0.85rem 1.5rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess) => (
                    <tr key={sess.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{sess.user_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sess.user_email}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 500 }}>{sess.device_name || 'Browser'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sess.os} • {sess.browser}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)' }}>{sess.ip_address}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }}>
                        {new Date(sess.last_active_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          Revoke Session
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: Platform Branding & Dynamic Theme Customizer */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Branding Settings */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Platform Branding</h3>
            
            <div className="form-group">
              <label className="form-label">Platform Name</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.platform_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, platform_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Platform Hero Tagline</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.platform_tagline}
                onChange={(e) => setSettingsForm({ ...settingsForm, platform_tagline: e.target.value })}
              />
            </div>
          </div>

          {/* Dynamic Theme Color Tokens */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Dynamic Theme Design Tokens</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Changes immediately update CSS variables across all student and admin views without code changes.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Brand Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settingsForm.primary_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.primary_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settingsForm.secondary_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.secondary_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Accent / Success Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settingsForm.accent_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accent_color: e.target.value })}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.accent_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accent_color: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Watermark Tuning */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Video Security & Watermarking Policy</h3>

            <div className="form-group">
              <label className="form-label">Max Concurrent Sessions (Devices per Student)</label>
              <input
                type="number"
                min="1"
                max="5"
                className="form-input"
                value={settingsForm.max_concurrent_sessions}
                onChange={(e) => setSettingsForm({ ...settingsForm, max_concurrent_sessions: parseInt(e.target.value, 10) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Watermark Rotation Frequency (Seconds)</label>
              <input
                type="number"
                min="5"
                max="60"
                className="form-input"
                value={settingsForm.watermark_interval_seconds}
                onChange={(e) => setSettingsForm({ ...settingsForm, watermark_interval_seconds: parseInt(e.target.value, 10) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Watermark Opacity ({settingsForm.watermark_opacity})</label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.02"
                value={settingsForm.watermark_opacity}
                onChange={(e) => setSettingsForm({ ...settingsForm, watermark_opacity: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
            <Save size={18} />
            Save Platform Settings to Database
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Create / Edit Course Modal */}
      {/* ------------------------------------------------------------- */}
      {showCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingCourseId ? 'Edit Course' : 'Create New Course'}
            </h3>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle / Hook</label>
                <input
                  type="text"
                  className="form-input"
                  value={courseForm.subtitle}
                  onChange={(e) => setCourseForm({ ...courseForm, subtitle: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Regular Price (₹ INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Discounted Offer Price (₹ INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={courseForm.discount_price}
                    onChange={(e) => setCourseForm({ ...courseForm, discount_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Difficulty Level</label>
                  <select
                    className="form-input"
                    value={courseForm.difficulty_level}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value })}
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Publish Status</label>
                  <select
                    className="form-input"
                    value={courseForm.is_published}
                    onChange={(e) => setCourseForm({ ...courseForm, is_published: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Published</option>
                    <option value={0}>Draft (Unpublished)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={courseForm.thumbnail_url}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCourseModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingCourseId ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Curriculum & Lessons Manager Modal */}
      {/* ------------------------------------------------------------- */}
      {showCurriculumModal && curriculumCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Curriculum & Lessons Manager</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{curriculumCourse.title}</span>
              </div>
              <button onClick={() => setShowCurriculumModal(false)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>

            {/* Add Section Button */}
            <div style={{ marginBottom: '1.5rem' }}>
              {!showNewSectionForm ? (
                <button onClick={() => setShowNewSectionForm(true)} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                  <FolderPlus size={15} />
                  Add New Section Module
                </button>
              ) : (
                <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Module title (e.g. Module 5: Microservices & Streaming)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Add</button>
                  <button type="button" onClick={() => setShowNewSectionForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
                </form>
              )}
            </div>

            {/* Curriculum Sections & Lessons List */}
            {curriculumLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading curriculum modules...</div>
            ) : curriculumData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No sections defined yet. Click "Add New Section Module" to begin.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {curriculumData.map((section, idx) => (
                  <div key={section.id} style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{section.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({section.lessons?.length || 0} lessons)</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenAddLesson(curriculumCourse, section.id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        >
                          <Plus size={12} />
                          Add Lesson
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id, section.title)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="Delete Section"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Lessons list inside section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {section.lessons?.map((les) => (
                        <div key={les.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--color-bg-surface)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Play size={13} color="var(--color-primary)" />
                            <span>{les.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              ({Math.round(les.duration_seconds / 60)} min)
                            </span>
                            {les.is_preview === 1 && <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>Preview</span>}
                            {les.is_free === 1 && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Free</span>}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleOpenEditLesson(les, curriculumCourse)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.5rem' }}
                              title="Edit Lesson"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(les.id, les.title)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.25rem 0.5rem' }}
                              title="Delete Lesson"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Create / Edit Lesson Modal */}
      {/* ------------------------------------------------------------- */}
      {showLessonModal && selectedCourseForLesson && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 1100 }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {editingLessonId ? 'Edit Lesson' : 'Add Lesson to Course'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Course: {selectedCourseForLesson.title}
            </p>
            <form onSubmit={handleSaveLesson}>
              <div className="form-group">
                <label className="form-label">Lesson Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. 13. Advanced Production Monitoring"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Duration (Seconds)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={lessonForm.duration_seconds}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_seconds: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Video Asset</label>
                  <select
                    className="form-input"
                    value={lessonForm.video_storage_key}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_storage_key: e.target.value })}
                  >
                    {availableVideos.map((v) => (
                      <option key={v.filename} value={v.filename}>
                        {v.filename} ({v.sizeFormatted})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={lessonForm.is_preview}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                  />
                  <span>Free Preview (Non-enrolled can watch)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={lessonForm.is_free}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })}
                  />
                  <span>Free for All</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingLessonId ? 'Update Lesson' : 'Save Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: Create / Edit PDF Resource Modal */}
      {/* ------------------------------------------------------------- */}
      {showResourceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingResourceId ? 'Edit PDF Resource' : 'Attach PDF Resource Document'}
            </h3>
            <form onSubmit={handleSaveResource}>
              <div className="form-group">
                <label className="form-label">Resource Document Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Architecture Blueprint & Production Checklist"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Summary</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Key takeaways and architectural diagrams"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Course</label>
                  <select
                    className="form-input"
                    value={resourceForm.course_id}
                    onChange={(e) => setResourceForm({ ...resourceForm, course_id: parseInt(e.target.value, 10) })}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Access Policy</label>
                  <select
                    className="form-input"
                    value={resourceForm.is_free}
                    onChange={(e) => setResourceForm({ ...resourceForm, is_free: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Free for All Students</option>
                    <option value={0}>Enrolled Students Only</option>
                  </select>
                </div>
              </div>

              {!editingResourceId && (
                <div className="form-group">
                  <label className="form-label">Upload PDF Document</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="form-input"
                    onChange={(e) => setResourceUploadFile(e.target.files[0] || null)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    If no file selected, sample default PDF blueprint will be attached.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowResourceModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingResourceId ? 'Save Changes' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
