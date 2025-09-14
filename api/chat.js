// api/chat.js - Vercel serverless function
import Groq from 'groq-sdk';

// System prompt with Nehal's CV context
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

KEY PROJECTS:
- RoboDoc: Point-of-care diagnostic platform with 430k images dataset, 95% accuracy
- Orion AI: Strawberry health monitoring with YOLOv8-seg, 92% IoU accuracy
- Smart Collar: Cow health monitoring IoT device with 90% Wi-Fi transmission
- Psychonova: VR-based anxiety therapy platform with EEG/GSR sensors
- MNN Slicer: Open-source bioprinting software reducing printing time by 80%
- Oxygreen: Air purification device cutting CO₂ by 60% in 12 hours
- RndBio: AI urine diagnostic device with YOLOv11n on Raspberry Pi

TECHNICAL SKILLS:
- AI/ML: Computer Vision (YOLO, Image Segmentation), Deep Learning, Neural Networks
- Programming: Python (OpenCV, NumPy, SciPy, Matplotlib, PyQt), Dart, SQL
- Embedded Systems: Raspberry Pi, Arduino, ESP, IoT Design
- Prototyping: Blender, Unity 3D, 3D Printing (FDM/DLP)

AWARDS (Recent):
- Pollibotics: Best Innovative Idea, IEEE Zewail APPX Competition (04/2025)
- Robodoc5: 1st place Smart Industry Hackathon 5.0 (03/2025)
- Multiple other 1st and 2nd place awards in competitions

CONFERENCES & PRESENTATIONS:
- Egyptian Society of Surgeons Conference (05/2025)
- LEAP Summit Saudi Arabia (02/2025) - Semi-Finalist at Rocket Fuel
- GenZ Startup TV Program - Secured 500k EGP funding
- Cairo ICT 2024 Exhibition
- Presented to Egypt's Prime Minister

PUBLICATION:
- First Author: "The Role of Agentic AI in Revolutionizing Biotechnology" (International Journal for Biotech Research and Innovations, 2025)

Languages: Arabic (Native), English (Full Professional - IELTS 7), German (Elementary)

Answer questions conversationally and professionally. Be enthusiastic about her achievements while remaining factual. If asked about specific technical details not in the CV, acknowledge the limitation and suggest contacting Nehal directly. Keep responses concise but informative.`;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Validate and limit chat history
    const validHistory = Array.isArray(chatHistory) ? chatHistory.slice(-10) : []; // Keep last 10 messages
    
    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // Build messages array with system prompt, history, and current message
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      ...validHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Create chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calling Groq API:', error);
    
    // Handle specific Groq API errors
    if (error.status === 401) {
      return res.status(500).json({ error: 'Authentication failed' });
    } else if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.status === 503) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }}