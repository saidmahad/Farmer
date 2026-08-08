// public/js/api.js
// Thin fetch wrapper + auth-token helpers shared by every page.

const AUTH_TOKEN_KEY = 'agri_advisor_token';
const AUTH_USER_KEY = 'agri_advisor_user';

const Auth = {
  saveSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch {
      return null;
    }
  },
  clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },
  isLoggedIn() {
    return Boolean(this.getToken());
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
    }
  }
};

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken();
    if (!token) {
      window.location.href = '/index.html';
      return Promise.reject(new Error('Not authenticated'));
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (response.status === 401 && auth) {
    Auth.clearSession();
    window.location.href = '/index.html';
    return Promise.reject(new Error('Session expired'));
  }

  if (!response.ok) {
    const message = (data && data.error) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

const Api = {
  register(name, email, password) {
    return apiRequest('/register', { method: 'POST', body: { name, email, password } });
  },
  login(email, password) {
    return apiRequest('/login', { method: 'POST', body: { email, password } });
  },
  listCrops() {
    return apiRequest('/crops', { auth: true });
  },
  getCrop(id) {
    return apiRequest(`/crops/${id}`, { auth: true });
  },
  getAdvice(cropId) {
    return apiRequest(`/advice?crop_id=${cropId}`, { auth: true });
  }
};
