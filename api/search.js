const { searchYouTube } = require('../utils/youtube');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ status: false, message: 'Method not allowed' });
    return;
  }

  try {
    // Get query from URL parameter or from query string
    const query = req.query.query || req.query.q;
    
    if (!query) {
      res.status(400).json({ 
        status: false, 
        message: 'Search query is required. Use ?query= or ?q=' 
      });
      return;
    }

    const result = await searchYouTube(query);
    res.status(result.status ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
