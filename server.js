const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8080;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  // Development server logging
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }

  // Handle root request
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(DIST_DIR, filePath);

  // Security check
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${filePath}`);
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Get file extension and MIME type
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Set headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err}`);
        res.writeHead(500);
        res.end('Internal server error');
        return;
      }

      res.writeHead(200);
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.warn(`🚀 Server running at http://localhost:${PORT}`);
  console.warn(`📁 Serving files from: ${DIST_DIR}`);
  console.warn('🔍 Open http://localhost:8080 in your browser');
  console.warn('Press Ctrl+C to stop');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
