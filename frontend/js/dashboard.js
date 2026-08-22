// Dashboard state and rendering
export const dashboard = {
  urgent: [],
  upcoming: [],
  jobs: [],
  trips: [],
  tasks: [],
  importantEmails: [],

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