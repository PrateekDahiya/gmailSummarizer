import { get as API_GET, post as API_POST } from './api.js';

// Trips state and rendering
export const trips = {
  list: [],

  async init() {
    console.log('[Trips] init() called');
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      console.log('[Trips] /api/auth/me status:', res.status);
      const data = await res.json();
      console.log('[Trips] /api/auth/me data:', data);
      if (!data.id) {
        window.location.href = '/login.html';
        return;
      }
      console.log('[Trips] Authenticated as:', data.name);
      this.load();
    } catch (err) {
      console.error('[Trips] Auth check failed:', err);
      window.location.href = '/login.html';
    }
  },

  async load() {
    console.log('[Trips] Loading trips...');
    try {
      const data = await API_GET('/api/trips');
      console.log('[Trips] Trips data received:', data);
      this.list = data || [];
      this.render();
    } catch (err) {
      console.error('[Trips] Load error:', err);
      const container = document.getElementById('trips-container');
      if (container) {
        container.innerHTML = `<div class="error">Failed to load trips: ${err.message}</div>`;
      }
    }
  },

  render() {
    const container = document.getElementById('trips-container');
    if (!container) return;

    let html = `
      <h2>Travel</h2>
      ${this.list.map(trip => `
        <div class="trip-card">
          <h3>${trip.title}</h3>
          <p>${trip.destination}</p>
          <p>${trip.start_date} - ${trip.end_date}</p>
        </div>
      `).join('')}
    `;
    container.innerHTML = html;
  }
};

// Auto-init on trips page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('trips')) {
    console.log('[Trips] DOMContentLoaded, initializing...');
    trips.init();
  }
});