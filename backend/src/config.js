/**
 * Application configuration
 */

const config = {
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/promptdesigner',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // Redis configuration
  redis: {
    uri: process.env.REDIS_URI || 'redis://redis:6379',
    options: {
      legacyMode: false
    }
  },
  
  // WebSocket service
  websocket: {
    uri: process.env.WS_SERVICE_URL || 'http://websocket:4001'
  },
  
  // AI service
  ai: {
    // Default to OpenAI, but could be configured to use other services
    service: process.env.AI_SERVICE || 'openai',
    apiKey: process.env.AI_SERVICE_KEY,
    defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gpt-3.5-turbo',
    timeout: parseInt(process.env.AI_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10)
  },
  
  // GitHub integration
  github: {
    token: process.env.GITHUB_TOKEN,
    organization: process.env.GITHUB_ORGANIZATION,
    username: process.env.GITHUB_USERNAME,
    repoPrefix: process.env.GITHUB_REPO_PREFIX || 'sketch-',
    maxRetries: parseInt(process.env.GITHUB_MAX_RETRIES || '3', 10)
  },
  
  // Security and rate limiting
  security: {
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMITING_WINDOW_MS || '60000', 10),
      maxRequestsPerIp: parseInt(process.env.RATE_LIMITING_MAX_REQUESTS || '100', 10),
      maxPromptsPerIp: parseInt(process.env.RATE_LIMITING_MAX_PROMPTS || '10', 10),
    },
    contentModeration: {
      enabled: process.env.CONTENT_MODERATION_ENABLED !== 'false',
      service: process.env.CONTENT_MODERATION_SERVICE || 'openai',
      thresholds: {
        sexual: parseFloat(process.env.MODERATION_THRESHOLD_SEXUAL || '0.5'),
        hate: parseFloat(process.env.MODERATION_THRESHOLD_HATE || '0.5'),
        harassment: parseFloat(process.env.MODERATION_THRESHOLD_HARASSMENT || '0.5'),
        violence: parseFloat(process.env.MODERATION_THRESHOLD_VIOLENCE || '0.6'),
        selfHarm: parseFloat(process.env.MODERATION_THRESHOLD_SELFHARM || '0.6'),
        toxicity: parseFloat(process.env.MODERATION_THRESHOLD_TOXICITY || '0.7')
      }
    }
  },
  
  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000']
};

module.exports = config;