import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import './P5Canvas.css';

const P5Canvas = ({ code, width = 800, height = 600, isProcessing = false }) => {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);

  // Create or update the P5.js instance when code changes
  useEffect(() => {
    // Clean up previous P5 instance if it exists
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    if (!code || !canvasRef.current) return;

    try {
      // Create the P5 sketch
      const sketch = (p) => {
        // Define p5.js functions to be available in the sketch
        window.createCanvas = (...args) => p.createCanvas(...args);
        window.background = (...args) => p.background(...args);
        window.fill = (...args) => p.fill(...args);
        window.ellipse = (...args) => p.ellipse(...args);
        window.rect = (...args) => p.rect(...args);
        window.frameRate = (...args) => p.frameRate(...args);
        window.mouseX = p.mouseX;
        window.mouseY = p.mouseY;

        // Updating mouseX and mouseY in draw to keep them current
        const originalDraw = p.draw;
        p.draw = () => {
          window.mouseX = p.mouseX;
          window.mouseY = p.mouseY;
          if (originalDraw) originalDraw();
        };

        // Create a safe evaluation environment
        const createSafeFunction = (funcBody) => {
          try {
            // Create a function that has access to p5 global variables
            return new Function('p', `
              // Proxy p5 instance variables
              const mouseX = p.mouseX;
              const mouseY = p.mouseY;
              const width = p.width;
              const height = p.height;
              
              // Proxy p5 functions
              const createCanvas = (...args) => p.createCanvas(...args);
              const background = (...args) => p.background(...args);
              const fill = (...args) => p.fill(...args);
              const ellipse = (...args) => p.ellipse(...args);
              const rect = (...args) => p.rect(...args);
              const frameRate = (...args) => p.frameRate(...args);
              const color = (...args) => p.color(...args);
              
              // Run the function body
              ${funcBody}
            `);
          } catch (error) {
            console.error('Error creating function:', error);
            return () => {};
          }
        };

        // Extract setup function
        let setupFunc;
        try {
          const setupMatch = code.match(/function\s+setup\s*\(\)\s*\{([\s\S]*?)\}/);
          const setupBody = setupMatch ? setupMatch[1].trim() : `
            createCanvas(${width}, ${height});
            frameRate(60);
          `;
          setupFunc = createSafeFunction(setupBody);
        } catch (error) {
          console.error('Error extracting setup:', error);
          setupFunc = () => {
            p.createCanvas(width, height);
            p.frameRate(60);
          };
        }

        // Extract draw function
        let drawFunc;
        try {
          const drawMatch = code.match(/function\s+draw\s*\(\)\s*\{([\s\S]*?)\}/);
          const drawBody = drawMatch ? drawMatch[1].trim() : `
            background(220);
            fill(255, 0, 0);
            ellipse(mouseX, mouseY, 20, 20);
          `;
          drawFunc = createSafeFunction(drawBody);
        } catch (error) {
          console.error('Error extracting draw:', error);
          drawFunc = () => {
            p.background(220);
            p.fill(255, 0, 0);
            p.ellipse(p.mouseX, p.mouseY, 20, 20);
          };
        }

        // Extract mousePressed function if it exists
        let mousePressedFunc;
        try {
          const mousePressedMatch = code.match(/function\s+mousePressed\s*\(\)\s*\{([\s\S]*?)\}/);
          if (mousePressedMatch) {
            const mousePressedBody = mousePressedMatch[1].trim();
            mousePressedFunc = createSafeFunction(mousePressedBody);
            p.mousePressed = () => mousePressedFunc(p);
          }
        } catch (error) {
          console.error('Error extracting mousePressed:', error);
        }

        // Set up the p5 functions
        p.setup = function() {
          try {
            setupFunc(p);
          } catch (error) {
            console.error('Error in setup function:', error);
            p.createCanvas(width, height);
            p.background(220);
          }
        };

        p.draw = function() {
          try {
            drawFunc(p);
          } catch (error) {
            console.error('Error in draw function:', error);
            p.background(255);
            p.fill(255, 0, 0);
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text('Error in sketch', width/2, height/2);
          }
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

  // State to track theater mode (expanded width)
  const [isTheaterMode, setIsTheaterMode] = React.useState(false);
  
  // Function to toggle theater mode (expanded width)
  const handleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
    
    // Apply the theater mode style changes
    setTimeout(() => {
      const container = canvasRef.current;
      if (!container) return;
      
      // Get the parent elements to adjust layout
      const canvasArea = container.closest('.canvas-area');
      const sketchContent = canvasArea?.parentElement;
      const sketchPage = sketchContent?.parentElement;
      
      if (canvasArea && sketchContent) {
        // Get the control panel for layout adjustments
        const controlPanel = sketchContent.querySelector('.control-panel');
        
        if (isTheaterMode) {
          // Return to normal mode
          document.body.classList.remove('theater-mode-active');
          canvasArea.style.width = '';
          canvasArea.style.height = '';
          canvasArea.style.maxWidth = '';
          sketchContent.classList.remove('theater-mode');
          
          // Reset container
          if (sketchPage) {
            sketchPage.style.maxWidth = '';
            sketchPage.style.padding = '';
          }
          
          // Reset canvas position
          container.style.position = '';
          
          // Reset control panel
          if (controlPanel) {
            controlPanel.style.width = '';
            controlPanel.style.marginRight = '';
          }
          
          // Reset the actual P5 canvas
          const p5Canvas = container.querySelector('canvas');
          if (p5Canvas && p5InstanceRef.current) {
            // Resize using P5 instance's resizeCanvas method with component props
            p5InstanceRef.current.resizeCanvas(width, height);
          }
        } else {
          // Enter theater mode - maximize canvas width to full browser width
          document.body.classList.add('theater-mode-active');
          canvasArea.style.width = 'calc(100vw - 350px)';  // Leave space for control panel
          canvasArea.style.maxWidth = 'calc(100vw - 350px)';
          
          // Use auto height to match the canvas height exactly
          canvasArea.style.height = 'auto';
          sketchContent.classList.add('theater-mode');
          
          // Expand container to full width
          if (sketchPage) {
            sketchPage.style.maxWidth = '100%';
            sketchPage.style.padding = '0';
          }
          
          // Adjust control panel width
          if (controlPanel) {
            controlPanel.style.width = '350px';
            controlPanel.style.marginRight = '0';
          }
          
          // Adjust canvas container
          container.style.position = 'relative';
          container.style.width = '100%';
          
          // Resize the actual P5 canvas element
          const p5Canvas = container.querySelector('canvas');
          if (p5Canvas && p5InstanceRef.current) {
            // Get window width
            const windowWidth = window.innerWidth;
            
            // Calculate height maintaining aspect ratio
            const aspectRatio = height / width;
            const newHeight = windowWidth * aspectRatio;
            
            // Resize using P5 instance's resizeCanvas method
            p5InstanceRef.current.resizeCanvas(windowWidth, newHeight);
            
            // Force styles on the canvas element
            p5Canvas.style.width = '100%';
            p5Canvas.style.maxWidth = 'none';
          }
        }
      }
    }, 0);
  };

  return (
    <div className="p5-canvas-container" ref={canvasRef}>
      {isProcessing && (
        <div className="processing-overlay">
          <div className="spinner"></div>
          <div className="processing-message">Processing your prompt...</div>
        </div>
      )}
      
      {/* Theater mode button in the top-right corner */}
      <button
        className="theater-mode-button"
        onClick={handleTheaterMode}
        title={isTheaterMode ? "Exit Theater Mode" : "Enter Theater Mode"}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'background-color 0.2s ease'
        }}
      >
        {isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
      </button>

      {/* Standard canvas controls - hidden for now but preserved for future use */}
      <div className="canvas-controls" style={{ display: 'none' }}>
        <button aria-label="Play/Pause">
          <span role="img" aria-hidden="true">▶️</span>
        </button>
        <button aria-label="Restart">
          <span role="img" aria-hidden="true">🔄</span>
        </button>
        <button
          aria-label="Theater Mode"
          onClick={handleTheaterMode}
          title={isTheaterMode ? "Exit Theater Mode" : "Enter Theater Mode"}
        >
          <span role="img" aria-hidden="true">⛶</span>
        </button>
      </div>
    </div>
  );
};

export default P5Canvas;