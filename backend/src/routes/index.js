const express = require('express');
const router = express.Router();

// Import route modules
const sketchRoutes = require('./sketchRoutes');
const promptRoutes = require('./promptRoutes');
const sessionRoutes = require('./sessionRoutes');
const healthRoutes = require('./healthRoutes');

// Mount routes
router.use('/sketches', sketchRoutes);
router.use('/prompts', promptRoutes);
router.use('/sessions', sessionRoutes);
router.use('/health', healthRoutes);

module.exports = router;