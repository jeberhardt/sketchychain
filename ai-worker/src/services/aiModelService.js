const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

/**
 * AI Model Service that abstracts away the specific AI provider implementation
 * Currently using OpenAI's GPT-3.5 Turbo but designed to be easily swappable
 */
class AIModelService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.modelName = process.env.MODEL_NAME || 'gpt-3.5-turbo';
    this.client = this.initializeClient();
  }

  /**
   * Initialize the appropriate AI client based on provider
   */
  initializeClient() {
    if (this.provider === 'openai') {
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Fallback to OpenAI if provider not supported
    console.warn(`Provider ${this.provider} not supported, using OpenAI`);
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate P5.js code from a natural language prompt
   * @param {string} prompt - User's natural language prompt
   * @returns {Promise<string>} - Generated P5.js code
   */
  async generateP5Code(prompt) {
    try {
      const enhancedPrompt = this.createP5Prompt(prompt);
      
      if (this.provider === 'openai') {
        const response = await this.client.chat.completions.create({
          model: this.modelName,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates P5.js code based on user descriptions. Provide only the code without explanations."
            },
            { role: "user", content: enhancedPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });
        
        return this.extractValidP5Code(response.choices[0].message.content);
      }
      
      // Handle unsupported provider case
      throw new Error(`Provider ${this.provider} not implemented for code generation`);
    } catch (error) {
      console.error('Error generating P5.js code:', error);
      throw new Error('Failed to generate P5.js code');
    }
  }

  /**
   * Create a detailed prompt specifically for P5.js code generation
   * @param {string} userPrompt - Original user prompt
   * @returns {string} - Enhanced prompt for the AI
   */
  createP5Prompt(userPrompt) {
    return `
    Generate valid P5.js code for the following description:
    "${userPrompt}"
    
    The code should:
    1. Include setup() and draw() functions
    2. Set createCanvas() in setup with appropriate dimensions
    3. Use appropriate P5.js drawing functions
    4. Implement user interactivity where appropriate
    5. Be well-commented and clear
    6. Be optimized for performance
    
    Return ONLY the P5.js code without any explanations.
    `;
  }

  /**
   * Extract valid P5.js code from the AI response
   * @param {string} response - Raw AI response
   * @returns {string} - Cleaned P5.js code
   */
  extractValidP5Code(response) {
    // Extract code from markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:javascript|js)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code blocks, return the whole response
    return response.trim();
  }
}

module.exports = AIModelService;