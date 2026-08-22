// Authentication state management
export let user = null;

export function login(userData) {
  console.log('[Auth] login() called with:', userData);
  user = userData;
  document.cookie = `token=${userData.token}; path=/; max-age=86400; secure`;
}

export function logout() {
  console.log('[Auth] logout() called');
  user = null;
  document.cookie = 'token=; path=/; max-age=0';
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Auth] DOMContentLoaded, path:', window.location.pathname);
  // Only run on login page
  if (!window.location.pathname.includes('login.html')) {
    console.log('[Auth] Not on login page, skipping auto-redirect check');
    return;
  }
  
  console.log('[Auth] On login page, checking auth status...');
  // Check if already logged in
  try {
    const res = await fetch('/api/auth/me');
    console.log('[Auth] /api/auth/me response status:', res.status);
    const data = await res.json();
    console.log('[Auth] /api/auth/me response data:', data);
    if (data.id) {
      console.log('[Auth] Already logged in, redirecting to dashboard...');
      login(data);
      // redirect to dashboard
      window.location.href = '/dashboard.html';
    } else {
      console.log('[Auth] Not logged in, showing login page');
    }
  } catch (err) {
    console.error('[Auth] Error checking auth status:', err);
  }
});

// Handle Google OAuth login
window.loginWithGoogle = () => {
  console.log('[Auth] loginWithGoogle() called, redirecting to /api/auth/google');
  // Redirect the browser to the backend endpoint
  // which will redirect to Google OAuth consent screen
  window.location.href = '/api/auth/google';
};