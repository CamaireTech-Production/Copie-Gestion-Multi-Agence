import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Import the AI handlers (CommonJS modules)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const askHandler = require('../api/ai/ask.js');
const healthHandler = require('../api/ai/health.js');

// API Routes
app.post('/api/ai/ask', askHandler);
app.get('/api/ai/health', healthHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Production server running on Render',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`📡 AI endpoints available at:`);
  console.log(`   - POST /api/ai/ask`);
  console.log(`   - GET  /api/ai/health`);
  console.log(`🌐 Frontend served from /dist`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down production server...');
  process.exit(0);
});
