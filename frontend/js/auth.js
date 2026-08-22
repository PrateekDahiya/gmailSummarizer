// Authentication state management
export let user = null;

export function login(userData) {
  user = userData;
  document.cookie = `token=${userData.token}; path=/; max-age=86400; secure`;
}

export function logout() {
  user = null;
  document.cookie = 'token=; path=/; max-age=0';
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Only run on login page
  if (!window.location.pathname.includes('login.html')) return;
  
  // Check if already logged in
  const res = await fetch('/api/auth/me');
  const data = await res.json();
  if (data.id) {
    login(data);
    // redirect to dashboard
    window.location.href = '/dashboard.html';
  }
});

// Handle Google OAuth login
window.loginWithGoogle = () => {
  // Redirect the browser to the backend endpoint
  // which will redirect to Google OAuth consent screen
  window.location.href = '/api/auth/google';
};