const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are Nehal Alaa's AI assistant, designed to answer questions about her professional background, skills, and projects. You have access to her comprehensive CV and should provide detailed, accurate information about her experience.

Key Information about Nehal Alaa:
- AI Engineering Enthusiast studying Biotechnology (Dual Degree) at MSA University & University of Greenwich
- GPA: 3.61/4.0 (UK 2:1 Upper Second-Class Honors)
- Contact: nehalalaaadel@gmail.com, LinkedIn: linkedin.com/in/nehalalaa/

WORK EXPERIENCE:
1. Undergraduate Research Assistant at MSA Uni Prototyping Lab (09/2023 – 05/2025)
   - Built 7 versions of RoboDoc with 95% accurate AI diagnosis, securing 500K EGP funding
   - Designed 10 AI and IoT systems including bioreactors, health monitors, bioprinting tools
   - Represented lab at 12 global events, presented to Egypt's Prime Minister

2. AI Engineer at PolliBotics Startup (09/2024 – 05/2025)
   - Developed AI robotic pollinator for vertical farms, boosting yield by 30%
   - Trained 50K-image plant disease model with YOLOv8 for real-time crop health analytics

Answer questions conversationally and professionally. Be enthusiastic about her achievements while remaining factual.`;

const handler = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request received:', {
      method: req.method,
      body: req.body,
      hasApiKey: !!process.env.GROQ_API_KEY
    });

    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is missing');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const validHistory = Array.isArray(chatHistory) ? chatHistory.slice(-10) : [];
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...validHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling Groq API with:', {
      messageCount: messages.length,
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct'
    });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    console.log('Groq API response received');

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack
    });
    
    // More specific error messages
    if (error.message && error.message.includes('model_decommissioned')) {
      return res.status(500).json({ 
        error: 'Model no longer available',
        details: 'The AI model is deprecated. Please contact support.' 
      });
    }
    
    if (error.status === 401) {
      return res.status(500).json({ error: 'Authentication failed - check API key' });
    } else if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.message 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    });
  }
};

module.exports = handler;