import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================
dotenv.config();

// ==========================================
// IMPORT ROUTES
// ==========================================
import authRoutes from './routes/authRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// ==========================================
// PATH CONFIGURATION
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CLOUDINARY ENV CHECK
// ==========================================
console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY ? 'Loaded ✅' : 'Missing ❌');
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Loaded ✅' : 'Missing ❌');
console.log('Cloudinary API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Loaded ✅' : 'Missing ❌');

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', chatRoutes);

// ==========================================
// START SERVER FUNCTION
// ==========================================
async function startServer() {

  // 1. MONGODB CONNECTION
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully 🚀');

  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  // 2. DEVELOPMENT MODE (Vite Integration)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode 🛠️');

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: projectRoot
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(projectRoot, 'index.html'), 'utf-8');
        
        template = await vite.transformIndexHtml(url, template);

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } 
  // 3. PRODUCTION MODE (Serving Built Static Files)
  else {
    console.log('Running in PRODUCTION mode 📦');

    const distPath = path.join(projectRoot, 'dist');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 4. START LISTENING
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} 🌐`);
  });
}

// ==========================================
// RUN SERVER
// ==========================================
startServer();