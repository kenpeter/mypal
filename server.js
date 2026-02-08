const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Redirect root to battle-demo
    if (req.url === '/') {
        res.writeHead(302, { 'Location': '/battle-demo/' });
        res.end();
        return;
    }

    // Default to index.html for directories
    let filePath = req.url;
    if (filePath.endsWith('/')) {
        filePath += 'index.html';
    }
    filePath = path.join(__dirname, filePath);

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🎮 PAL1 Battle Demo Server Started!');
    console.log(`📍 Open: http://localhost:${PORT}`);
    console.log(`📍 Direct: http://localhost:${PORT}/battle-demo/`);
    console.log('🛑 Press Ctrl+C to stop');
});
