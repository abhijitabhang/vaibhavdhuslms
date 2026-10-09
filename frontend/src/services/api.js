const API_BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('vdlms_token');

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Special handling for binary blob downloads (PDFs)
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(errorJson.message || 'File download failed');
    }
    return response.blob();
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Check for revoked session event
    if (result.code === 'SESSION_REVOKED') {
      window.dispatchEvent(new CustomEvent('auth:session_revoked', {
        detail: { message: result.message || 'Session revoked from another device.' }
      }));
    }

    const error = new Error(result.message || 'An error occurred during request');
    error.status = response.status;
    error.code = result.code;
    error.errors = result.errors;
    throw error;
  }

  return result.data;
}
