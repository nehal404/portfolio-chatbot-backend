import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  };

  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY is not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Parse request body
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Request body is empty' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const { messages } = body;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required and must not be empty' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Add system message if not already present
    const messagesWithSystem = messages[0]?.role === 'system' 
      ? messages 
      : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages: messagesWithSystem,
      temperature: 0.7,
      maxTokens: 1024,
    });

    return result.toDataStreamResponse({
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    }
  });
}