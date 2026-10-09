import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Clock, Users, Star, Filter, ArrowRight } from 'lucide-react';
import { courseService } from '../services/lmsServices';
import { formatINR } from '../utils/formatters';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses({
        search,
        category: selectedCategory,
        difficulty: selectedDifficulty
      });
      setCourses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [selectedCategory, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCourses();
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 5rem' }}>
      
      {/* Header */}
      <div style={{ maxWidth: '680px', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Course Catalog</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Explore enterprise software engineering curricula taught by industry architects. All courses feature protected video streams and downloadable resources.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '2rem',
        padding: '1rem',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0.55rem 1rem' }}>
            Search
          </button>
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">All Categories</option>
            <option value="full-stack-architecture">Full-Stack Architecture</option>
            <option value="backend-databases">Backend &amp; Databases</option>
            <option value="frontend-ux">Frontend &amp; UX</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="form-input"
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          Loading course catalog...
        </div>
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <BookOpen size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3>No courses found</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
            Try adjusting your search criteria or resetting filters.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {courses.map((course) => (
            <div key={course.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '1rem', background: '#020617' }}>
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
                  <span className="badge badge-primary">{course.category_name || 'Architecture'}</span>
                </div>
              </div>

              {/* Title & Details */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.785rem', color: 'var(--color-text-muted)' }}>
                  <span>{course.instructor_name || 'Dr. Sarah Mitchell'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                    <Star size={12} fill="currentColor" />
                    {Number(course.rating || 5).toFixed(1)}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', lineHeight: 1.35, margin: '0.15rem 0' }}>
                  {course.title}
                </h3>

                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {course.subtitle || course.description}
                </p>

                {/* Metadata Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  fontSize: '0.785rem',
                  color: 'var(--color-text-muted)',
                  marginTop: 'auto',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--color-border-subtle)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={13} />
                    {course.lesson_count || 12} Lessons
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={13} />
                    {course.student_count || 1} Enrolled
                  </span>
                  <span className="badge badge-secondary" style={{ marginLeft: 'auto', fontSize: '0.685rem' }}>
                    {course.difficulty_level}
                  </span>
                </div>

                {/* Price (INR) & CTA */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--color-border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatINR(course.discount_price || course.price)}
                    </span>
                    {course.discount_price && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                        {formatINR(course.price)}
                      </span>
                    )}
                  </div>

                  <Link to={`/courses/${course.slug}`} className="btn btn-primary btn-sm">
                    <span>View Course</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
