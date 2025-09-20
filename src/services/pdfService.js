/**
 * PDF Processing Service for Recipe Book Extraction
 * Handles PDF file upload, text extraction, and recipe parsing
 * Enhanced with intelligent recipe parsing and standardization
 */

import { parseRecipesWithIntelligence } from './enhancedRecipeParser';
import { geminiService } from './geminiService';

/**
 * Extract text from PDF file using PDF.js
 */
export const extractTextFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Dynamically import PDF.js
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = e.target.result;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const totalPages = pdf.numPages;

        // Extract text from each page
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');

          fullText += `${pageText  }\n\n`;

          // Report progress
          if (window.pdfProgressCallback) {
            window.pdfProgressCallback({
              currentPage: pageNum,
              totalPages,
              progress: Math.round((pageNum / totalPages) * 100)
            });
          }
        }

        resolve({
          text: fullText,
          totalPages,
          success: true
        });

      } catch (error) {
        reject({
          error: error.message,
          success: false
        });
      }
    };

    reader.onerror = () => {
      reject({
        error: 'Failed to read PDF file',
        success: false
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse extracted text into structured recipe data using enhanced AI intelligence
 */
export const parseRecipesFromText = async (text, progressCallback) => {
  try {
    // Use enhanced recipe parser with intelligence features
    const result = await parseRecipesWithIntelligence(text, progressCallback);

    if (result.success) {
      return {
        recipes: result.recipes,
        success: true,
        totalFound: result.totalFound,
        qualityScore: result.qualityScore
      };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    // Fallback to basic parsing if enhanced parsing fails
    console.warn('Enhanced parsing failed, falling back to basic parsing:', error);
    return await parseRecipesFromTextBasic(text, progressCallback);
  }
};

/**
 * Basic recipe parsing (fallback method)
 */
const parseRecipesFromTextBasic = async (text, progressCallback) => {
  try {
    // Split text into chunks to avoid token limits
    const chunks = splitTextIntoChunks(text, 4000);
    const allRecipes = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Create AI prompt for recipe extraction
      const prompt = `
        Extract cocktail recipes from the following text. Return a JSON array of recipes with this exact structure:

        [
          {
            "name": "Recipe Name",
            "version": "Classic/House/etc",
            "category": "Whiskey/Gin/Rum/Vodka/Tequila/Other",
            "ingredients": [
              {
                "name": "Ingredient Name",
                "amount": "2",
                "unit": "oz"
              }
            ],
            "instructions": "Step by step instructions",
            "glassware": "Glass type",
            "garnish": "Garnish description",
            "flavorProfile": ["strong", "sweet", "sour", "bitter"],
            "difficulty": "Easy/Medium/Hard",
            "prepTime": 3,
            "source": "PDF Import",
            "notes": "Any additional notes"
          }
        ]

        Only extract complete recipes with ingredients and instructions. Skip incomplete entries.

        Text to analyze:
        ${chunk}
      `;

      const response = await geminiService.generate(
        localStorage.getItem('geminiApiKey') || '',
        prompt,
        false
      );

      try {
        // Parse AI response as JSON
        const chunkRecipes = JSON.parse(response);
        if (Array.isArray(chunkRecipes)) {
          allRecipes.push(...chunkRecipes);
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON:', parseError);
        // Try to extract JSON from response if it's wrapped in text
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const extractedRecipes = JSON.parse(jsonMatch[0]);
            if (Array.isArray(extractedRecipes)) {
              allRecipes.push(...extractedRecipes);
            }
          } catch (secondParseError) {
            console.warn('Failed to extract JSON from AI response');
          }
        }
      }

      // Report progress
      if (progressCallback) {
        progressCallback({
          currentChunk: i + 1,
          totalChunks: chunks.length,
          progress: Math.round(((i + 1) / chunks.length) * 100),
          recipesFound: allRecipes.length
        });
      }
    }

    // Add metadata to recipes
    const processedRecipes = allRecipes.map(recipe => ({
      ...recipe,
      id: generateRecipeId(),
      isOriginalVersion: true,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      yields: 1
    }));

    return {
      recipes: processedRecipes,
      success: true,
      totalFound: processedRecipes.length,
      qualityScore: 75 // Default quality score for basic parsing
    };

  } catch (error) {
    return {
      error: error.message,
      success: false,
      recipes: []
    };
  }
};

/**
 * Split text into manageable chunks for AI processing
 */
const splitTextIntoChunks = (text, maxChunkSize) => {
  const chunks = [];
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + word).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = `${word  } `;
    } else {
      currentChunk += `${word  } `;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Generate unique recipe ID
 */
const generateRecipeId = () => {
  return `recipe_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate PDF file
 */
export const validatePDFFile = (file) => {
  const errors = [];

  // Check file type
  if (file.type !== 'application/pdf') {
    errors.push('File must be a PDF');
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 50MB');
  }

  // Check file name
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('File must have .pdf extension');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Process complete PDF workflow
 */
export const processPDFRecipeBook = async (file, progressCallback) => {
  try {
    // Validate file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Set up progress tracking
    window.pdfProgressCallback = (progress) => {
      if (progressCallback) {
        progressCallback({
          stage: 'extracting',
          ...progress
        });
      }
    };

    // Extract text from PDF
    const extractionResult = await extractTextFromPDF(file);

    if (!extractionResult.success) {
      throw new Error(extractionResult.error);
    }

    // Parse recipes from text
    const parsingResult = await parseRecipesFromText(
      extractionResult.text,
      (progress) => {
        if (progressCallback) {
          progressCallback({
            stage: 'parsing',
            ...progress
          });
        }
      }
    );

    // Clean up
    window.pdfProgressCallback = null;

    return {
      success: true,
      recipes: parsingResult.recipes,
      totalPages: extractionResult.totalPages,
      totalRecipes: parsingResult.totalFound,
      qualityScore: parsingResult.qualityScore || 75,
      message: `Successfully extracted ${parsingResult.totalFound} recipes from ${extractionResult.totalPages} pages with ${parsingResult.qualityScore || 75}% quality score`
    };

  } catch (error) {
    // Clean up
    window.pdfProgressCallback = null;

    // Normalize error message whether we caught an Error or a plain object
    const message = (error && typeof error === 'object' && 'error' in error)
      ? error.error
      : (error && error.message) || String(error);

    return {
      success: false,
      error: message,
      recipes: []
    };
  }
};
