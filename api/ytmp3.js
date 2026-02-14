const axios = require('axios');

const headers = {
  accept: "application/json",
  "content-type": "application/json",
  "user-agent": "Mozilla/5.0 (Android)",
  referer: "https://ytmp3.gg/"
};

const poll = async (statusUrl) => {
  try {
    const { data } = await axios.get(statusUrl, { headers });
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error(data.message || "Conversion failed");
   
    await new Promise(r => setTimeout(r, 2000));
    return poll(statusUrl);
  } catch (err) {
    throw new Error(`Polling failed: ${err.message}`);
  }
};

async function convertToMP3(url) {
  try {
    // Get video info via oEmbed
    const { data: meta } = await axios.get("https://www.youtube.com/oembed", {
      params: { url, format: "json" }
    });

    const payload = {
      url,
      os: "android",
      output: {
        type: "audio",
        format: "mp3"
      },
      audio: { bitrate: "128k" }
    };

    // Try hub → fallback to api subdomain
    let downloadInit;
    try {
      downloadInit = await axios.post("https://hub.ytconvert.org/api/download", payload, { headers });
    } catch {
      downloadInit = await axios.post("https://api.ytconvert.org/api/download", payload, { headers });
    }

    const { data: initData } = downloadInit;
    if (!initData?.statusUrl) {
      throw new Error("No status URL received from converter");
    }

    const result = await poll(initData.statusUrl);

    return {
      success: true,
      title: meta.title,
      author: meta.author_name,
      thumbnail: meta.thumbnail_url,
      downloadUrl: result.downloadUrl,
      filename: `${meta.title.replace(/[^\w\s-]/gi, '')}.mp3`
    };
  } catch (err) {
    console.error("Convert error:", err.message);
    return {
      success: false,
      message: err.message || "Failed to retrieve file"
    };
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request with query parameter
  if (req.method === 'GET') {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "YouTube URL is required. Use ?url= parameter"
      });
    }

    const result = await convertToMP3(url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json({
      success: true,
      creator: "@Dtz_Dula",
      title: result.title,
      channel: result.author,
      thumbnail: result.thumbnail,
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      quality: "128kbps"
    });
  }

  // Handle POST request with JSON body
  if (req.method === 'POST') {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "YouTube URL is required in request body"
      });
    }

    const result = await convertToMP3(url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json({
      success: true,
      creator: "@Dtz_Dula",
      title: result.title,
      channel: result.author,
      thumbnail: result.thumbnail,
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      quality: "128kbps"
    });
  }

  // Handle unsupported methods
  return res.status(405).json({
    success: false,
    message: "Method not allowed. Use GET or POST."
  });
};
