import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getFinancialAdvice(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are Wealth Wizard, a friendly and expert financial advisor. Provide concise, actionable advice based on the user's financial queries. Focus on helping them maximize returns and minimize fees.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my magic crystal ball right now. Please try again later!";
  }
}
