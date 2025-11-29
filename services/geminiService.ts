import { GoogleGenAI } from "@google/genai";

// Initialize the API client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdminContent = async (prompt: string, context: string = ''): Promise<string> => {
  try {
    const fullPrompt = `
      You are an expert School Administrator Assistant for a prestigious secondary school.
      Your tone should be professional, encouraging, and clear.
      
      Context: ${context}
      
      Task: ${prompt}
      
      Keep the response concise and formatted for a web UI.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI assistant.";
  }
};

export const suggestHousePointReason = async (houseName: string): Promise<string[]> => {
  try {
    const prompt = `Generate 3 creative and specific reasons for awarding points to the student house "${houseName}". 
    Focus on areas like: Community Service, Academic Excellence, Sportsmanship, or Environmental Care.
    Return ONLY a JSON array of strings.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["Community Cleanup Participation", "Winning Inter-house Debate", "Example of Honesty"];
  }
}
