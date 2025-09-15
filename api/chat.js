import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

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
  try {
    const { messages } = await req.json();

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

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}