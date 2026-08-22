function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function removeQuotedText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const filtered = [];
  let inQuote = false;

  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      inQuote = true;
      continue;
    }
    if (line.match(/^On .* wrote:$/)) {
      inQuote = true;
      continue;
    }
    if (line.match(/^From:.*Sent:.*To:.*Subject:/)) {
      inQuote = true;
      continue;
    }
    if (inQuote && line.trim() === '') {
      continue;
    }
    if (inQuote && !line.startsWith(' ')) {
      inQuote = false;
    }
    if (!inQuote) {
      filtered.push(line);
    }
  }

  return filtered.join('\n').trim();
}

function removeSignatures(text) {
  if (!text) return '';
  
  const signaturePatterns = [
    /--\s*\n[\s\S]*$/,
    /__\s*\n[\s\S]*$/,
    /Sent from my (iPhone|iPad|Android|mobile)/i,
    /Sent with (Outlook|Gmail|Spark|Superhuman)/i,
    /Get Outlook for (iOS|Android)/i,
    /Virus-free\. www\.avast\.com/i,
    /This email has been scanned/i,
  ];

  let cleaned = text;
  for (const pattern of signaturePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  const lines = cleaned.split('\n');
  const filtered = [];
  let emptyCount = 0;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '') {
      emptyCount++;
      if (emptyCount > 3) continue;
    } else {
      emptyCount = 0;
    }
    filtered.unshift(lines[i]);
  }

  return filtered.join('\n').trim();
}

function removeEmailHeaders(text) {
  if (!text) return '';
  
  const headerPatterns = [
    /^From:.*$/gm,
    /^To:.*$/gm,
    /^Cc:.*$/gm,
    /^Bcc:.*$/gm,
    /^Subject:.*$/gm,
    /^Date:.*$/gm,
    /^Message-ID:.*$/gm,
    /^In-Reply-To:.*$/gm,
    /^References:.*$/gm,
    /^Content-Type:.*$/gm,
    /^Content-Transfer-Encoding:.*$/gm,
    /^MIME-Version:.*$/gm,
  ];

  let cleaned = text;
  for (const pattern of headerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

function removeUrls(text) {
  if (!text) return '';
  return text.replace(/https?:\/\/[^\s]+/g, '[URL]');
}

function truncateText(text, maxLength = 10000) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '... [truncated]';
}

function cleanEmailContent(rawContent) {
  if (!rawContent) return '';
  
  let cleaned = rawContent;
  
  cleaned = stripHtml(cleaned);
  cleaned = removeQuotedText(cleaned);
  cleaned = removeSignatures(cleaned);
  cleaned = removeEmailHeaders(cleaned);
  cleaned = removeUrls(cleaned);
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = truncateText(cleaned, 15000);
  
  return cleaned.trim();
}

function extractKeyInfo(email) {
  const { headers, body, snippet, subject, from, to, date } = email;
  
  return {
    subject: subject || headers.subject || '',
    from: from || headers.from || '',
    to: to || headers.to || '',
    date: date || headers.date || '',
    snippet: snippet || (body ? body.substring(0, 200) : ''),
    body: body || '',
    messageId: headers['message-id'] || headers['message_id'] || ''
  };
}

module.exports = {
  stripHtml,
  removeQuotedText,
  removeSignatures,
  removeEmailHeaders,
  removeUrls,
  truncateText,
  cleanEmailContent,
  extractKeyInfo
};