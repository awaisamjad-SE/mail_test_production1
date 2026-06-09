import axios from 'axios';

export default async function handler(req, res) {
  // Destructure 'path' query param which Vercel populates from the rewrite
  const { path, ...queryParams } = req.query;
  
  // Reconstruct any other query parameters
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `http://34.234.65.13/api/${path || ''}${queryString ? '?' + queryString : ''}`;

  try {
    // Forward the request to the EC2 backend preserving method, headers, and body
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      data: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      validateStatus: () => true, // Don't throw on error status codes, forward them
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
