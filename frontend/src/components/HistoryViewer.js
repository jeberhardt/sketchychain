import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HistoryViewer.css';

const HistoryViewer = ({ sketchId, currentVersion, onViewVersion, onRevertToVersion }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showConfirmRevert, setShowConfirmRevert] = useState(false);
  
  useEffect(() => {
    // Load version history when component mounts
    const fetchVersions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/v1/sketches/${sketchId}/versions`
        );
        const versionsData = response.data.versions || [];
        setVersions(versionsData);
        
        // Select current version by default or most recent if not specified
        if (versionsData.length > 0) {
          if (currentVersion) {
            const current = versionsData.find(v => v.sequence === currentVersion);
            setSelectedVersion(current || versionsData[0]);
          } else {
            setSelectedVersion(versionsData[0]);
          }
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load version history:', err);
        setError('Failed to load version history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVersions();
  }, [sketchId, currentVersion]);
  
  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setShowConfirmRevert(false);
  };
  
  const handleViewVersion = () => {
    if (selectedVersion) {
      onViewVersion(selectedVersion);
    }
  };
  
  const handleRevertConfirm = () => {
    setShowConfirmRevert(true);
  };
  
  const handleRevert = async () => {
    if (selectedVersion) {
      try {
        const result = await onRevertToVersion(selectedVersion.sequence);
        if (!result.success) {
          setError(result.error || 'Failed to revert to selected version');
        }
        setShowConfirmRevert(false);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
        setShowConfirmRevert(false);
      }
    }
  };
  
  const handleCancelRevert = () => {
    setShowConfirmRevert(false);
  };
  
  // Format timestamp for display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading version history...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }
  
  if (versions.length === 0) {
    return (
      <div className="no-versions">
        <p>No version history available yet.</p>
      </div>
    );
  }
  
  return (
    <div className="history-viewer">
      <h3>Version History</h3>
      
      <div className="history-timeline">
        {versions.map((version) => (
          <div 
            key={version.sequence}
            className={`history-item ${selectedVersion?.sequence === version.sequence ? 'selected' : ''} 
                        ${currentVersion === version.sequence ? 'current' : ''}`}
            onClick={() => handleVersionSelect(version)}
          >
            <div className="version-marker"></div>
            <div className="version-info">
              <div className="version-number">Version {version.sequence}</div>
              <div className="version-time">{formatTime(version.timestamp)}</div>
              <div className="version-contributor">{version.contributor.nickname || 'Anonymous'}</div>
              <div className="version-prompt" title={version.promptText}>
                {version.promptText.length > 40 ? `${version.promptText.substring(0, 40)}...` : version.promptText}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedVersion && (
        <div className="version-detail-panel">
          <div className="version-thumbnail">
            {selectedVersion.thumbnail?.dataUrl ? (
              <img 
                src={selectedVersion.thumbnail.dataUrl} 
                width={selectedVersion.thumbnail.width}
                height={selectedVersion.thumbnail.height}
                alt={`Version ${selectedVersion.sequence} preview`}
              />
            ) : (
              <div className="thumbnail-placeholder">No preview available</div>
            )}
          </div>
          
          <div className="version-details">
            <h4>Version {selectedVersion.sequence}</h4>
            <p className="version-prompt-text">{selectedVersion.promptText}</p>
            <div className="version-metadata">
              <div>By: {selectedVersion.contributor.nickname || 'Anonymous'}</div>
              <div>Date: {formatDate(selectedVersion.timestamp)}</div>
              <div>Time: {formatTime(selectedVersion.timestamp)}</div>
            </div>
            
            <div className="version-actions">
              <button 
                className="view-button"
                onClick={handleViewVersion}
              >
                View This Version
              </button>
              
              {selectedVersion.sequence !== currentVersion && (
                <button 
                  className="revert-button"
                  onClick={handleRevertConfirm}
                >
                  Revert to This Version
                </button>
              )}
            </div>
          </div>
          
          {showConfirmRevert && (
            <div className="confirm-revert-dialog">
              <p>Are you sure you want to revert to Version {selectedVersion.sequence}?</p>
              <p>This will create a new version based on this historical state.</p>
              <div className="dialog-actions">
                <button className="cancel-button" onClick={handleCancelRevert}>Cancel</button>
                <button className="confirm-button" onClick={handleRevert}>Confirm Revert</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryViewer;