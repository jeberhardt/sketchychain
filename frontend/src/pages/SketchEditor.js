import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import custom components (we'll create these next)
import P5Canvas from '../components/P5Canvas';
import PromptInput from '../components/PromptInput';
import HistoryViewer from '../components/HistoryViewer';
import ActiveUsers from '../components/ActiveUsers';
import useWebSocket from '../hooks/useWebSocket';

const SketchEditor = ({ isNew = false }) => {
  const { sketchId } = useParams();
  const navigate = useNavigate();
  
  const [sketch, setSketch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt', 'history', 'users'
  
  // WebSocket connection for real-time updates
  const { 
    connected,
    events,
    sendActivity
  } = useWebSocket(sketch?.id);

  // Effect to handle WebSocket events
  useEffect(() => {
    if (!events) return;

    // Handle different event types
    if (events.type === 'sketch:updated') {
      setSketch(prevSketch => ({
        ...prevSketch,
        currentCode: events.data.code,
        lastModified: {
          timestamp: events.data.timestamp,
          promptId: events.data.promptId
        }
      }));
      setIsProcessing(false);
    } else if (events.type === 'prompt:submitted') {
      setIsProcessing(true);
    } else if (events.type === 'prompt:status_update' && events.data.status.code === 'failed') {
      setIsProcessing(false);
    }
  }, [events]);

  // Fetch sketch data or create a new sketch
  useEffect(() => {
    const fetchSketch = async () => {
      try {
        setLoading(true);
        
        if (isNew) {
          // Create a new sketch
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/v1/sketches`, 
            {
              title: 'Untitled Sketch',
              description: '',
              baseTemplate: `function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(220);
}`,
              settings: {
                canvasWidth: 800,
                canvasHeight: 600,
                frameRate: 60,
                isPublic: true,
                allowAnonymous: true
              },
              tags: []
            }
          );
          
          setSketch(response.data);
          // Redirect to the new sketch URL
          navigate(`/sketch/${response.data.id}`, { replace: true });
        } else {
          // Fetch existing sketch
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/v1/sketches/${sketchId}`
          );
          setSketch(response.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching/creating sketch:', err);
        setError(err.response?.data?.error?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSketch();
  }, [isNew, sketchId, navigate]);

  // Handle prompt submission
  const handlePromptSubmit = async (promptData) => {
    try {
      setIsProcessing(true);
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/sketches/${sketch.id}/prompts`,
        promptData
      );
      
      // The actual update will come through the WebSocket
      // so we don't need to update the state directly here
      
      return { success: true };
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setIsProcessing(false);
      return { 
        success: false, 
        error: err.response?.data?.error?.message || 'Failed to submit prompt' 
      };
    }
  };

  // Handle sketch history navigation
  const handleViewVersion = (version) => {
    // Just update the UI with the historical code without creating a new version
    setSketch(prevSketch => ({
      ...prevSketch,
      currentCode: version.code,
      isViewingHistory: true,
      viewingVersion: version.sequence
    }));
  };

  // Handle reverting to a previous version
  const handleRevertToVersion = async (versionSequence) => {
    try {
      setIsProcessing(true);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/sketches/${sketch.id}/revert`,
        { versionSequence }
      );
      
      // Update will come via WebSocket
      return { success: true };
    } catch (err) {
      console.error('Error reverting to version:', err);
      setIsProcessing(false);
      return { 
        success: false, 
        error: err.response?.data?.error?.message || 'Failed to revert to version' 
      };
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading text-center">
          <div className="spinner"></div>
          <p>Loading sketch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/gallery')} className="button mt-3">
            Return to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sketch-editor-page">
      <div className="sketch-header">
        <h1>{sketch.title || 'Untitled Sketch'}</h1>
        <div className="sketch-meta">
          <span className="last-updated">
            Last updated: {new Date(sketch.lastModified?.timestamp || sketch.created?.timestamp).toLocaleString()}
          </span>
          <div className="connection-status">
            {connected ? (
              <span className="status-connected">Connected</span>
            ) : (
              <span className="status-disconnected">Disconnected</span>
            )}
          </div>
        </div>
      </div>

      <div className="sketch-content">
        <div className="canvas-area">
          {/* P5.js Canvas Component */}
          <P5Canvas 
            code={sketch.currentCode}
            width={sketch.settings?.canvasWidth || 800}
            height={sketch.settings?.canvasHeight || 600}
            isProcessing={isProcessing}
          />
        </div>

        <div className="control-panel">
          <div className="control-tabs">
            <button 
              className={`tab-button ${activeTab === 'prompt' ? 'active' : ''}`}
              onClick={() => setActiveTab('prompt')}
            >
              Prompt
            </button>
            <button 
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button 
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'prompt' && (
              <PromptInput 
                sketchId={sketch.id}
                onPromptSubmit={handlePromptSubmit}
                isProcessing={isProcessing}
                onActivityUpdate={sendActivity}
              />
            )}

            {activeTab === 'history' && (
              <HistoryViewer 
                sketchId={sketch.id}
                currentVersion={sketch.viewingVersion}
                onViewVersion={handleViewVersion}
                onRevertToVersion={handleRevertToVersion}
              />
            )}

            {activeTab === 'users' && (
              <ActiveUsers sketchId={sketch.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SketchEditor;