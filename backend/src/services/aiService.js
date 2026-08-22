const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const aiService = {};

aiService.extractEntities = async (emailContent) => {
  if (!emailContent || emailContent.length === 0) {
    throw new Error('Empty email content');
  }

  const prompt = `
    You are an email analysis assistant. Convert the following email into structured JSON.
    
    Email content:
    "${emailContent}"
    
    Return JSON with these fields:
    - category: One of [JOB, INTERVIEW, TRAVEL, MEETING, DEADLINE, DOCUMENT, FINANCE, PERSONAL, NEWSLETTER, PROMOTION, OTHER]
    - importance_score: Number 0-100
    - summary: Brief summary of the email (max 2 sentences)
    - action_required: Boolean - does this email require action?
    - action_text: What action is required? (null if none)
    - company: Company name mentioned (null if none)
    - role: Job role or title mentioned (null if none)
    - event_date: Date mentioned (e.g., interview date, travel date) or null
    - confidence: Decimal 0.0000-1.0000 representing confidence in analysis
    - entities: object with optional fields: location, deadline, interview_stage
    
    Return ONLY the JSON object, no surrounding text.
  `;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: 0.3,
    });

    const content = response.choices[0].message.content.trim();
    
    // Try to parse the JSON response
    let jsonResult;
    try {
      jsonResult = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[^\}]+\}/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate required fields
    const requiredFields = ['category', 'importance_score', 'summary', 'action_required', 'action_text', 'company', 'role', 'event_date', 'confidence'];
    for (const field of requiredFields) {
      if (jsonResult[field] === undefined) {
        jsonResult[field] = field.includes('_date') ? null : (field === 'action_required' ? false : field === 'confidence' ? 0.5 : 'OTHER');
      }
    }

    // Ensure category is valid
    const validCategories = ['JOB', 'INTERVIEW', 'TRAVEL', 'MEETING', 'DEADLINE', 'DOCUMENT', 'FINANCE', 'PERSONAL', 'NEWSLETTER', 'PROMOTION', 'OTHER'];
    if (!validCategories.includes(jsonResult.category)) {
      jsonResult.category = 'OTHER';
    }

    // Ensure importance_score is within range
    jsonResult.importance_score = Math.max(0, Math.min(100, Number(jsonResult.importance_score)));

    // Ensure confidence is within range
    jsonResult.confidence = Math.max(0, Math.min(1, Number(jsonResult.confidence)));

    return jsonResult;
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw error;
  }
};

module.exports = aiService;