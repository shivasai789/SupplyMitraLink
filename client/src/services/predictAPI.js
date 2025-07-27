// Prediction API service wrapper
import { getRecommendation, validatePredictionResponse } from '../utils/geminiAPI.js';
import { buildPrompt } from '../utils/buildPrompt.js';

export async function predictStock(formData) {
  try {
    // Build the prompt from form data
    const prompt = buildPrompt(formData);
    
    // Get recommendation from Gemini
    const response = await getRecommendation(prompt);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get prediction');
    }
    
    // Validate the response structure
    const validation = validatePredictionResponse(response.data);
    if (!validation.valid) {
      throw new Error(`Invalid response structure: missing ${validation.missingField}`);
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Prediction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 