/**
 * P5.js Sandbox Monitoring Utilities
 * 
 * This file provides utilities for monitoring and displaying resource usage
 * metrics for the P5.js sandbox.
 */

class SandboxMonitor {
  /**
   * Create a new SandboxMonitor instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.container] - Container element for the monitor display
   */
  constructor(options = {}) {
    this.container = options.container || document.createElement('div');
    this.container.className = 'sandbox-monitor';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '14px';
    this.container.style.padding = '10px';
    this.container.style.backgroundColor = '#f5f5f5';
    this.container.style.border = '1px solid #ddd';
    this.container.style.borderRadius = '4px';
    this.container.style.marginTop = '10px';
    this.container.style.maxHeight = '300px';
    this.container.style.overflowY = 'auto';
    
    this.metrics = {
      executionTime: 0,
      functionCalls: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      errors: [],
      status: 'idle' // idle, running, success, error, timeout, memoryLimit, functionLimit
    };
    
    this.executionHistory = [];
    this.startTime = null;
    
    // Create initial display
    this.updateDisplay();
  }
  
  /**
   * Reset the monitor for a new execution
   */
  reset() {
    this.metrics = {
      executionTime: 0,
      functionCalls: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      errors: [],
      status: 'idle'
    };
    this.startTime = null;
    this.updateDisplay();
  }
  
  /**
   * Start monitoring a new execution
   */
  startExecution() {
    this.reset();
    this.startTime = performance.now();
    this.metrics.status = 'running';
    this.updateDisplay();
    
    // Start periodic updates
    this.updateTimer = setInterval(() => {
      if (this.startTime) {
        this.metrics.executionTime = performance.now() - this.startTime;
        this.updateDisplay();
      }
    }, 100);
  }
  
  /**
   * Mark execution as completed successfully
   * @param {Object} result - Execution result data
   */
  markSuccess(result) {
    clearInterval(this.updateTimer);
    
    this.metrics.status = 'success';
    this.metrics.executionTime = performance.now() - (this.startTime || 0);
    this.metrics.functionCalls = result.functionCalls || 0;
    
    this.updateDisplay();
    this.saveExecutionHistory();
  }
  
  /**
   * Mark execution as failed with error
   * @param {Object} error - Error information
   */
  markError(error) {
    clearInterval(this.updateTimer);
    
    this.metrics.status = 'error';
    this.metrics.executionTime = performance.now() - (this.startTime || 0);
    this.metrics.functionCalls = error.functionCalls || 0;
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack
    });
    
    this.updateDisplay();
    this.saveExecutionHistory();
  }
  
  /**
   * Mark execution as timed out
   * @param {Object} info - Timeout information
   */
  markTimeout(info) {
    clearInterval(this.updateTimer);
    
    this.metrics.status = 'timeout';
    this.metrics.executionTime = info.timeoutMs || 0;
    
    this.updateDisplay();
    this.saveExecutionHistory();
  }
  
  /**
   * Mark execution as exceeded memory limit
   * @param {Object} info - Memory limit information
   */
  markMemoryLimit(info) {
    clearInterval(this.updateTimer);
    
    this.metrics.status = 'memoryLimit';
    this.metrics.executionTime = performance.now() - (this.startTime || 0);
    this.metrics.memoryUsage = info.usedHeapSize || 0;
    this.metrics.memoryLimit = info.limitBytes || 0;
    
    this.updateDisplay();
    this.saveExecutionHistory();
  }
  
  /**
   * Mark execution as exceeded function call limit
   * @param {Object} info - Function limit information
   */
  markFunctionLimit(info) {
    clearInterval(this.updateTimer);
    
    this.metrics.status = 'functionLimit';
    this.metrics.executionTime = performance.now() - (this.startTime || 0);
    this.metrics.functionCalls = info.functionCalls || 0;
    
    this.updateDisplay();
    this.saveExecutionHistory();
  }
  
  /**
   * Save current execution to history
   */
  saveExecutionHistory() {
    // Clone current metrics and add timestamp
    const historyEntry = JSON.parse(JSON.stringify(this.metrics));
    historyEntry.timestamp = new Date().toISOString();
    
    // Add to history (limit to 10 entries)
    this.executionHistory.unshift(historyEntry);
    if (this.executionHistory.length > 10) {
      this.executionHistory = this.executionHistory.slice(0, 10);
    }
  }
  
  /**
   * Format a number as bytes with appropriate units
   * @param {number} bytes - The number of bytes
   * @returns {string} Formatted string with units
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Update the monitor display with current metrics
   */
  updateDisplay() {
    // Clear previous content
    this.container.innerHTML = '';
    
    // Create status indicator
    const statusDiv = document.createElement('div');
    statusDiv.style.marginBottom = '8px';
    statusDiv.style.fontWeight = 'bold';
    
    switch (this.metrics.status) {
      case 'idle':
        statusDiv.textContent = 'Status: Idle';
        statusDiv.style.color = '#666';
        break;
      case 'running':
        statusDiv.textContent = 'Status: Running...';
        statusDiv.style.color = '#0066cc';
        break;
      case 'success':
        statusDiv.textContent = 'Status: Execution Successful';
        statusDiv.style.color = '#008800';
        break;
      case 'error':
        statusDiv.textContent = 'Status: Error Occurred';
        statusDiv.style.color = '#cc0000';
        break;
      case 'timeout':
        statusDiv.textContent = 'Status: Execution Timed Out';
        statusDiv.style.color = '#cc6600';
        break;
      case 'memoryLimit':
        statusDiv.textContent = 'Status: Memory Limit Exceeded';
        statusDiv.style.color = '#cc0000';
        break;
      case 'functionLimit':
        statusDiv.textContent = 'Status: Function Call Limit Exceeded';
        statusDiv.style.color = '#cc0000';
        break;
    }
    
    this.container.appendChild(statusDiv);
    
    // Create metrics display
    const metricsDiv = document.createElement('div');
    metricsDiv.style.marginBottom = '8px';
    
    metricsDiv.innerHTML = `
      <div>Execution Time: ${(this.metrics.executionTime / 1000).toFixed(3)} seconds</div>
      <div>Function Calls: ${this.metrics.functionCalls.toLocaleString()}</div>
      ${this.metrics.memoryUsage ? `
        <div>Memory Usage: ${this.formatBytes(this.metrics.memoryUsage)} / ${this.formatBytes(this.metrics.memoryLimit)}</div>
      ` : ''}
    `;
    
    this.container.appendChild(metricsDiv);
    
    // Display errors if any
    if (this.metrics.errors.length > 0) {
      const errorsDiv = document.createElement('div');
      errorsDiv.style.marginTop = '8px';
      
      const errorTitle = document.createElement('div');
      errorTitle.textContent = 'Errors:';
      errorTitle.style.fontWeight = 'bold';
      errorTitle.style.color = '#cc0000';
      errorsDiv.appendChild(errorTitle);
      
      this.metrics.errors.forEach(error => {
        const errorMsg = document.createElement('div');
        errorMsg.style.whiteSpace = 'pre-wrap';
        errorMsg.style.overflow = 'auto';
        errorMsg.style.marginTop = '4px';
        errorMsg.style.padding = '4px';
        errorMsg.style.backgroundColor = '#ffeeee';
        errorMsg.style.border = '1px solid #ffcccc';
        errorMsg.style.borderRadius = '2px';
        errorMsg.textContent = error.message;
        errorsDiv.appendChild(errorMsg);
        
        if (error.stack) {
          const errorStack = document.createElement('details');
          const errorSummary = document.createElement('summary');
          errorSummary.textContent = 'Stack Trace';
          errorSummary.style.fontSize = '12px';
          errorSummary.style.cursor = 'pointer';
          errorStack.appendChild(errorSummary);
          
          const stackContent = document.createElement('pre');
          stackContent.style.fontSize = '12px';
          stackContent.style.marginTop = '4px';
          stackContent.style.padding = '4px';
          stackContent.style.backgroundColor = '#f8f8f8';
          stackContent.style.maxHeight = '150px';
          stackContent.style.overflow = 'auto';
          stackContent.textContent = error.stack;
          errorStack.appendChild(stackContent);
          
          errorsDiv.appendChild(errorStack);
        }
      });
      
      this.container.appendChild(errorsDiv);
    }
    
    // Display execution history if available
    if (this.executionHistory.length > 0) {
      const historyDiv = document.createElement('div');
      historyDiv.style.marginTop = '16px';
      
      const historyTitle = document.createElement('details');
      historyTitle.style.marginBottom = '8px';
      
      const historySummary = document.createElement('summary');
      historySummary.textContent = 'Execution History';
      historySummary.style.fontWeight = 'bold';
      historySummary.style.cursor = 'pointer';
      historyTitle.appendChild(historySummary);
      
      const historyList = document.createElement('div');
      historyList.style.fontSize = '12px';
      historyList.style.marginTop = '8px';
      
      this.executionHistory.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.style.padding = '4px';
        entryDiv.style.marginBottom = '4px';
        entryDiv.style.backgroundColor = '#f0f0f0';
        entryDiv.style.borderRadius = '2px';
        
        const statusColor = 
          entry.status === 'success' ? '#008800' :
          entry.status === 'error' ? '#cc0000' :
          entry.status === 'timeout' ? '#cc6600' :
          entry.status === 'memoryLimit' ? '#cc0000' :
          entry.status === 'functionLimit' ? '#cc0000' : '#666';
        
        entryDiv.innerHTML = `
          <div style="font-weight: bold; color: ${statusColor};">
            #${index + 1}: ${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
          </div>
          <div>Time: ${(entry.executionTime / 1000).toFixed(3)}s, Calls: ${entry.functionCalls}</div>
          ${entry.errors.length > 0 ? `<div>Error: ${entry.errors[0].message}</div>` : ''}
        `;
        
        historyList.appendChild(entryDiv);
      });
      
      historyTitle.appendChild(historyList);
      historyDiv.appendChild(historyTitle);
      this.container.appendChild(historyDiv);
    }
  }
}