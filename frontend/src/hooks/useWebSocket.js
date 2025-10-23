import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to handle WebSocket connections and events
 * @param {string} sketchId - The ID of the sketch to connect to
 * @returns {Object} WebSocket state and methods
 */
const useWebSocket = (sketchId) => {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!sketchId) return;

    // Create WebSocket connection if not already established
    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_WS_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        withCredentials: true,
        query: {
          sessionId: localStorage.getItem('sessionId') || 'anonymous-' + Date.now()
        }
      });

      // Store the session ID if not already set
      if (!localStorage.getItem('sessionId')) {
        const sessionId = 'anonymous-' + Date.now();
        localStorage.setItem('sessionId', sessionId);
      }

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Subscribe to the sketch room
        subscribeToSketch(sketchId);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        setConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        setConnected(true);
        
        // Re-subscribe to the sketch room
        subscribeToSketch(sketchId);
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        console.log(`WebSocket reconnection attempt ${attemptNumber}`);
        reconnectAttemptsRef.current = attemptNumber;
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed');
      });
    }

    // Event listeners for specific message types
    const messageTypes = [
      'prompt:submitted', 
      'prompt:status_update', 
      'sketch:updated', 
      'presence:update',
      'error'
    ];

    messageTypes.forEach(type => {
      socketRef.current.on(type, (data) => {
        setEvents({ type, data, timestamp: Date.now() });
      });
    });

    // Subscribe to the sketch room
    const subscribeToSketch = (id) => {
      if (socketRef.current && socketRef.current.connected && id) {
        socketRef.current.emit('subscribe', { room: `sketch:${id}` });
        console.log(`Subscribed to sketch room: sketch:${id}`);
        
        // Send presence update
        socketRef.current.emit('activity', {
          data: {
            sketchId: id,
            action: 'viewing'
          }
        });
      }
    };

    // Subscribe on initial connection or when sketchId changes
    if (socketRef.current.connected) {
      subscribeToSketch(sketchId);
    }

    // Heartbeat to keep the connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('heartbeat');
      }
    }, 30000);

    // Cleanup on unmount or when sketchId changes
    return () => {
      // Unsubscribe from the sketch room
      if (socketRef.current && socketRef.current.connected && sketchId) {
        socketRef.current.emit('unsubscribe', { room: `sketch:${sketchId}` });
      }
      
      // Remove all event listeners
      messageTypes.forEach(type => {
        socketRef.current?.off(type);
      });
      
      clearInterval(heartbeatInterval);
      
      // Note: We don't disconnect the socket on unmount to allow for page navigation
      // The socket will be reused if the hook is used again
    };
  }, [sketchId]);

  // Send activity update
  const sendActivity = useCallback((sketchId, action) => {
    if (socketRef.current && socketRef.current.connected && sketchId) {
      socketRef.current.emit('activity', {
        data: {
          sketchId,
          action
        }
      });
    }
  }, []);
  
  // Manual disconnect function (useful for cleanup)
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  return { 
    connected,
    events,
    sendActivity,
    disconnect
  };
};

export default useWebSocket;