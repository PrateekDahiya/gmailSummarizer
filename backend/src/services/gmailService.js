const { google } = require('googleapis');

class GmailService {
  constructor(tokens) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    if (tokens) {
      this.oauth2Client.setCredentials(tokens);
    }
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  static createFromStoredTokens(userId, tokens) {
    return new GmailService(tokens);
  }

  async getProfile() {
    try {
      const res = await this.gmail.users.getProfile({ userId: 'me' });
      return res.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async fetchMessages(userId, options = {}) {
    const {
      maxResults = 100,
      query = '',
      labelIds = ['INBOX'],
      pageToken = null
    } = options;

    try {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
        labelIds,
        pageToken
      });
      return res.data.messages || [];
    } catch (error) {
      console.error('Fetch messages error:', error);
      throw error;
    }
  }

  async fetchMessageDetails(messageId) {
    try {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      return res.data;
    } catch (error) {
      console.error('Fetch message details error:', error);
      throw error;
    }
  }

  async fetchMultipleMessages(messageIds) {
    const messages = [];
    for (const id of messageIds) {
      try {
        const msg = await this.fetchMessageDetails(id);
        messages.push(msg);
      } catch (err) {
        console.error(`Failed to fetch message ${id}:`, err);
      }
    }
    return messages;
  }

  parseMessagePayload(payload) {
    const headers = {};
    if (payload.headers) {
      payload.headers.forEach(h => {
        headers[h.name.toLowerCase()] = h.value;
      });
    }

    let body = '';
    let snippet = payload.snippet || '';

    const getBody = (part) => {
      if (part.body && part.body.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        for (const p of part.parts) {
          const content = getBody(p);
          if (content) return content;
        }
      }
      return '';
    };

    body = getBody(payload);

    return {
      headers,
      body: body || snippet,
      snippet,
      subject: headers.subject || '',
      from: headers.from || '',
      to: headers.to || '',
      date: headers.date || '',
      messageId: headers['message-id'] || ''
    };
  }

  async watchInbox(userId, topicName) {
    try {
      const res = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds: ['INBOX']
        }
      });
      return res.data;
    } catch (error) {
      console.error('Watch inbox error:', error);
      throw error;
    }
  }

  async stopWatch(userId) {
    try {
      const res = await this.gmail.users.stop({ userId: 'me' });
      return res.data;
    } catch (error) {
      console.error('Stop watch error:', error);
      throw error;
    }
  }

  async getLabels() {
    try {
      const res = await this.gmail.users.labels.list({ userId: 'me' });
      return res.data.labels || [];
    } catch (error) {
      console.error('Get labels error:', error);
      throw error;
    }
  }

  async modifyMessage(messageId, addLabelIds = [], removeLabelIds = []) {
    try {
      const res = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { addLabelIds, removeLabelIds }
      });
      return res.data;
    } catch (error) {
      console.error('Modify message error:', error);
      throw error;
    }
  }

  async createDraft(message) {
    try {
      const res = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: { message }
      });
      return res.data;
    } catch (error) {
      console.error('Create draft error:', error);
      throw error;
    }
  }

  async sendMessage(message) {
    try {
      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: message
      });
      return res.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }
}

module.exports = GmailService;