import { get as API_GET, post as API_POST } from './api.js';

// Jobs state and rendering
export const jobs = {
  list: [],

  async init() {
    console.log('[Jobs] init() called');
    // Check auth status first
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.id) {
      window.location.href = '/login.html';
      return;
    }
    console.log('[Jobs] Authenticated as:', data.name);
    this.load();
  },

  async load() {
    const data = await API_GET('/api/jobs');
    this.list = data || [];
    this.render();
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