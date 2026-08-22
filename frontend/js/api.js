// API client for backend communication
const API_BASE = '/api';

function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function get(path, params = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}

export async function post(path, body) {
  const url = new URL(path, window.location.origin);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}