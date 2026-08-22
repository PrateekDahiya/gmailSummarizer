// Emails state and rendering
export const emails = {
  list: [],
  currentEmail: null,
  page: 1,
  limit: 20,

  async load(page = 1, filter = 'all') {
    const data = await API_GET('/api/emails', { page, filter });
    this.list = data.emails || [];
    this.page = data.page || 1;
    this.total = data.total || 0;
    this.render();
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