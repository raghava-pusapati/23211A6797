const express = require('express');
const cors = require('cors');
const config = require('./config');
const notificationRoutes = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');
const { Log, configure } = require('../logging-middleware');

const app = express();

configure({
  loggingServerUrl: config.affordmedApi.baseUrl,
  bearerToken: config.auth.bearerToken,
  enabled: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  Log('backend', 'info', 'middleware', `${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  Log('backend', 'warn', 'route', `404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, async () => {
  await Log('backend', 'info', 'server', `Server started on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
