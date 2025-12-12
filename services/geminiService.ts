import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBattlePlan = async (): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a realistic, short, top-secret military battle plan text. It should sound urgent and contain tactical coordinates and codewords. Keep it under 50 words.",
    });
    return response.text || "Operation Silent Storm: Advance to coordinates 34.55, 12.33 at 0400 hours. Maintain radio silence. Target extraction confirmed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Operation Fallback: Unable to contact HQ. Proceed to secondary extraction point immediately.";
  }
};

export const analyzeCoverImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getClient();
    // Remove header if present for API
    const cleanBase64 = base64Image.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Is this image innocent enough to be used as a cover for steganography? Reply with a short sentence describing why it is a good or bad camouflage."
          }
        ]
      }
    });
    return response.text || "Analysis complete: Image appears suitable for covert operations.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analysis failed: Proceed with caution.";
  }
};
