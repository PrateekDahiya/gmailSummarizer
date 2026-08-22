// Trips state and rendering
export const trips = {
  list: [],

  async init() {
    console.log('[Trips] init() called');
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.id) {
      window.location.href = '/login.html';
      return;
    }
    console.log('[Trips] Authenticated as:', data.name);
    this.load();
  },

  async load() {
    const data = await API_GET('/api/trips');
    this.list = data || [];
    this.render();
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