const Groq = require('groq-sdk');
const { cleanEmailContent, extractKeyInfo } = require('./emailCleaner');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const ANALYSIS_PROMPT = `You are an email intelligence assistant. Analyze the email and return a JSON object with the following structure:

{
  "category": "JOB|INTERVIEW|TRAVEL|MEETING|DEADLINE|DOCUMENT|FINANCE|PERSONAL|NEWSLETTER|PROMOTION|OTHER",
  "importance_score": 0-100,
  "summary": "Brief 2-3 sentence summary of the email",
  "action_required": true/false,
  "action_text": "What action is needed (if any)",
  "company": "Company name if detectable",
  "role": "Job role if job-related",
  "event_date": "ISO date string if event/meeting/deadline",
  "entities": {
    "location": "Location if mentioned",
    "deadline": "Deadline if mentioned",
    "interview_stage": "Interview stage if applicable",
    "amount": "Amount if financial",
    "confirmation_number": "Booking/ticket number if travel"
  },
  "confidence": 0.0-1.0
}

Guidelines:
- JOB: Job postings, applications, recruiter outreach
- INTERVIEW: Interview invitations, scheduling, follow-ups
- TRAVEL: Flight/hotel bookings, trip confirmations
- MEETING: Meeting requests, calendar invites
- DEADLINE: Due dates, submissions, renewals
- DOCUMENT: Document requests, contracts, forms
- FINANCE: Invoices, payments, billing
- PERSONAL: Personal correspondence
- NEWSLETTER: Marketing newsletters
- PROMOTION: Sales, promotions
- OTHER: Everything else

IMPORTANCE SCORING:
- 90-100: Interview invites, job offers, urgent deadlines, travel bookings
- 70-89: Job applications, meeting requests, document requests
- 50-69: Meeting confirmations, travel details, financial notices
- 30-49: Newsletters, promotional, routine correspondence
- 0-29: Spam, promotional, irrelevant

Return ONLY valid JSON. No markdown, no explanation.`;

async function analyzeEmail(emailData) {
  const { body, snippet, subject, from, to, date } = extractKeyInfo(emailData);
  const content = cleanEmailContent(body || snippet || '');
  
  const prompt = `${ANALYSIS_PROMPT}

EMAIL:
Subject: ${subject}
From: ${from}
To: ${to}
Date: ${date}
Content: ${content}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Validate and sanitize
    return {
      category: result.category || 'OTHER',
      importance_score: Math.max(0, Math.min(100, result.importance_score || 0)),
      summary: result.summary || 'Email processed',
      action_required: Boolean(result.action_required),
      action_text: result.action_text || '',
      company: result.company || '',
      role: result.role || '',
      event_date: result.event_date || null,
      entities: result.entities || {},
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return getFallbackAnalysis(emailData);
  }
}

function getFallbackAnalysis(emailData) {
  const { subject, from, body, snippet } = extractKeyInfo(emailData);
  const text = `${subject} ${from} ${body} ${snippet}`.toLowerCase();
  
  let category = 'OTHER';
  let importance = 10;
  
  if (text.includes('interview') || text.includes('schedule')) {
    category = 'INTERVIEW';
    importance = 90;
  } else if (text.includes('job') || text.includes('position') || text.includes('recruiter')) {
    category = 'JOB';
    importance = 70;
  } else if (text.includes('flight') || text.includes('hotel') || text.includes('booking')) {
    category = 'TRAVEL';
    importance = 80;
  } else if (text.includes('meeting') || text.includes('calendar')) {
    category = 'MEETING';
    importance = 60;
  } else if (text.includes('deadline') || text.includes('due')) {
    category = 'DEADLINE';
    importance = 85;
  } else if (text.includes('document') || text.includes('contract')) {
    category = 'DOCUMENT';
    importance = 50;
  } else if (text.includes('invoice') || text.includes('payment') || text.includes('bill')) {
    category = 'FINANCE';
    importance = 60;
  } else if (text.includes('newsletter') || text.includes('unsubscribe')) {
    category = 'NEWSLETTER';
    importance = 10;
  } else if (text.includes('sale') || text.includes('promo') || text.includes('discount')) {
    category = 'PROMOTION';
    importance = 10;
  }

  return {
    category,
    importance_score: importance,
    summary: `Email from ${emailData.headers?.from || 'unknown'} regarding ${subject}`,
    action_required: importance > 50,
    action_text: importance > 50 ? 'Review email for required action' : '',
    company: '',
    role: '',
    event_date: null,
    entities: {},
    confidence: 0.3
  };
}

async function processEmailBatch(emails) {
  const results = [];
  for (const email of emails) {
    try {
      const analysis = await analyzeEmail(email);
      results.push({ email, analysis });
    } catch (error) {
      console.error('Batch process error:', error);
      results.push({ email, analysis: getFallbackAnalysis(email) });
    }
  }
  return results;
}

module.exports = {
  analyzeEmail,
  processEmailBatch,
  cleanEmailContent,
  extractKeyInfo
};