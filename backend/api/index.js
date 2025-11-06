const { createServer } = require('http');
const app = require('../server');

// Create server instance
const server = createServer(app);

// Export the serverless function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Forward the request to Express
  return new Promise((resolve, reject) => {
    const { url, method, headers, body } = req;
    const request = { url, method, headers, body };
    
    app(request, res)
      .then(() => resolve())
      .catch(error => {
        console.error('Server error:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
        resolve();
      });
  });
}
