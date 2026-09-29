const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Normalize path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Redirect legacy login paths
  if (pathname === '/login' || pathname === '/login.html') {
    res.writeHead(302, { 'Location': '/customer-login.html' });
    return res.end();
  }

  // Resolve file path
  let filePath = path.join(PUBLIC_DIR, pathname);

  // Check if file exists as-is
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res);
  }

  // If not found, try appending .html (Clean URLs support)
  const htmlPath = filePath + '.html';
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return serveFile(htmlPath, res);
  }

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const dirIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(dirIndex)) {
      return serveFile(dirIndex, res);
    }
  }

  // 404 Handler
  res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
  res.end(`<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body style="font-family:sans-serif; text-align:center; padding:50px;">
  <h2>404 - Page Not Found</h2>
  <p>The requested file <code>${pathname}</code> was not found.</p>
  <p><a href="/" style="color:#2D6A4F; font-weight:bold;">Return to Home</a></p>
</body>
</html>`);
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sahakar Seva server is running on http://localhost:${PORT}`);
});
