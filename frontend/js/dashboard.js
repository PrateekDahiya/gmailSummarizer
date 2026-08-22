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
    const res = await fetch('/api/auth/me');
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
  },

  async load() {
    // Load dashboard data from API
    const data = await API_GET('/api/dashboard/today');
    this.urgent = data.urgent || [];
    this.upcoming = data.upcoming || [];
    this.jobs = data.jobs || [];
    this.trips = data.trips || [];
    this.tasks = data.tasks || [];
    this.importantEmails = data.importantEmails || [];
    this.render();
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