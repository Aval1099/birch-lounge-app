/**
 * MCP OpenAI Service for Enhanced AI Capabilities
 * Integrates with OpenAI MCP server to complement Gemini AI
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { apiKeyService } from './apiKeyService.js';

class MCPOpenAIService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.models = {
      gpt4: 'gpt-4-turbo-preview',
      gpt35: 'gpt-3.5-turbo',
      analysis: 'gpt-4-turbo-preview',
      creative: 'gpt-4-turbo-preview'
    };
  }

  /**
   * Initialize MCP OpenAI connection
   */
  async initialize() {
    try {
      const openaiApiKey = apiKeyService.getApiKey('openai') || process.env.VITE_OPENAI_API_KEY;

      if (!openaiApiKey) {
        throw new Error('OpenAI API key not found. Please configure in settings.');
      }

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@pierrebrunelle/mcp-server-openai'],
        env: {
          ...process.env,
          OPENAI_API_KEY: openaiApiKey
        }
      });

      this.client = new Client({
        name: 'birch-lounge-openai',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      console.warn('MCP OpenAI Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP OpenAI Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Analyze recipe with OpenAI
   * @param {Object} recipe - Recipe to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Recipe analysis
   */
  async analyzeRecipe(recipe, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const analysisPrompt = this.buildRecipeAnalysisPrompt(recipe, options);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.analysis,
            messages: [
              {
                role: 'system',
                content: 'You are an expert mixologist and cocktail analyst. Provide detailed, professional analysis of cocktail recipes including flavor profiles, balance, techniques, and suggestions for improvement.'
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }
        }
      });

      return this.parseRecipeAnalysis(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing recipe with OpenAI:', error);
      throw error;
    }
  }

  /**
   * Generate recipe variations
   * @param {Object} recipe - Base recipe
   * @param {Object} options - Variation options
   * @returns {Promise<Object[]>} Recipe variations
   */
  async generateRecipeVariations(recipe, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const variationPrompt = this.buildVariationPrompt(recipe, options);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.creative,
            messages: [
              {
                role: 'system',
                content: 'You are a creative mixologist specializing in cocktail variations. Create innovative but balanced variations of existing recipes while maintaining the core character of the original drink.'
              },
              {
                role: 'user',
                content: variationPrompt
              }
            ],
            temperature: 0.8,
            max_tokens: 1500
          }
        }
      });

      return this.parseRecipeVariations(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating recipe variations:', error);
      throw error;
    }
  }

  /**
   * Suggest ingredient substitutions
   * @param {string} ingredient - Ingredient to substitute
   * @param {Object} context - Recipe context
   * @returns {Promise<Object[]>} Substitution suggestions
   */
  async suggestSubstitutions(ingredient, context = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const substitutionPrompt = this.buildSubstitutionPrompt(ingredient, context);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.analysis,
            messages: [
              {
                role: 'system',
                content: 'You are an expert bartender with deep knowledge of ingredient substitutions. Provide practical, accessible substitutions that maintain the integrity of the cocktail.'
              },
              {
                role: 'user',
                content: substitutionPrompt
              }
            ],
            temperature: 0.6,
            max_tokens: 800
          }
        }
      });

      return this.parseSubstitutions(response.choices[0].message.content);
    } catch (error) {
      console.error('Error suggesting substitutions:', error);
      throw error;
    }
  }

  /**
   * Optimize menu for profitability
   * @param {Object[]} recipes - Menu recipes
   * @param {Object} constraints - Business constraints
   * @returns {Promise<Object>} Menu optimization suggestions
   */
  async optimizeMenu(recipes, constraints = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const optimizationPrompt = this.buildMenuOptimizationPrompt(recipes, constraints);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.analysis,
            messages: [
              {
                role: 'system',
                content: 'You are a beverage consultant specializing in menu optimization for bars and restaurants. Analyze menus for profitability, customer appeal, and operational efficiency.'
              },
              {
                role: 'user',
                content: optimizationPrompt
              }
            ],
            temperature: 0.5,
            max_tokens: 1200
          }
        }
      });

      return this.parseMenuOptimization(response.choices[0].message.content);
    } catch (error) {
      console.error('Error optimizing menu:', error);
      throw error;
    }
  }

  /**
   * Generate training content
   * @param {string} topic - Training topic
   * @param {Object} options - Training options
   * @returns {Promise<Object>} Training content
   */
  async generateTrainingContent(topic, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const trainingPrompt = this.buildTrainingPrompt(topic, options);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.creative,
            messages: [
              {
                role: 'system',
                content: 'You are an experienced bar trainer and educator. Create comprehensive, practical training materials that are easy to understand and implement.'
              },
              {
                role: 'user',
                content: trainingPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500
          }
        }
      });

      return this.parseTrainingContent(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating training content:', error);
      throw error;
    }
  }

  /**
   * Compare AI responses (OpenAI vs Gemini)
   * @param {string} prompt - Prompt to compare
   * @param {string} geminiResponse - Gemini's response
   * @returns {Promise<Object>} Comparison analysis
   */
  async compareWithGemini(prompt, geminiResponse) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      // Get OpenAI response
      const openaiResponse = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.gpt4,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }
        }
      });

      const openaiContent = openaiResponse.choices[0].message.content;

      // Compare responses
      const comparisonPrompt = `
        Compare these two AI responses to the prompt: "${prompt}"

        Response A (Gemini): ${geminiResponse}

        Response B (OpenAI): ${openaiContent}

        Provide a detailed comparison focusing on:
        1. Accuracy and factual correctness
        2. Creativity and innovation
        3. Practical applicability
        4. Completeness of information
        5. Overall quality

        Format as JSON with scores (1-10) for each criterion and explanations.
      `;

      const comparisonResponse = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'chat_completion',
          arguments: {
            model: this.models.analysis,
            messages: [
              {
                role: 'system',
                content: 'You are an AI evaluation expert. Provide objective, detailed comparisons of AI responses.'
              },
              {
                role: 'user',
                content: comparisonPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 800
          }
        }
      });

      return {
        openaiResponse: openaiContent,
        geminiResponse,
        comparison: this.parseComparison(comparisonResponse.choices[0].message.content)
      };
    } catch (error) {
      console.error('Error comparing AI responses:', error);
      throw error;
    }
  }

  /**
   * Build recipe analysis prompt
   * @param {Object} recipe - Recipe to analyze
   * @param {Object} options - Analysis options
   * @returns {string} Analysis prompt
   */
  buildRecipeAnalysisPrompt(recipe, options) {
    let prompt = `Analyze this cocktail recipe in detail:\n\n`;
    prompt += `**${recipe.name}**\n`;
    prompt += `Category: ${recipe.category}\n`;
    prompt += `Flavor Profile: ${recipe.flavorProfile}\n\n`;

    prompt += `**Ingredients:**\n`;
    recipe.ingredients.forEach(ing => {
      prompt += `- ${ing.amount} ${ing.unit} ${ing.name}\n`;
    });

    prompt += `\n**Instructions:** ${recipe.instructions}\n\n`;

    if (recipe.garnish) {
      prompt += `**Garnish:** ${recipe.garnish}\n\n`;
    }

    prompt += `Please provide analysis on:\n`;
    prompt += `1. Flavor balance and harmony\n`;
    prompt += `2. Ingredient ratios and proportions\n`;
    prompt += `3. Technique recommendations\n`;
    prompt += `4. Potential improvements\n`;
    prompt += `5. Difficulty level assessment\n`;
    prompt += `6. Cost analysis (if possible)\n`;
    prompt += `7. Seasonal appropriateness\n`;

    if (options.focus) {
      prompt += `\nFocus particularly on: ${options.focus}\n`;
    }

    return prompt;
  }

  /**
   * Build variation prompt
   * @param {Object} recipe - Base recipe
   * @param {Object} options - Variation options
   * @returns {string} Variation prompt
   */
  buildVariationPrompt(recipe, options) {
    let prompt = `Create ${options.count || 3} creative variations of this cocktail:\n\n`;
    prompt += `**Base Recipe: ${recipe.name}**\n`;

    recipe.ingredients.forEach(ing => {
      prompt += `- ${ing.amount} ${ing.unit} ${ing.name}\n`;
    });

    prompt += `\nInstructions: ${recipe.instructions}\n\n`;

    prompt += `Create variations that:\n`;
    prompt += `1. Maintain the core character of the original\n`;
    prompt += `2. Use accessible ingredients\n`;
    prompt += `3. Offer different flavor profiles\n`;

    if (options.theme) {
      prompt += `4. Follow the theme: ${options.theme}\n`;
    }

    if (options.season) {
      prompt += `5. Are appropriate for ${options.season}\n`;
    }

    prompt += `\nFor each variation, provide:\n`;
    prompt += `- Name\n`;
    prompt += `- Complete ingredient list with measurements\n`;
    prompt += `- Instructions\n`;
    prompt += `- Brief description of how it differs from the original\n`;

    return prompt;
  }

  /**
   * Build substitution prompt
   * @param {string} ingredient - Ingredient to substitute
   * @param {Object} context - Recipe context
   * @returns {string} Substitution prompt
   */
  buildSubstitutionPrompt(ingredient, context) {
    let prompt = `Suggest substitutions for "${ingredient}" in cocktail making.\n\n`;

    if (context.recipe) {
      prompt += `Context: This ingredient is used in "${context.recipe.name}"\n`;
      prompt += `Recipe type: ${context.recipe.category}\n`;
      prompt += `Flavor profile: ${context.recipe.flavorProfile}\n\n`;
    }

    prompt += `Provide substitutions that:\n`;
    prompt += `1. Maintain similar flavor characteristics\n`;
    prompt += `2. Are commonly available\n`;
    prompt += `3. Work well in the cocktail context\n`;
    prompt += `4. Consider different price points\n\n`;

    prompt += `For each substitution, include:\n`;
    prompt += `- Substitute ingredient name\n`;
    prompt += `- Ratio adjustment (if needed)\n`;
    prompt += `- Flavor impact description\n`;
    prompt += `- Availability/cost notes\n`;

    return prompt;
  }

  /**
   * Build menu optimization prompt
   * @param {Object[]} recipes - Menu recipes
   * @param {Object} constraints - Business constraints
   * @returns {string} Optimization prompt
   */
  buildMenuOptimizationPrompt(recipes, constraints) {
    let prompt = `Analyze and optimize this cocktail menu for profitability and appeal:\n\n`;

    prompt += `**Current Menu:**\n`;
    recipes.forEach((recipe, index) => {
      prompt += `${index + 1}. ${recipe.name} (${recipe.category})\n`;
    });

    prompt += `\n**Business Constraints:**\n`;
    if (constraints.targetCostPercentage) {
      prompt += `- Target cost percentage: ${constraints.targetCostPercentage}%\n`;
    }
    if (constraints.averagePrice) {
      prompt += `- Average drink price: $${constraints.averagePrice}\n`;
    }
    if (constraints.customerType) {
      prompt += `- Customer type: ${constraints.customerType}\n`;
    }
    if (constraints.barType) {
      prompt += `- Bar type: ${constraints.barType}\n`;
    }

    prompt += `\nProvide optimization recommendations for:\n`;
    prompt += `1. Menu balance and variety\n`;
    prompt += `2. Profitability improvements\n`;
    prompt += `3. Ingredient efficiency\n`;
    prompt += `4. Customer appeal\n`;
    prompt += `5. Operational simplicity\n`;
    prompt += `6. Seasonal adjustments\n`;

    return prompt;
  }

  /**
   * Build training prompt
   * @param {string} topic - Training topic
   * @param {Object} options - Training options
   * @returns {string} Training prompt
   */
  buildTrainingPrompt(topic, options) {
    let prompt = `Create comprehensive training content for: "${topic}"\n\n`;

    prompt += `Target audience: ${options.audience || 'Bartenders and bar staff'}\n`;
    prompt += `Experience level: ${options.level || 'Beginner to Intermediate'}\n`;
    prompt += `Training format: ${options.format || 'Written guide with practical exercises'}\n\n`;

    prompt += `Include:\n`;
    prompt += `1. Learning objectives\n`;
    prompt += `2. Key concepts and theory\n`;
    prompt += `3. Step-by-step procedures\n`;
    prompt += `4. Common mistakes to avoid\n`;
    prompt += `5. Practice exercises\n`;
    prompt += `6. Assessment criteria\n`;
    prompt += `7. Additional resources\n`;

    if (options.duration) {
      prompt += `\nTraining duration: ${options.duration}\n`;
    }

    return prompt;
  }

  /**
   * Parse recipe analysis response
   * @param {string} content - AI response content
   * @returns {Object} Parsed analysis
   */
  parseRecipeAnalysis(content) {
    // Simple parsing - in production, consider more sophisticated parsing
    return {
      rawAnalysis: content,
      summary: this.extractSection(content, 'summary'),
      flavorBalance: this.extractSection(content, 'flavor'),
      techniques: this.extractSection(content, 'technique'),
      improvements: this.extractSection(content, 'improvement'),
      difficulty: this.extractDifficulty(content),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse recipe variations response
   * @param {string} content - AI response content
   * @returns {Object[]} Parsed variations
   */
  parseRecipeVariations(content) {
    // Simple parsing - extract variations from numbered lists
    const variations = [];
    const sections = content.split(/\d+\.\s+/).slice(1);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const name = lines[0].replace(/\*\*/g, '').trim();

      variations.push({
        id: `variation_${index + 1}`,
        name,
        description: section,
        parsed: false // Would need more sophisticated parsing for full recipe
      });
    });

    return variations;
  }

  /**
   * Parse substitutions response
   * @param {string} content - AI response content
   * @returns {Object[]} Parsed substitutions
   */
  parseSubstitutions(content) {
    const substitutions = [];
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.includes('-') && line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          substitutions.push({
            ingredient: parts[0].replace('-', '').trim(),
            description: parts[1].trim(),
            confidence: 'medium' // Would need more analysis for confidence scoring
          });
        }
      }
    });

    return substitutions;
  }

  /**
   * Parse menu optimization response
   * @param {string} content - AI response content
   * @returns {Object} Parsed optimization
   */
  parseMenuOptimization(content) {
    return {
      rawAnalysis: content,
      recommendations: this.extractRecommendations(content),
      profitabilityScore: this.extractScore(content, 'profitability'),
      balanceScore: this.extractScore(content, 'balance'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse training content response
   * @param {string} content - AI response content
   * @returns {Object} Parsed training content
   */
  parseTrainingContent(content) {
    return {
      content,
      objectives: this.extractSection(content, 'objective'),
      procedures: this.extractSection(content, 'procedure'),
      exercises: this.extractSection(content, 'exercise'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse comparison response
   * @param {string} content - AI response content
   * @returns {Object} Parsed comparison
   */
  parseComparison(content) {
    try {
      // Try to parse as JSON first
      return JSON.parse(content);
    } catch {
      // Fallback to text parsing
      return {
        rawComparison: content,
        summary: this.extractSection(content, 'summary'),
        winner: this.extractWinner(content)
      };
    }
  }

  /**
   * Extract section from content
   * @param {string} content - Content to search
   * @param {string} sectionType - Type of section to extract
   * @returns {string} Extracted section
   */
  extractSection(content, sectionType) {
    const regex = new RegExp(`${sectionType}[:\\s]+(.*?)(?=\\n\\n|\\n[A-Z]|$)`, 'is');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract difficulty level
   * @param {string} content - Content to analyze
   * @returns {string} Difficulty level
   */
  extractDifficulty(content) {
    const difficultyRegex = /(easy|medium|hard|beginner|intermediate|advanced)/i;
    const match = content.match(difficultyRegex);
    return match ? match[1].toLowerCase() : 'medium';
  }

  /**
   * Extract recommendations
   * @param {string} content - Content to analyze
   * @returns {string[]} Recommendations
   */
  extractRecommendations(content) {
    const recommendations = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      if (line.match(/^\d+\./) || line.match(/^-\s/)) {
        recommendations.push(line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());
      }
    });

    return recommendations;
  }

  /**
   * Extract score from content
   * @param {string} content - Content to analyze
   * @param {string} scoreType - Type of score
   * @returns {number} Extracted score
   */
  extractScore(content, scoreType) {
    const scoreRegex = new RegExp(`${scoreType}[:\\s]+(\\d+(?:\\.\\d+)?)`, 'i');
    const match = content.match(scoreRegex);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Extract winner from comparison
   * @param {string} content - Content to analyze
   * @returns {string} Winner
   */
  extractWinner(content) {
    if (content.toLowerCase().includes('response a') && content.toLowerCase().includes('better')) {
      return 'gemini';
    } else if (content.toLowerCase().includes('response b') && content.toLowerCase().includes('better')) {
      return 'openai';
    }
    return 'tie';
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const mcpOpenAIService = new MCPOpenAIService();
