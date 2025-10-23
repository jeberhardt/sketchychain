require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const morgan = require('morgan');
const express = require('express');

// Configuration
const PORT = process.env.PORT || 4001;
const REDIS_URI = process.env.REDIS_URI || 'redis://redis:6379';
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:3000'];

// Create Express app and HTTP server
const app = express();
app.use(morgan('dev'));
const server = http.createServer(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
});

// Setup Redis adapter for horizontal scaling
const setupRedisAdapter = async () => {
  try {
    // Create Redis clients
    const pubClient = createClient({ url: REDIS_URI });
    const subClient = pubClient.duplicate();
    
    // Connect clients
    await pubClient.connect();
    await subClient.connect();
    
    // Create adapter
    io.adapter(createAdapter(pubClient, subClient));
    
    console.log('Redis adapter configured');
    
    // Handle Redis errors
    pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });
    
    subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });
    
    return { pubClient, subClient };
  } catch (error) {
    console.error('Failed to set up Redis adapter:', error);
    throw error;
  }
};

// Room management
const rooms = new Map();

// Socket event handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let currentRoom = null;
  
  // Extract session info from query parameters
  const sessionId = socket.handshake.query.sessionId || 'anonymous';
  let userData = {
    sessionId,
    nickname: null,
    activity: 'viewing'
  };
  
  // Store user data in socket
  socket.data.userData = userData;
  
  // Handle room subscriptions
  socket.on('subscribe', ({ room }) => {
    if (!room) return;
    
    console.log(`User ${sessionId} joining room: ${room}`);
    
    // Leave current room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      
      // Update room data
      if (rooms.has(currentRoom)) {
        const roomData = rooms.get(currentRoom);
        roomData.delete(sessionId);
        
        // Notify room about user leaving
        io.to(currentRoom).emit('presence:update', {
          event: 'leave',
          user: userData,
          timestamp: new Date(),
          activeUsers: Array.from(roomData.values())
        });
      }
    }
    
    // Join new room
    socket.join(room);
    currentRoom = room;
    
    // Update room data
    if (!rooms.has(room)) {
      rooms.set(room, new Map());
    }
    const roomData = rooms.get(room);
    roomData.set(sessionId, userData);
    
    // Notify room about new user
    io.to(room).emit('presence:update', {
      event: 'join',
      user: userData,
      timestamp: new Date(),
      activeUsers: Array.from(roomData.values())
    });
  });
  
  // Handle room unsubscriptions
  socket.on('unsubscribe', ({ room }) => {
    if (!room || room !== currentRoom) return;
    
    console.log(`User ${sessionId} leaving room: ${room}`);
    
    // Leave room
    socket.leave(room);
    
    // Update room data
    if (rooms.has(room)) {
      const roomData = rooms.get(room);
      roomData.delete(sessionId);
      
      // Notify room about user leaving
      io.to(room).emit('presence:update', {
        event: 'leave',
        user: userData,
        timestamp: new Date(),
        activeUsers: Array.from(roomData.values())
      });
      
      // Clean up empty rooms
      if (roomData.size === 0) {
        rooms.delete(room);
      }
    }
    
    currentRoom = null;
  });
  
  // Handle user activity updates
  socket.on('activity', ({ data }) => {
    if (!data || !data.action || !data.sketchId) return;
    
    // Update user activity
    userData.activity = data.action;
    
    // Update room data if in a room
    const roomId = `sketch:${data.sketchId}`;
    if (roomId === currentRoom && rooms.has(currentRoom)) {
      const roomData = rooms.get(currentRoom);
      roomData.set(sessionId, userData);
      
      // Notify room about user activity
      io.to(currentRoom).emit('presence:update', {
        event: 'activity',
        user: userData,
        timestamp: new Date(),
        activeUsers: Array.from(roomData.values())
      });
    }
  });
  
  // Handle nickname updates
  socket.on('update_nickname', ({ nickname }) => {
    // Update user data
    userData.nickname = nickname || null;
    
    // Update room data if in a room
    if (currentRoom && rooms.has(currentRoom)) {
      const roomData = rooms.get(currentRoom);
      roomData.set(sessionId, userData);
      
      // Notify room about user update
      io.to(currentRoom).emit('presence:update', {
        event: 'update',
        user: userData,
        timestamp: new Date(),
        activeUsers: Array.from(roomData.values())
      });
    }
  });
  
  // Handle heartbeat
  socket.on('heartbeat', () => {
    // This keeps the connection alive
    // No need to respond
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Leave current room if any
    if (currentRoom && rooms.has(currentRoom)) {
      const roomData = rooms.get(currentRoom);
      roomData.delete(sessionId);
      
      // Notify room about user leaving
      io.to(currentRoom).emit('presence:update', {
        event: 'leave',
        user: userData,
        timestamp: new Date(),
        activeUsers: Array.from(roomData.values())
      });
      
      // Clean up empty rooms
      if (roomData.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

// Start the server
const startServer = async () => {
  try {
    // Setup Redis adapter
    await setupRedisAdapter();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`WebSocket server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Start the server
startServer();

module.exports = { io, server };