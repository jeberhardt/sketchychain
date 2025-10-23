require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('redis');

const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { connectDB, getRedisClient } = require('./db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/v1', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server };