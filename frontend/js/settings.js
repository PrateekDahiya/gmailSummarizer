// Settings state and rendering
export const settings = {
  init() {
    this.loadConnectedGmail();
  },

  async loadConnectedGmail() {
    const user = await API_GET('/api/auth/me');
    const statusEl = document.getElementById('connected-gmail-status');
    if (user) {
      statusEl.textContent = `Connected: ${user.email}`;
    } else {
      statusEl.textContent = 'Not connected';
    }
  },

  async syncGmail() {
    await API_POST('/api/emails/sync');
    this.loadConnectedGmail();
  }
};