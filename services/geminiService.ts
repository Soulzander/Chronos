
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API client according to guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Suggests an emoji icon for a task title using Gemini AI
 */
export async function suggestTaskIcon(taskTitle: string): Promise<string> {
  // Guidelines state API_KEY is pre-configured and hard requirement
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a single emoji icon that best represents the task: "${taskTitle}". Return only the emoji character and nothing else.`,
      config: {
        maxOutputTokens: 10,
        temperature: 0.5,
      }
    });
    
    // Use .text property directly as per guidelines
    return response.text?.trim() || '📝';
  } catch (error) {
    console.error("Gemini Icon Suggestion Error:", error);
    return '📝';
  }
}
