import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/api/chat') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'X-Vercel-AI-Data-Stream': 'v1' });
    res.end('0:"Test response"\n');
  } else {
    res.writeHead(404);
    res.end();
  }
});
server.listen(4001, () => console.log('Test server running on 4001'));
