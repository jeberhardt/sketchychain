import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SketchGallery = () => {
  const [sketches, setSketches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  useEffect(() => {
    const fetchSketches = async () => {
      try {
        setLoading(true);
        // The API URL would come from environment variables in a real app
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/sketches`);
        setSketches(response.data.sketches || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching sketches:', err);
        setError('Failed to load sketches. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSketches();
  }, []);

  return (
    <div className="container">
      <div className="gallery-page">
        <div className="gallery-header mb-4">
          <h1>Sketch Gallery</h1>
          <div className="gallery-controls">
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
              >
                Grid
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List View"
              >
                List
              </button>
            </div>
            <Link to="/new" className="button">
              Create New Sketch
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading text-center">
            <div className="spinner"></div>
            <p>Loading sketches...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : sketches.length === 0 ? (
          <div className="no-sketches text-center">
            <h3>No sketches found</h3>
            <p>Be the first to create a sketch!</p>
            <Link to="/new" className="button mt-3">
              Create Your First Sketch
            </Link>
          </div>
        ) : (
          <div className={`sketches-${viewMode}`}>
            {sketches.map((sketch) => (
              <div key={sketch.id} className={`sketch-card ${viewMode}`}>
                <Link to={`/sketch/${sketch.id}`} className="sketch-link">
                  <div className="sketch-thumbnail">
                    <img 
                      src={sketch.thumbnail || '/placeholder-sketch.png'} 
                      alt={sketch.title}
                    />
                    {sketch.statistics && sketch.statistics.contributorCount > 0 && (
                      <div className="active-indicator">
                        <span role="img" aria-label="Active Users">👥</span> {sketch.statistics.contributorCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="sketch-info">
                    <h3 className="sketch-title">{sketch.title || 'Untitled Sketch'}</h3>
                    {viewMode === 'grid' && sketch.description && (
                      <p className="sketch-description">
                        {sketch.description.length > 100
                          ? `${sketch.description.substring(0, 97)}...`
                          : sketch.description}
                      </p>
                    )}
                    
                    <div className="sketch-meta">
                      <div className="sketch-prompts">
                        <span role="img" aria-label="Prompts">💬</span> {sketch.statistics?.promptCount || 0} prompts
                      </div>
                      <div className="sketch-last-modified">
                        <span role="img" aria-label="Last Modified">🕒</span> {new Date(sketch.lastModified?.timestamp || sketch.created?.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="sketch-tags">
                      {sketch.tags && sketch.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SketchGallery;