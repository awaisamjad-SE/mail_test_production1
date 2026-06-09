import axios from 'axios';

export default async function handler(req, res) {
  // Catch-all route passes path segments as an array in req.query.path
  const { path: pathSegments, ...queryParams } = req.query;
  
  // Reconstruct path string from array (e.g. ['auth', 'login'] -> 'auth/login')
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join('/') : (pathSegments || '');
  
  // Ensure the path ends with a trailing slash to match Django's URL routing
  const normalizedPath = pathStr.endsWith('/') ? pathStr : `${pathStr}/`;
  
  // Reconstruct any extra query parameters
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `http://34.234.65.13/api/${normalizedPath}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      data: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      validateStatus: () => true, // Forward response codes directly
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
