import { apiRequest } from './api';

export const authService = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  getSessions: () => apiRequest('/auth/sessions'),
  revokeOtherSessions: () => apiRequest('/auth/sessions/revoke-others', { method: 'POST' }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: data }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, newPassword) => apiRequest('/auth/reset-password', { method: 'POST', body: { token, newPassword } })
};

export const courseService = {
  getCourses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/courses${query ? `?${query}` : ''}`);
  },
  getCourseBySlug: (slug) => apiRequest(`/courses/${slug}`),
  getMyCourses: () => apiRequest('/enrollments/my-courses'),
  enroll: (courseId) => apiRequest(`/enrollments/enroll/${courseId}`, { method: 'POST' })
};

export const videoService = {
  getVideoToken: (lessonId) => apiRequest(`/videos/token/${lessonId}`),
  getStreamUrl: (lessonId, token) => `/api/videos/stream/${lessonId}?token=${token}`
};

export const progressService = {
  getCourseProgress: (courseId) => apiRequest(`/progress/${courseId}`),
  saveProgress: (lessonId, data) => apiRequest(`/progress/${lessonId}`, { method: 'POST', body: data })
};

export const resourceService = {
  getCourseResources: (courseId) => apiRequest(`/resources/course/${courseId}`),
  downloadPdf: async (resourceId, filename) => {
    const blob = await apiRequest(`/resources/${resourceId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'resource.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const certificateService = {
  getCertificate: (courseId) => apiRequest(`/certificates/course/${courseId}`),
  verifyCertificate: (code) => apiRequest(`/certificates/verify/${code}`)
};

export const settingsService = {
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data) => apiRequest('/settings', { method: 'PUT', body: data })
};

export const adminService = {
  getAnalytics: () => apiRequest('/admin/analytics'),
  getCourses: () => apiRequest('/admin/courses'),
  createCourse: (data) => apiRequest('/admin/courses', { method: 'POST', body: data }),
  updateCourse: (id, data) => apiRequest(`/admin/courses/${id}`, { method: 'PUT', body: data }),
  deleteCourse: (id) => apiRequest(`/admin/courses/${id}`, { method: 'DELETE' }),
  getCourseCurriculum: (courseId) => apiRequest(`/admin/courses/${courseId}/curriculum`),
  getSections: (courseId) => apiRequest(`/admin/courses/${courseId}/sections`),
  createSection: (data) => apiRequest('/admin/sections', { method: 'POST', body: data }),
  updateSection: (id, data) => apiRequest(`/admin/sections/${id}`, { method: 'PUT', body: data }),
  deleteSection: (id) => apiRequest(`/admin/sections/${id}`, { method: 'DELETE' }),
  createLesson: (data) => apiRequest('/admin/lessons', { method: 'POST', body: data }),
  updateLesson: (id, data) => apiRequest(`/admin/lessons/${id}`, { method: 'PUT', body: data }),
  deleteLesson: (id) => apiRequest(`/admin/lessons/${id}`, { method: 'DELETE' }),
  getResources: () => apiRequest('/admin/resources'),
  createResource: (formData) => apiRequest('/admin/resources', { method: 'POST', body: formData }),
  updateResource: (id, data) => apiRequest(`/admin/resources/${id}`, { method: 'PUT', body: data }),
  deleteResource: (id) => apiRequest(`/admin/resources/${id}`, { method: 'DELETE' }),
  getVideos: () => apiRequest('/admin/videos'),
  getStudents: (search = '') => apiRequest(`/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  toggleStudentStatus: (id, is_active) => apiRequest(`/admin/students/${id}/status`, { method: 'PUT', body: { is_active } }),
  getActiveSessions: () => apiRequest('/admin/sessions'),
  revokeSession: (id) => apiRequest(`/admin/sessions/${id}/revoke`, { method: 'POST' })
};

