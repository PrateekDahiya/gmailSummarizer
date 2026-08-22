import { get as API_GET, post as API_POST } from './api.js';

// Dashboard state and rendering
export const dashboard = {
  urgent: [],
  upcoming: [],
  jobs: [],
  trips: [],
  tasks: [],
  importantEmails: [],

  async init() {
    console.log('[Dashboard] init() called');
    // Check auth status first
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      console.log('[Dashboard] /api/auth/me status:', res.status);
      const data = await res.json();
      console.log('[Dashboard] /api/auth/me data:', data);
      if (!data.id) {
        console.log('[Dashboard] Not authenticated, redirecting to login');
        window.location.href = '/login.html';
        return;
      }
      
      console.log('[Dashboard] Authenticated as:', data.name);
      // Update header with user name
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) userNameEl.textContent = data.name || 'User';
      
      this.load();
    } catch (err) {
      console.error('[Dashboard] Auth check failed:', err);
      window.location.href = '/login.html';
    }
  },

  async load() {
    console.log('[Dashboard] Loading dashboard data...');
    try {
      const data = await API_GET('/api/dashboard/today');
      console.log('[Dashboard] Dashboard data received:', data);
      this.urgent = data.urgent || [];
      this.upcoming = data.upcoming || [];
      this.jobs = data.jobs || [];
      this.trips = data.trips || [];
      this.tasks = data.tasks || [];
      this.importantEmails = data.importantEmails || [];
      console.log('[Dashboard] Data loaded, rendering...');
      this.render();
    } catch (err) {
      console.error('[Dashboard] Load error:', err);
      const container = document.getElementById('dashboard-container');
      if (container) {
        container.innerHTML = `<div class="error">Failed to load dashboard: ${err.message}</div>`;
      }
    }
  },

  render() {
    // Render dashboard UI
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    let html = `
      <div class="dashboard">
        <h2>Needs Attention</h2>
        ${this.urgent.map(item => `<div class="urgent-item">${item.title}</div>`).join('')}
      </div>
      <div class="dashboard">
        <h2>Upcoming</h2>
        ${this.upcoming.map(item => `<div class="upcoming-item">${item.title}</div>`).join('')}
      </div>
    `;
    container.innerHTML = html;
  }
};

// Auto-init on dashboard page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('dashboard')) {
    console.log('[Dashboard] DOMContentLoaded, initializing...');
    dashboard.init();
  }
});