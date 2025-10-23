/**
 * P5.js Sandbox Isolation Mechanism
 * 
 * This file implements a secure sandbox for executing user-generated P5.js code.
 * It uses iframe isolation, API overriding, and resource monitoring to prevent
 * malicious code execution.
 */

class SandboxManager {
  /**
   * Create a new SandboxManager instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.container] - Container element for the sandbox
   * @param {number} [options.width] - Width of the sandbox canvas
   * @param {number} [options.height] - Height of the sandbox canvas
   * @param {number} [options.timeout] - Execution timeout in milliseconds
   * @param {number} [options.memoryLimit] - Memory limit in megabytes
   * @param {number} [options.maxFunctionCalls] - Maximum function calls allowed
   * @param {Function} [options.onSuccess] - Callback for successful execution
   * @param {Function} [options.onError] - Callback for execution errors
   * @param {Function} [options.onTimeout] - Callback for execution timeouts
   * @param {Function} [options.onMemoryLimit] - Callback for memory limit exceeded
   * @param {Function} [options.onFunctionLimit] - Callback for function call limit exceeded
   */
  constructor(options = {}) {
    this.containerElement = options.container || document.body;
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.timeoutMs = options.timeout || 5000;
    this.memoryLimitMB = options.memoryLimit || 50;
    this.maxFunctionCalls = options.maxFunctionCalls || 1000;
    
    this.sandbox = null;
    this.sandboxFrame = null;
    this.isRunning = false;
    this.executionTimeout = null;
    
    this.callbacks = {
      onSuccess: options.onSuccess || (() => {}),
      onError: options.onError || (() => {}),
      onTimeout: options.onTimeout || (() => {}),
      onMemoryLimit: options.onMemoryLimit || (() => {}),
      onFunctionLimit: options.onFunctionLimit || (() => {})
    };

    // Bind methods
    this.messageHandler = this.messageHandler.bind(this);
  }

  /**
   * Create the sandbox iframe
   * @returns {Promise} Resolves when the sandbox is ready
   */
  createSandbox() {
    return new Promise((resolve, reject) => {
      // Clean up any existing sandbox
      if (this.sandbox) {
        this.terminateSandbox();
      }

      // Create a container div for the iframe
      this.sandbox = document.createElement('div');
      this.sandbox.className = 'p5js-sandbox';
      this.sandbox.style.width = `${this.width}px`;
      this.sandbox.style.height = `${this.height}px`;
      this.sandbox.style.position = 'relative';
      this.sandbox.style.overflow = 'hidden';
      this.sandbox.style.border = '1px solid #ccc';
      this.containerElement.appendChild(this.sandbox);

      // Create the sandbox iframe with strict limitations
      const sandboxContent = this.generateSandboxContent();
      
      this.sandboxFrame = document.createElement('iframe');
      this.sandboxFrame.sandbox = 'allow-scripts';
      this.sandboxFrame.style.width = '100%';
      this.sandboxFrame.style.height = '100%';
      this.sandboxFrame.style.border = 'none';
      this.sandboxFrame.srcdoc = sandboxContent;
      
      // Listen for messages from the sandbox
      window.addEventListener('message', this.messageHandler);

      // Add iframe to the DOM
      this.sandbox.appendChild(this.sandboxFrame);

      // Set up a timeout for iframe loading
      const iframeLoadTimeout = setTimeout(() => {
        reject(new Error('Sandbox iframe failed to load'));
      }, 5000);

      // Handle iframe load event
      this.sandboxFrame.onload = () => {
        clearTimeout(iframeLoadTimeout);
        resolve();
      };
      
      // Handle iframe error event
      this.sandboxFrame.onerror = (err) => {
        clearTimeout(iframeLoadTimeout);
        reject(new Error(`Sandbox iframe failed to load: ${err.message}`));
      };
    });
  }

  /**
   * Generate the HTML content for the sandboxed iframe
   * @returns {string} The HTML content
   */
  generateSandboxContent() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline';">
          <script src='https://cdn.jsdelivr.net/npm/p5@1.4.0/lib/p5.js'></script>
          <style>
            body { 
              margin: 0; 
              overflow: hidden;
              background: transparent; 
            }
            /* Ensure canvas is contained */
            canvas { 
              display: block; 
              max-width: 100%; 
              max-height: 100%;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <script>
            // Protect against potential sandbox escapes and limit available APIs
            
            // Block network requests
            window.fetch = null;
            window.XMLHttpRequest = null;
            window.WebSocket = null;
            window.navigator.sendBeacon = null;
            window.EventSource = null;
            
            // Block storage access
            window.localStorage = null;
            window.sessionStorage = null;
            window.indexedDB = null;
            
            // Block opening windows or changing location
            window.open = null;
            window.location = Object.freeze(window.location);
            window.parent = null;
            window.top = null;
            
            // Block access to sensitive browser features
            window.navigator.geolocation = null;
            window.navigator.credentials = null;
            window.navigator.mediaDevices = null;
            window.navigator.serviceWorker = null;
            window.Notification = null;
            
            // Configuration constants
            const MAX_FUNCTION_CALLS = ${this.maxFunctionCalls};
            const MEMORY_LIMIT_MB = ${this.memoryLimitMB};
            
            // Function call monitoring to prevent infinite loops
            let functionCallCount = 0;
            const originalCall = Function.prototype.call;
            Function.prototype.call = function() {
              functionCallCount++;
              if (functionCallCount > MAX_FUNCTION_CALLS) {
                window.parent.postMessage({
                  type: 'functionLimit',
                  message: 'Function call limit exceeded',
                  functionCalls: functionCallCount
                }, '*');
                throw new Error('Maximum function call limit exceeded');
              }
              return originalCall.apply(this, arguments);
            };
            
            // Memory usage monitoring
            let memoryMonitorInterval;
            
            function startMemoryMonitoring() {
              memoryMonitorInterval = setInterval(() => {
                if (window.performance && window.performance.memory) {
                  const usedHeapSize = window.performance.memory.usedJSHeapSize;
                  const limitBytes = MEMORY_LIMIT_MB * 1024 * 1024;
                  
                  if (usedHeapSize > limitBytes) {
                    clearInterval(memoryMonitorInterval);
                    window.parent.postMessage({
                      type: 'memoryLimit',
                      message: 'Memory limit exceeded',
                      usedHeapSize: usedHeapSize,
                      limitBytes: limitBytes
                    }, '*');
                  }
                }
              }, 100);
            }
            
            function stopMemoryMonitoring() {
              if (memoryMonitorInterval) {
                clearInterval(memoryMonitorInterval);
              }
            }
            
            // Track p5js instance
            let p5Instance = null;
            
            // Message handler for parent frame
            window.addEventListener('message', (event) => {
              if (event.data.type === 'execute') {
                try {
                  // Reset state
                  functionCallCount = 0;
                  stopMemoryMonitoring();
                  
                  // Remove any existing canvas and p5 instance
                  if (p5Instance) {
                    p5Instance.remove();
                    p5Instance = null;
                  }
                  
                  // Start memory monitoring
                  startMemoryMonitoring();
                  
                  // Execute code in a controlled manner
                  const userCode = event.data.code;
                  
                  // Create a new function with the user code
                  // This avoids exposing the global scope directly
                  const codeFunction = new Function(userCode);
                  
                  // Execute the code
                  codeFunction();
                  
                  // Signal success
                  window.parent.postMessage({
                    type: 'success',
                    functionCalls: functionCallCount
                  }, '*');
                } catch (error) {
                  // Signal error
                  window.parent.postMessage({
                    type: 'error',
                    message: error.message,
                    stack: error.stack,
                    functionCalls: functionCallCount
                  }, '*');
                }
              } else if (event.data.type === 'terminate') {
                // Clean up execution
                stopMemoryMonitoring();
                
                // Stop p5.js loop if exists
                if (typeof noLoop === 'function') {
                  try { 
                    noLoop(); 
                  } catch (e) {
                    // Ignore errors during cleanup
                  }
                }
                
                // Remove p5 instance
                if (p5Instance) {
                  try {
                    p5Instance.remove();
                    p5Instance = null;
                  } catch (e) {
                    // Ignore errors during cleanup
                  }
                }
                
                // Notify parent frame
                window.parent.postMessage({
                  type: 'terminated'
                }, '*');
              }
            });
            
            // Notify parent that sandbox is ready
            window.parent.postMessage({ type: 'ready' }, '*');
          </script>
        </body>
      </html>
    `;
  }

  /**
   * Handle messages from the sandbox iframe
   * @param {MessageEvent} event - The message event
   */
  messageHandler(event) {
    // Ignore messages from other sources
    if (!this.sandboxFrame || event.source !== this.sandboxFrame.contentWindow) {
      return;
    }

    const { type, message, stack, functionCalls, usedHeapSize, limitBytes } = event.data;

    switch (type) {
      case 'ready':
        // Sandbox is ready to execute code
        break;
        
      case 'success':
        clearTimeout(this.executionTimeout);
        this.isRunning = false;
        this.callbacks.onSuccess({ 
          functionCalls: functionCalls
        });
        break;
        
      case 'error':
        clearTimeout(this.executionTimeout);
        this.isRunning = false;
        this.callbacks.onError({
          message: message,
          stack: stack,
          functionCalls: functionCalls
        });
        break;
        
      case 'memoryLimit':
        clearTimeout(this.executionTimeout);
        this.isRunning = false;
        this.callbacks.onMemoryLimit({
          message: message,
          usedHeapSize: usedHeapSize,
          limitBytes: limitBytes
        });
        this.terminateExecution();
        break;
        
      case 'functionLimit':
        clearTimeout(this.executionTimeout);
        this.isRunning = false;
        this.callbacks.onFunctionLimit({
          message: message,
          functionCalls: functionCalls
        });
        this.terminateExecution();
        break;
        
      case 'terminated':
        this.isRunning = false;
        break;
    }
  }

  /**
   * Execute P5.js code in the sandbox
   * @param {string} code - The P5.js code to execute
   * @returns {Promise} Resolves when execution completes or fails
   */
  executeCode(code) {
    return new Promise((resolve, reject) => {
      if (!this.sandboxFrame) {
        reject(new Error('Sandbox not initialized. Call createSandbox() first.'));
        return;
      }

      if (this.isRunning) {
        reject(new Error('Sandbox is already running code. Terminate current execution first.'));
        return;
      }

      this.isRunning = true;

      // Set up success callback
      const successCallback = this.callbacks.onSuccess;
      this.callbacks.onSuccess = (result) => {
        successCallback(result);
        resolve(result);
      };

      // Set up error callback
      const errorCallback = this.callbacks.onError;
      this.callbacks.onError = (error) => {
        errorCallback(error);
        reject(error);
      };

      // Set up timeout callback
      const timeoutCallback = this.callbacks.onTimeout;
      this.callbacks.onTimeout = (timeoutInfo) => {
        timeoutCallback(timeoutInfo);
        reject(new Error('Execution timed out'));
      };

      // Set up memory limit callback
      const memoryLimitCallback = this.callbacks.onMemoryLimit;
      this.callbacks.onMemoryLimit = (memoryInfo) => {
        memoryLimitCallback(memoryInfo);
        reject(new Error('Memory limit exceeded'));
      };

      // Set up function limit callback
      const functionLimitCallback = this.callbacks.onFunctionLimit;
      this.callbacks.onFunctionLimit = (functionInfo) => {
        functionLimitCallback(functionInfo);
        reject(new Error('Function call limit exceeded'));
      };

      // Set up execution timeout
      this.executionTimeout = setTimeout(() => {
        this.isRunning = false;
        this.callbacks.onTimeout({
          timeoutMs: this.timeoutMs
        });
        this.terminateExecution();
        reject(new Error(`Execution timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      // Send code to sandbox
      this.sandboxFrame.contentWindow.postMessage({
        type: 'execute',
        code: code
      }, '*');
    });
  }

  /**
   * Terminate the current execution
   */
  terminateExecution() {
    if (this.sandboxFrame) {
      this.sandboxFrame.contentWindow.postMessage({
        type: 'terminate'
      }, '*');
    }
    
    clearTimeout(this.executionTimeout);
    this.isRunning = false;
  }

  /**
   * Completely remove the sandbox
   */
  terminateSandbox() {
    this.terminateExecution();
    
    // Remove event listener
    window.removeEventListener('message', this.messageHandler);
    
    // Remove iframe from DOM
    if (this.sandbox && this.sandbox.parentNode) {
      this.sandbox.parentNode.removeChild(this.sandbox);
    }
    
    this.sandbox = null;
    this.sandboxFrame = null;
  }
}