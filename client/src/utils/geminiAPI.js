// Gemini API integration for stock prediction
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function cleanAndParseJSON(rawText) {
  try {
    let cleanedText = rawText.trim();
    
    // Remove markdown code block wrappers
    cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '');
    cleanedText = cleanedText.replace(/\n?```\s*$/i, '');
    cleanedText = cleanedText.trim();
    
    // Extract JSON object if wrapped in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanedText);
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError);
    console.error('Raw text:', rawText);
    return { 
      success: false, 
      error: parseError.message, 
      raw: rawText,
      cleaned: cleanedText 
    };
  }
}

export async function getRecommendation(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const rawText = data.candidates[0].content.parts[0].text;
    const parseResult = cleanAndParseJSON(rawText);
    
    if (parseResult.success) {
      return { success: true, data: parseResult.data };
    } else {
      return { 
        success: false, 
        error: 'Failed to parse JSON response',
        details: parseResult.error,
        raw: parseResult.raw 
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export function validatePredictionResponse(data) {
  const requiredFields = [
    'suggested_stock',
    'estimated_customers', 
    'daily_tip',
    'product_demand_forecast'
  ];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, missingField: field };
    }
  }
  
  return { valid: true };
} 