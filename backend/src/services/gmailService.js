const google = require('../config/google');
const db = require('../config/database');

const gmailService = {};

gmailService.generateAuthUrl = () => {
  return google.generateAuthUrl();
};

gmailService.exchangeCode = async (code) => {
  const { tokens } = await google.client.getToken(code);
  google.client.setCredentials(tokens.access_token);

  // Get user profile
  const profile = await google.verifyIdToken(tokens.id_token);

  // Get Gmail profile
  const gmailProfile = await google.client.request({
    url: 'https://gmail.googleapis.com/userProfile',
    options: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    }
  });

  return {
    profile,
    tokens,
    gmailProfile: gmailProfile.data
  };
};

gmailService.fetchMessages = async (tokens, userId, historyId = '') => {
  google.client.setCredentials(tokens.access_token);

  const results = await google.client.request({
    url: `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages?maxResults=10${historyId ? `&historyId=${historyId}` : ''}`,
    options: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    }
  });

  const messages = results.data.messages || [];
  return messages;
};

gmailService.fetchMessageDetails = async (tokens, userId, messageId) => {
  google.client.setCredentials(tokens.access_token);

  const result = await google.client.request({
    url: `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${messageId}`,
    options: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    }
  });

  return result.data;
};

gmailService.fetchThread = async (tokens, userId, threadId) => {
  google.client.setCredentials(tokens.access_token);

  const result = await google.client.request({
    url: `https://gmail.googleapis.com/gmail/v1/users/${userId}/threads/${threadId}`,
    options: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    }
  });

  return result.data;
};

gmailService.parseMessagePayload = (payload) => {
  let body = '';
  let subject = '';
  let sender = '';
  let headers = payload.headers || [];

  headers.forEach(header => {
    if (header.name === 'Subject') subject = header.value;
    if (header.name === 'From') sender = header.value;
    if (header.name === 'Date') payload.receivedAt = header.value;
  });

  // Get body content
  if (payload.parts) {
    payload.parts.forEach(part => {
      if (part.mimeType === 'text/plain') {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.mimeType === 'text/html') {
        // Optionally get HTML body
      }
    });
  } else if (payload.body && payload.body.data) {
    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  return {
    subject,
    sender,
    body,
    snippet: payload.snippet || ''
  };
};

module.exports = gmailService;