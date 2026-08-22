// Settings state and rendering
export const settings = {
  init() {
    this.loadConnectedGmail();
    this.bindEvents();
  },

  bindEvents() {
    const syncBtn = document.getElementById('syncBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const deleteDataBtn = document.getElementById('deleteDataBtn');

    if (syncBtn) syncBtn.addEventListener('click', () => this.syncGmail());
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
    if (disconnectBtn) disconnectBtn.addEventListener('click', () => this.disconnect());
    if (deleteDataBtn) deleteDataBtn.addEventListener('click', () => this.deleteData());
  },

  async loadConnectedGmail() {
    const user = await API_GET('/api/auth/me');
    const statusEl = document.getElementById('connected-gmail-status');
    const emailEl = document.getElementById('connectedEmail');
    if (user) {
      if (statusEl) statusEl.textContent = `Connected: ${user.email}`;
      if (emailEl) emailEl.textContent = user.email;
    } else {
      if (statusEl) statusEl.textContent = 'Not connected';
      if (emailEl) emailEl.textContent = 'Not connected';
    }
  },

  async syncGmail() {
    try {
      const btn = document.getElementById('syncBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }
      await API_POST('/api/emails/sync');
      this.loadConnectedGmail();
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Sync failed: ' + err.message);
    } finally {
      const btn = document.getElementById('syncBtn');
      if (btn) { btn.disabled = false; btn.textContent = 'Sync Gmail'; }
    }
  },

  async logout() {
    try {
      await API_POST('/api/auth/logout');
      window.location.href = '/login.html';
    } catch (err) {
      console.error('Logout failed:', err);
      alert('Logout failed');
    }
  },

  async disconnect() {
    if (!confirm('Disconnect Gmail? This will remove your refresh token.')) return;
    try {
      await API_POST('/api/auth/disconnect');
      this.loadConnectedGmail();
    } catch (err) {
      console.error('Disconnect failed:', err);
      alert('Disconnect failed');
    }
  },

  async deleteData() {
    if (!confirm('Delete all your data? This cannot be undone.')) return;
    try {
      await API_POST('/api/auth/delete-data');
      window.location.href = '/login.html';
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed');
    }
  }
};