# P5.js Sandbox Isolation - Implementation Design

This document provides the detailed design for implementing a secure P5.js code sandbox mechanism. The actual implementation will be done in Code mode, but this document outlines the architecture and approach.

## Core Components

### 1. SandboxManager Class

The `SandboxManager` is the main controller that handles iframe creation, message passing, and lifecycle management.

```javascript
class SandboxManager {
  constructor(options = {}) {
    this.containerElement = options.container || document.body;
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.timeoutMs = options.timeout || 5000;
    this.memoryLimitMB = options.memoryLimit || 50;
    this.maxFunctionCalls = options.maxFunctionCalls || 1000;
    
    this.sandbox = null;
    this.isRunning = false;
    this.executionTimeout = null;
    this.callbacks = {
      onSuccess: options.onSuccess || (() => {}),
      onError: options.onError || (() => {}),
      onTimeout: options.onTimeout || (() => {}),
      onMemoryLimit: options.onMemoryLimit || (() => {}),
      onFunctionLimit: options.onFunctionLimit || (() => {})
    };
  }

  // Core methods:
  // - createSandbox()
  // - loadP5js()
  // - executeCode(code)
  // - terminateSandbox()
  // - messageHandler(event)
}
```

### 2. Sandboxed iframe Structure

The sandbox iframe will be created with strict sandbox attributes and a custom content structure:

```html
<iframe
  sandbox="allow-scripts"
  style="width: [width]px; height: [height]px; border: none;"
  srcdoc="
    <!DOCTYPE html>
    <html>
      <head>
        <script src='https://cdn.jsdelivr.net/npm/p5@1.4.0/lib/p5.js'></script>
        <script src='sandbox-frame.js'></script>
        <style>body { margin: 0; overflow: hidden; }</style>
      </head>
      <body>
        <script>
          // Overrides for dangerous APIs
          window.fetch = null;
          window.XMLHttpRequest = null;
          window.WebSocket = null;
          // ...more API overrides...
          
          // Function call counter
          let functionCallCount = 0;
          const originalCall = Function.prototype.call;
          Function.prototype.call = function() {
            functionCallCount++;
            if (functionCallCount > MAX_FUNCTION_CALLS) {
              throw new Error('Maximum function call limit exceeded');
            }
            return originalCall.apply(this, arguments);
          };
          
          // Memory monitor
          const memoryMonitor = setInterval(() => {
            if (window.performance && window.performance.memory) {
              const usedHeapSize = window.performance.memory.usedJSHeapSize;
              const limitBytes = MEMORY_LIMIT_MB * 1024 * 1024;
              if (usedHeapSize > limitBytes) {
                clearInterval(memoryMonitor);
                window.parent.postMessage({
                  type: 'memoryLimit',
                  message: 'Memory limit exceeded'
                }, '*');
              }
            }
          }, 100);
          
          // Message handler for parent frame
          window.addEventListener('message', (event) => {
            if (event.data.type === 'execute') {
              try {
                // Reset counters
                functionCallCount = 0;
                
                // Execute code
                const userCode = event.data.code;
                // Safely evaluate in isolated environment
                (new Function(userCode))();
                
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
              // Clean up code execution
              if (typeof noLoop === 'function') {
                try { noLoop(); } catch(e) {}
              }
              clearInterval(memoryMonitor);
            }
          });
        </script>
      </body>
    </html>
  "
></iframe>
```

### 3. Security Measures

The sandbox implements several layers of security:

1. **iframe sandboxing**: Using sandbox attribute with only `allow-scripts` permission
2. **API Overrides**: Replacing dangerous browser APIs with null implementations
3. **Function Call Limiting**: Tracking function calls to detect infinite loops
4. **Memory Monitoring**: Checking heap usage to prevent memory exhaustion
5. **Execution Timeout**: Setting a global timeout for the entire execution
6. **Error Capturing**: Catching and reporting all errors without affecting parent page

### 4. Message Communication Protocol

Communication between the parent application and sandbox uses a well-defined message protocol:

#### Parent to Sandbox Messages:

```javascript
// Execute code
{
  type: 'execute',
  code: '...P5.js code...'
}

// Terminate execution
{
  type: 'terminate'
}
```

#### Sandbox to Parent Messages:

```javascript
// Success response
{
  type: 'success',
  functionCalls: 123
}

// Error response
{
  type: 'error',
  message: 'Error message',
  stack: 'Error stack trace',
  functionCalls: 45
}

// Memory limit exceeded
{
  type: 'memoryLimit',
  message: 'Memory limit exceeded'
}

// Function call limit exceeded
{
  type: 'functionLimit',
  message: 'Function call limit exceeded'
}
```

## Implementation Flow

### 1. Initialization

1. Create an instance of `SandboxManager` with desired configuration
2. Manager creates a sandboxed iframe with the appropriate sandbox attributes
3. Iframe loads P5.js library and security override scripts
4. Manager sets up message event listeners for communication

### 2. Code Execution

1. User submits P5.js code to be executed
2. Manager sends code to the sandbox iframe via postMessage
3. Sandbox executes the code in an isolated environment with security measures
4. Execution is monitored for timeouts, infinite loops, and memory usage

### 3. Result Handling

1. Sandbox reports execution results back to the manager via postMessage
2. Manager invokes appropriate callbacks (success, error, timeout, etc.)
3. Results are displayed to the user with appropriate feedback

### 4. Cleanup

1. When execution completes or is terminated, resources are cleaned up
2. For persistent errors or security violations, the entire iframe can be destroyed and recreated

## Security Considerations

1. **Content Security Policy**: The sandbox should use a strict CSP to further limit capabilities
2. **Dynamic Code Evaluation**: Care must be taken to avoid exposing `eval` or Function constructors
3. **Browser Support**: The implementation should account for browser differences in iframe isolation
4. **Denial of Service Protection**: Multiple layers of resource limitation are needed
5. **Escape Detection**: Monitor for attempts to escape the sandbox and terminate execution

## Testing Strategy

1. **Functionality Testing**: Verify legitimate P5.js sketches work correctly
2. **Security Testing**: Attempt to execute known malicious patterns
3. **Performance Testing**: Measure overhead of the sandbox mechanism
4. **Resource Limit Testing**: Verify limits on memory, CPU, and function calls
5. **Browser Compatibility**: Test across major browsers and versions

## Integration with the Main Application

1. The sandbox will be instantiated when a user views a P5.js sketch
2. When prompt changes are applied, the code will be re-executed in the sandbox
3. Runtime errors will be captured and displayed to the user
4. Execution metrics will be logged for monitoring purposes