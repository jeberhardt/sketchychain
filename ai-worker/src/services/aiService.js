const AIModelService = require('./aiModelService');

/**
 * AI Service for processing prompts and generating P5.js code
 */
class AIService {
  constructor(config) {
    this.config = config;
    this.aiModel = new AIModelService();
  }

  /**
   * Process a prompt and generate P5.js code
   * @param {string} promptText - The text prompt from the user
   * @param {string} currentCode - The current code in the sketch (for context)
   * @returns {Promise<Object>} - Object containing success status and generated code
   */
  async processPrompt(promptText, currentCode) {
    try {
      console.log(`Processing prompt: "${promptText}"`);
      console.log(`Current code context length: ${currentCode.length} characters`);

      // Enhance the prompt with context from the current code
      const enhancedPrompt = this.createEnhancedPrompt(promptText, currentCode);

      // Generate P5.js code using the AI model
      const generatedCode = await this.aiModel.generateP5Code(enhancedPrompt);

      // Validate and clean the generated code
      const processedCode = this.processGeneratedCode(generatedCode, currentCode);

      console.log(`Successfully generated code (${processedCode.length} characters)`);
      
      return {
        success: true,
        code: processedCode
      };
    } catch (error) {
      console.error('Error in AI service:', error);
      return {
        success: false,
        error: error.message || 'Error generating code'
      };
    }
  }

  /**
   * Create an enhanced prompt with context from the current code
   * @param {string} promptText - Original user prompt
   * @param {string} currentCode - Current sketch code
   * @returns {string} - Enhanced prompt
   */
  createEnhancedPrompt(promptText, currentCode) {
    // Extract important information from current code
    const setupFn = this.extractFunction(currentCode, 'setup');
    const drawFn = this.extractFunction(currentCode, 'draw');
    
    // Create a context-aware prompt
    return `
      Based on the following current P5.js sketch context:
      
      Setup function: ${setupFn || 'Not defined'}
      Draw function: ${drawFn || 'Not defined'}
      
      Please update the sketch according to this request: "${promptText}"
      
      Return the complete P5.js code that incorporates the requested changes.
    `;
  }

  /**
   * Extract a function definition from code
   * @param {string} code - Source code
   * @param {string} functionName - Name of function to extract
   * @returns {string} - Extracted function or null
   */
  extractFunction(code, functionName) {
    const regex = new RegExp(`function\\s+${functionName}\\s*\\(.*?\\)\\s*{[\\s\\S]*?}`, 'g');
    const match = regex.exec(code);
    return match ? match[0] : null;
  }

  /**
   * Process, validate and clean the generated code
   * @param {string} generatedCode - Raw generated code
   * @param {string} currentCode - Current code for fallback
   * @returns {string} - Processed code
   */
  processGeneratedCode(generatedCode, currentCode) {
    // If no code was generated, return the current code
    if (!generatedCode || generatedCode.trim().length === 0) {
      console.warn('No code was generated, returning current code');
      return currentCode;
    }
    
    // Basic validation - check for required P5.js functions
    const hasSetup = generatedCode.includes('function setup');
    const hasDraw = generatedCode.includes('function draw');
    
    if (!hasSetup || !hasDraw) {
      console.warn('Generated code missing setup or draw functions, performing repair');
      
      // Simple repair by extracting them from current code if missing
      let repairedCode = generatedCode;
      
      if (!hasSetup) {
        const currentSetup = this.extractFunction(currentCode, 'setup');
        if (currentSetup) {
          repairedCode = currentSetup + '\n\n' + repairedCode;
        }
      }
      
      if (!hasDraw) {
        const currentDraw = this.extractFunction(currentCode, 'draw');
        if (currentDraw) {
          repairedCode = repairedCode + '\n\n' + currentDraw;
        }
      }
      
      return repairedCode;
    }
    
    return generatedCode;
  }
}

module.exports = AIService;