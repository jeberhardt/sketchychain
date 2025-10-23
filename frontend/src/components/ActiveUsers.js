import React, { useState, useEffect } from 'react';
import './ActiveUsers.css';
import useWebSocket from '../hooks/useWebSocket';

const ActiveUsers = ({ sketchId }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const { events } = useWebSocket(sketchId);

  useEffect(() => {
    // Handle user presence events from WebSocket
    if (!events) return;

    if (events.type === 'presence:update') {
      setActiveUsers(events.data.activeUsers || []);
    }
  }, [events]);

  if (activeUsers.length === 0) {
    return (
      <div className="active-users-empty">
        <p>No other users currently online.</p>
        <p className="invite-message">Share the URL to invite others to collaborate!</p>
      </div>
    );
  }

  return (
    <div className="active-users-panel">
      <h3>Active Contributors ({activeUsers.length})</h3>
      
      <ul className="user-list">
        {activeUsers.map(user => (
          <li 
            key={user.sessionId}
            className={`user-item ${user.activity === 'typing' ? 'typing' : ''}`}
          >
            <div className="user-avatar">
              {user.nickname ? user.nickname.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user.nickname || 'Anonymous'}
              </div>
              {user.activity === 'typing' && (
                <div className="typing-indicator">
                  typing<span>.</span><span>.</span><span>.</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="share-section">
        <p>Invite others to collaborate</p>
        <div className="share-url-container">
          <input 
            type="text" 
            value={window.location.href} 
            readOnly 
            className="share-url"
            onClick={(e) => e.target.select()}
          />
          <button 
            className="copy-url-button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              // Could add a success tooltip here
            }}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveUsers;