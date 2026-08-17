const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorMiddleware = require('./middleware/errorMiddleware');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const actionRoutes = require('./routes/actionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root Server Info Endpoint
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI Meeting Notes API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 12px; max-width: 500px; text-align: center; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #6366f1; margin-top: 0; }
          p { color: #94a3b8; line-height: 1.5; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 1rem; }
          .status { display: inline-block; padding: 0.25rem 0.75rem; background: #166534; color: #4ade80; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="status">✓ API Server Operational</div>
          <h1>AI Meeting Notes & Action Tracker</h1>
          <p>The backend REST API server is running on port 5001.</p>
          <p>To access the full interactive SaaS web application dashboard, open the React frontend:</p>
          <a href="http://localhost:3000" class="btn">Open Web App Dashboard (Port 3000)</a>
        </div>
      </body>
    </html>
  `);
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Meeting Notes & Action Tracker API is operational',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`
  });
});

// Centralized Error Middleware
app.use(errorMiddleware);

module.exports = app;
