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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hasApiKey = !!process.env.GROQ_API_KEY;
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        groq_api: hasApiKey ? 'configured' : 'missing_key',
        backend: 'operational'
      },
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }
};

module.exports = handler;
