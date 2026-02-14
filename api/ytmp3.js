const { convertYouTube } = require('../utils/youtube');

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
    const { url, quality = "128k" } = req.query;
    
    if (!url) {
      res.status(400).json({ 
        status: false, 
        message: 'YouTube URL is required. Use ?url=' 
      });
      return;
    }

    const result = await convertYouTube(url, "mp3", quality);
    
    if (result.status === false) {
      res.status(400).json(result);
      return;
    }

    const response = {
      status: true,
      creator: "@Dtz_Dula",
      title: result.title,
      channel: result.author,
      duration: result.duration,
      views: "—",
      thumbnail: result.thumbnail,
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      quality: "128kbps"
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ 
      status: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
