const mongoose = require('mongoose');
const { createClient } = require('redis');
const config = require('./config');

// Redis client instance
let redisClient = null;

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Get Redis client instance
 * @returns {Object} Redis client
 */
const getRedisClient = async () => {
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: config.redis.uri,
        ...config.redis.options
      });

      // Event handlers
      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });

      redisClient.on('reconnecting', () => {
        console.log('Redis Client Reconnecting');
      });

      // Connect to Redis server
      await redisClient.connect();
    } catch (error) {
      console.error(`Error connecting to Redis: ${error.message}`);
      throw error;
    }
  }

  return redisClient;
};

/**
 * Close all database connections
 */
const closeConnections = async () => {
  try {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }

    // Close Redis connection
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error(`Error closing database connections: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  getRedisClient,
  closeConnections
};