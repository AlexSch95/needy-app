const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Ein Fehler ist aufgetreten');
  }
  
  return data;
}

export const api = {
  // Auth
  register: (username, password, fivemToken) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, fivemToken }),
    }),
    
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
    
  getMe: () => request('/auth/me'),
  
  // Profile
  completeProfile: (data) =>
    request('/profile/complete', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  updateProfile: (data) =>
    request('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  deleteAccount: () =>
    request('/profile', { method: 'DELETE' }),
  
  // Swipe
  getNextProfile: () => request('/swipe/next'),
  
  swipe: (targetUserId, direction) =>
    request('/swipe', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, direction }),
    }),
  
  // Matches
  getMatches: () => request('/matches'),
  
  deleteMatch: (matchId) =>
    request(`/matches/${matchId}`, { method: 'DELETE' }),
};

export default api;
