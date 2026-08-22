// Jobs state and rendering
export const jobs = {
  list: [],

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