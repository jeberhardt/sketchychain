import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <div className="home-page">
        <h1 className="text-center mb-4">Sketchy Chain</h1>
        
        <div className="hero-section mb-5">
          <p className="text-center mb-3">
            Collaboratively create and modify P5.js sketches using AI-powered prompts.
          </p>
          <div className="cta-buttons text-center">
            <Link to="/gallery" className="button mr-3">
              Browse Sketches
            </Link>
            <Link to="/new" className="button">
              Create New Sketch
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col">
            <h2>How it works</h2>
            <ol className="feature-list">
              <li>Create a new sketch or join an existing one</li>
              <li>Enter text prompts describing your desired changes</li>
              <li>AI processes your prompts and modifies the P5.js code</li>
              <li>See your changes appear in real-time on the canvas</li>
              <li>Browse through the history of changes at any time</li>
            </ol>
          </div>
          
          <div className="col">
            <h2>Features</h2>
            <ul className="feature-list">
              <li>Collaborative editing in real-time</li>
              <li>AI-powered code generation from natural language</li>
              <li>Complete version history</li>
              <li>No account required to get started</li>
              <li>Automatic GitHub integration for code persistence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;