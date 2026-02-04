import { ChatOpenAI } from "@langchain/openai";
import { RecipeNutrition } from "./recipe";

/**
 * Settings required for AI service operations
 */
export interface AISettings {
  apiKey: string;
  model: string;
}

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Generate nutritional facts for a recipe using AI
 * 
 * @param ingredients - Array of ingredient strings (e.g., ["1 cup flour", "2 eggs"])
 * @param servingSize - Serving size in grams. If > 0, calculates per serving. Otherwise calculates per 100g.
 * @param settings - AI settings containing API key and model name
 * @returns Promise<RecipeNutrition> - Complete nutrition facts object
 * @throws {AIServiceError} - If AI call fails or response is invalid
 */
export async function generateNutritionFacts(
  ingredients: string[],
  servingSize: number,
  settings: AISettings
): Promise<RecipeNutrition> {
  if (!settings.apiKey || !settings.model) {
    throw new AIServiceError("AI settings are not configured. API key and model name are required.");
  }

  if (!ingredients || ingredients.length === 0) {
    throw new AIServiceError("No ingredients provided for nutrition calculation.");
  }

  try {
    const llm = new ChatOpenAI({
      model: settings.model,
      apiKey: settings.apiKey,
      streaming: false,
    });

    const basisInstruction = servingSize > 0 
      ? `Calculate per serving (serving size: ${servingSize}g).`
      : "Calculate per 100g.";

    const prompt = `Calculate complete nutritional facts for this recipe. 
Ingredients: 
${ingredients.map((ing, idx) => `${idx + 1}. ${ing}`).join('\n')}

${basisInstruction}

Return ONLY valid JSON with these exact fields (all numeric values):
{
  "servingSize": ${servingSize > 0 ? servingSize : 100},
  "calories": 0,
  "totalFat": 0,
  "saturatedFat": 0,
  "transFat": 0,
  "unsaturatedFat": 0,
  "cholesterol": 0,
  "sodium": 0,
  "carbohydrates": 0,
  "fiber": 0,
  "sugar": 0,
  "protein": 0
}

Do not include any explanations or markdown formatting. Return only the JSON object.`;

    const response = await llm.invoke(prompt);
    const content = response.content.toString().trim();
    
    // Extract JSON from response (in case AI adds markdown formatting)
    let jsonContent = content;
    if (content.includes('```json')) {
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        jsonContent = match[1];
      }
    } else if (content.includes('```')) {
      const match = content.match(/```\n([\s\S]*?)\n```/);
      if (match) {
        jsonContent = match[1];
      }
    }

    // Parse the JSON response
    let nutritionData: any;
    try {
      nutritionData = JSON.parse(jsonContent);
    } catch (parseError) {
      throw new AIServiceError(
        "Failed to parse AI response as JSON. Please try again.",
        parseError
      );
    }

    // Validate all required fields are present
    const requiredFields = [
      'servingSize', 'calories', 'totalFat', 'saturatedFat', 
      'transFat', 'unsaturatedFat', 'cholesterol', 'sodium', 
      'carbohydrates', 'fiber', 'sugar', 'protein'
    ];

    const missingFields = requiredFields.filter(field => 
      typeof nutritionData[field] !== 'number'
    );

    if (missingFields.length > 0) {
      throw new AIServiceError(
        `AI response is missing required nutrition fields: ${missingFields.join(', ')}`
      );
    }

    // Create and return RecipeNutrition object
    return new RecipeNutrition(
      nutritionData.servingSize,
      nutritionData.calories,
      nutritionData.totalFat,
      nutritionData.saturatedFat,
      nutritionData.unsaturatedFat,
      nutritionData.transFat,
      nutritionData.carbohydrates,
      nutritionData.sugar,
      nutritionData.cholesterol,
      nutritionData.sodium,
      nutritionData.protein,
      nutritionData.fiber
    );
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    
    throw new AIServiceError(
      "Failed to generate nutrition facts. Please check your AI configuration and try again.",
      error
    );
  }
}
