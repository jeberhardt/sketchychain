require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('bull');
const { createClient } = require('redis');

const config = require('./config');
const AIService = require('./services/aiService');
const GitHubService = require('./services/githubService');
const WebSocketService = require('./services/websocketService');
const { connectDB } = require('./db');

// Create Redis client
const redisClient = createClient({ url: config.redis.uri });

// Create Bull queue for processing prompts
const promptQueue = new Queue('prompt-processing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100, // Keep the latest 100 completed jobs
    removeOnFail: 100      // Keep the latest 100 failed jobs
  }
});

// Initialize services
const aiService = new AIService(config.ai);
const githubService = new GitHubService(config.github);
const websocketService = new WebSocketService(config.websocket);

// Connect to MongoDB
connectDB();

// Connect Redis client
redisClient.connect().catch(err => {
  console.error('Redis connection error:', err);
  process.exit(1);
});

// Handle prompt processing queue
promptQueue.process(async (job) => {
  const { promptId, sketchId } = job.data;
  console.log(`Processing prompt ${promptId} for sketch ${sketchId}`);
  
  try {
    // Update prompt status to "processing"
    await updatePromptStatus(promptId, 'processing', 'Processing prompt with AI');
    
    // Broadcast status update via WebSocket
    websocketService.broadcastPromptStatus(promptId, sketchId, {
      code: 'processing',
      message: 'Processing prompt with AI'
    });
    
    // Fetch sketch and prompt data from database
    const sketch = await fetchSketch(sketchId);
    const prompt = await fetchPrompt(promptId);
    
    // Validate prompt content
    const validationResult = await validatePrompt(prompt.text);
    if (!validationResult.isValid) {
      await handleRejection(promptId, sketchId, validationResult.reason);
      return { success: false, reason: validationResult.reason };
    }
    
    // Process prompt with AI service
    const aiResult = await aiService.processPrompt(prompt.text, sketch.currentCode);
    
    if (!aiResult.success) {
      await handleRejection(promptId, sketchId, aiResult.error);
      return { success: false, reason: aiResult.error };
    }
    
    // Validate generated code
    const codeValidation = await validateGeneratedCode(aiResult.code);
    if (!codeValidation.isValid) {
      await handleRejection(promptId, sketchId, codeValidation.error);
      return { success: false, reason: codeValidation.error };
    }
    
    // Update sketch with new code
    const previousCode = sketch.currentCode;
    const newCode = aiResult.code;
    
    // Commit to GitHub
    const commitResult = await githubService.commitSketchChanges(
      sketch, 
      prompt, 
      previousCode,
      newCode
    );
    
    // Create new version
    const version = await createNewVersion(sketch, prompt, newCode, commitResult);
    
    // Update sketch with new code
    await updateSketch(sketchId, newCode, promptId);
    
    // Update prompt status to completed
    await updatePromptStatus(
      promptId, 
      'completed',
      'Prompt successfully processed and applied',
      {
        commitSha: commitResult.sha,
        commitUrl: commitResult.url
      }
    );
    
    // Broadcast update via WebSocket
    websocketService.broadcastSketchUpdate(sketchId, {
      promptId,
      versionId: version.id,
      sequence: version.sequence,
      code: newCode,
      promptText: prompt.text,
      contributor: prompt.contributor,
      timestamp: new Date()
    });
    
    return { 
      success: true, 
      versionId: version.id,
      commitSha: commitResult.sha
    };
    
  } catch (error) {
    console.error(`Error processing prompt ${promptId}:`, error);
    
    // Update prompt status to failed
    await updatePromptStatus(promptId, 'failed', `Processing error: ${error.message}`);
    
    // Broadcast failure via WebSocket
    websocketService.broadcastPromptStatus(promptId, sketchId, {
      code: 'failed',
      message: `Processing error: ${error.message}`
    });
    
    return { success: false, reason: error.message };
  }
});

// Handle prompt processing queue errors
promptQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

promptQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down AI Worker...');
  await promptQueue.close();
  await mongoose.connection.close();
  await redisClient.quit();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

console.log('AI Worker service started');

// Helper functions

/**
 * Fetch sketch from database
 */
async function fetchSketch(sketchId) {
  // Implementation would use Mongoose models
  // This is a placeholder
  console.log(`Fetching sketch ${sketchId}`);
  return {
    id: sketchId,
    currentCode: '// Placeholder code',
    // other sketch properties
  };
}

/**
 * Fetch prompt from database
 */
async function fetchPrompt(promptId) {
  // Implementation would use Mongoose models
  // This is a placeholder
  console.log(`Fetching prompt ${promptId}`);
  return {
    id: promptId,
    text: 'Placeholder prompt text',
    contributor: {
      nickname: 'Anonymous'
    }
    // other prompt properties
  };
}

/**
 * Update prompt status
 */
async function updatePromptStatus(promptId, statusCode, statusMessage, metadata = {}) {
  // Implementation would use Mongoose models
  // This is a placeholder
  console.log(`Updating prompt ${promptId} status to ${statusCode}: ${statusMessage}`);
}

/**
 * Update sketch with new code
 */
async function updateSketch(sketchId, newCode, promptId) {
  // Implementation would use Mongoose models
  // This is a placeholder
  console.log(`Updating sketch ${sketchId} with new code from prompt ${promptId}`);
}

/**
 * Create new version
 */
async function createNewVersion(sketch, prompt, code, commitResult) {
  // Implementation would use Mongoose models
  // This is a placeholder
  console.log(`Creating new version for sketch ${sketch.id}`);
  return {
    id: 'version-' + Date.now(),
    sequence: 1,
    // other version properties
  };
}

/**
 * Validate prompt content
 */
async function validatePrompt(promptText) {
  // Implementation would use ContentModerator service
  // This is a placeholder
  console.log(`Validating prompt: ${promptText}`);
  return { isValid: true };
}

/**
 * Validate generated code
 */
async function validateGeneratedCode(code) {
  // Implementation would use CodeValidator service
  // This is a placeholder
  console.log(`Validating generated code`);
  return { isValid: true };
}

/**
 * Handle prompt rejection
 */
async function handleRejection(promptId, sketchId, reason) {
  console.log(`Rejecting prompt ${promptId}: ${reason}`);
  
  // Update prompt status to rejected
  await updatePromptStatus(promptId, 'rejected', reason);
  
  // Broadcast rejection via WebSocket
  websocketService.broadcastPromptStatus(promptId, sketchId, {
    code: 'rejected',
    message: reason
  });
}