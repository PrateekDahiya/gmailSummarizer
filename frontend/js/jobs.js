import { get as API_GET, post as API_POST } from './api.js';

// Jobs state and rendering
export const jobs = {
  list: [],

  async init() {
    console.log('[Jobs] init() called');
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      console.log('[Jobs] /api/auth/me status:', res.status);
      const data = await res.json();
      console.log('[Jobs] /api/auth/me data:', data);
      if (!data.id) {
        window.location.href = '/login.html';
        return;
      }
      console.log('[Jobs] Authenticated as:', data.name);
      this.load();
    } catch (err) {
      console.error('[Jobs] Auth check failed:', err);
      window.location.href = '/login.html';
    }
  },

  async load() {
    console.log('[Jobs] Loading jobs...');
    try {
      const data = await API_GET('/api/jobs');
      console.log('[Jobs] Jobs data received:', data);
      this.list = data || [];
      this.render();
    } catch (err) {
      console.error('[Jobs] Load error:', err);
      const container = document.getElementById('jobs-container');
      if (container) {
        container.innerHTML = `<div class="error">Failed to load jobs: ${err.message}</div>`;
      }
    }
  },

  render() {
    const container = document.getElementById('jobs-container');
    if (!container) return;

    let html = `
      <h2>Job Updates</h2>
      ${this.list.map(job => `
        <div class="job-card">
          <h3>${job.company}</h3>
          <p>${job.role}</p>
          <p>${job.status}</p>
        </div>
      `).join('')}
    `;
    container.innerHTML = html;
  }
};

// Auto-init on jobs page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('jobs')) {
    console.log('[Jobs] DOMContentLoaded, initializing...');
    jobs.init();
  }
});