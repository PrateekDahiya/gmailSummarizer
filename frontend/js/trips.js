// Trips state and rendering
export const trips = {
  list: [],

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