import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import './P5Canvas.css';

const P5Canvas = ({ code, width = 800, height = 600, isProcessing = false }) => {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);

  // Function to extract function body between curly braces
  const extractFunctionBody = (func) => {
    const funcStr = func.toString();
    const bodyStart = funcStr.indexOf('{') + 1;
    const bodyEnd = funcStr.lastIndexOf('}');
    return funcStr.substring(bodyStart, bodyEnd).trim();
  };

  // Parse the P5.js code to extract setup and draw functions
  const parseP5Code = (codeString) => {
    try {
      // Extract setup function
      const setupMatch = codeString.match(/function\s+setup\s*\(\)\s*\{([\s\S]*?)\}/);
      const setupBody = setupMatch ? setupMatch[1].trim() : '';
      
      // Extract draw function
      const drawMatch = codeString.match(/function\s+draw\s*\(\)\s*\{([\s\S]*?)\}/);
      const drawBody = drawMatch ? drawMatch[1].trim() : '';
      
      // Extract global variables (anything outside functions)
      let globals = '';
      const strippedCode = codeString
        .replace(/function\s+setup\s*\(\)\s*\{[\s\S]*?\}/g, '')
        .replace(/function\s+draw\s*\(\)\s*\{[\s\S]*?\}/g, '')
        .replace(/function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{[\s\S]*?\}/g, '');
      
      globals = strippedCode.trim();
      
      return { setupBody, drawBody, globals };
    } catch (error) {
      console.error('Error parsing P5 code:', error);
      return { setupBody: '', drawBody: '', globals: '' };
    }
  };

  // Create or update the P5.js instance when code changes
  useEffect(() => {
    // Clean up previous P5 instance if it exists
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    if (!code || !canvasRef.current) return;

    try {
      // Parse the code
      const { setupBody, drawBody, globals } = parseP5Code(code);

      // Create the P5 sketch
      const sketch = (p) => {
        // Evaluate global variables
        if (globals) {
          // Use with caution - in a production app, you'd want more security here
          // eslint-disable-next-line no-new-func
          new Function('p', globals)(p);
        }

        // Create setup function
        p.setup = function() {
          // eslint-disable-next-line no-new-func
          new Function('p', `
            try {
              ${setupBody}
            } catch (error) {
              console.error('Error in setup function:', error);
              createCanvas(${width}, ${height});
              background(255, 0, 0, 100);
            }
          `)(p);
        };

        // Create draw function
        p.draw = function() {
          // eslint-disable-next-line no-new-func
          new Function('p', `
            try {
              ${drawBody}
            } catch (error) {
              console.error('Error in draw function:', error);
              background(255);
              fill(255, 0, 0);
              textSize(16);
              textAlign(CENTER);
              text('Error in sketch', width/2, height/2);
            }
          `)(p);
        };

        // Handle window resize
        p.windowResized = function() {
          const container = canvasRef.current;
          if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const aspectRatio = width / height;
            
            // Maintain aspect ratio within the container
            let canvasWidth, canvasHeight;
            
            if (containerWidth / aspectRatio <= containerHeight) {
              canvasWidth = containerWidth;
              canvasHeight = containerWidth / aspectRatio;
            } else {
              canvasHeight = containerHeight;
              canvasWidth = containerHeight * aspectRatio;
            }
            
            p.resizeCanvas(canvasWidth, canvasHeight);
          }
        };
      };

      // Create the P5 instance in instance mode
      p5InstanceRef.current = new p5(sketch, canvasRef.current);

    } catch (error) {
      console.error('Error creating P5 instance:', error);
    }

    // Clean up on unmount
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [code, width, height]);

  return (
    <div className="p5-canvas-container" ref={canvasRef}>
      {isProcessing && (
        <div className="processing-overlay">
          <div className="spinner"></div>
          <div className="processing-message">Processing your prompt...</div>
        </div>
      )}
      
      <div className="canvas-controls">
        <button aria-label="Play/Pause">
          <span role="img" aria-hidden="true">▶️</span>
        </button>
        <button aria-label="Restart">
          <span role="img" aria-hidden="true">🔄</span>
        </button>
        <button aria-label="Fullscreen">
          <span role="img" aria-hidden="true">⛶</span>
        </button>
      </div>
    </div>
  );
};

export default P5Canvas;