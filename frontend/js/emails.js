import { get as API_GET, post as API_POST } from './api.js';

// Emails state and rendering
export const emails = {
  list: [],
  currentEmail: null,
  page: 1,
  limit: 20,

  async init() {
    console.log('[Emails] init() called');
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      console.log('[Emails] /api/auth/me status:', res.status);
      const data = await res.json();
      console.log('[Emails] /api/auth/me data:', data);
      if (!data.id) {
        window.location.href = '/login.html';
        return;
      }
      console.log('[Emails] Authenticated as:', data.name);
      this.load();
    } catch (err) {
      console.error('[Emails] Auth check failed:', err);
      window.location.href = '/login.html';
    }
  },

  async load(page = 1, filter = 'all') {
    console.log('[Emails] Loading emails...');
    try {
      const data = await API_GET('/api/emails', { page, filter });
      console.log('[Emails] Emails data received:', data);
      this.list = data.emails || [];
      this.page = data.page || 1;
      this.total = data.total || 0;
      this.render();
    } catch (err) {
      console.error('[Emails] Load error:', err);
      const container = document.getElementById('emails-list');
      if (container) {
        container.innerHTML = `<div class="error">Failed to load emails: ${err.message}</div>`;
      }
    }
  },

  render() {
    const container = document.getElementById('emails-list');
    if (!container) return;

    let html = `
      <h2>Emails</h2>
      ${this.list.map(email => `
        <div class="email-item">
          <h3>${email.subject}</h3>
          <p>${email.snippet}</p>
          <p>${email.sender_email}</p>
          <small>${email.received_at}</small>
        </div>
      `).join('')}
    `;
    container.innerHTML = html;
  }
};

// Auto-init on emails page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('emails')) {
    console.log('[Emails] DOMContentLoaded, initializing...');
    emails.init();
  }
});