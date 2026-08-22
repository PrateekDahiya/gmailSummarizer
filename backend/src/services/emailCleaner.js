const removeSignatures = (text) => {
  // Common signature patterns
  const signaturePatterns = [
    /--\s*$/m,  // -- at end of block
    /Sent from my (iPhone|iPad|Android)/i,
    /Sent from Yahoo Mail/i,
    /Sent from Gmail/i,
  ];

  let result = text;
  for (const pattern of signaturePatterns) {
    result = result.replace(pattern, '');
  }
  return result;
};

const removeQuotedMessages = (text) => {
  // Remove quoted previous messages (lines starting with >)
  const lines = text.split('\n');
  const filteredLines = lines.filter(line => {
    // Allow up to 2 consecutive quoted lines at the start
    if (line.trim().startsWith('>') && !line.trim().startsWith('> ')) {
      return false; // Remove pure > lines
    }
    if (line.trim().startsWith('> ')) {
      // Keep some quoted context but limit
      return true;
    }
    return true;
  });
  return filteredLines.join('\n');
};

const cleanEmailContent = (body) => {
  if (!body) return '';

  let text = body;

  // Remove HTML tags (simple approach)
  text = text.replace(/<[^>]+>/g, '\n');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/</g, '<');
  text = text.replace(/>/g, '>');
  text = text.replace(/&/g, '&');

  // Remove quoted previous messages
  text = removeQuotedMessages(text);

  // Remove signatures
  text = removeSignatures(text);

  // Truncate excessively large emails (limit to 100KB of cleaned text)
  const maxSize = 100 * 1024; // 100KB
  if (text.length > maxSize) {
    text = text.substring(0, maxSize) + '...\n[Truncated]';
  }

  // Remove extra whitespace
  text = text.replace(/\s+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
};

module.exports = { cleanEmailContent, removeQuotedMessages, removeSignatures };