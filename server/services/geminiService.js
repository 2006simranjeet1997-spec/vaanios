
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateGeminiResponse = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: {
              type: "STRING",
            },
            priority: {
              type: "STRING",
            },
            orderId: {
              type: "STRING",
              nullable: true,
            },
            requestedAction: {
              type: "STRING",
            },
            summary: {
              type: "STRING",
            },
            language: {
              type: "STRING",
            },
            clarificationNeeded: {
              type: "BOOLEAN",
            },
            clarificationMessage: {
              type: "STRING",
            },
            escalationNeeded: {
              type: "BOOLEAN",
            },
            escalationReason: {
              type: "STRING",
            },
          },
          required: [
            "category",
            "priority",
            "orderId",
            "requestedAction",
            "summary",
            "language",
            "clarificationNeeded",
            "clarificationMessage",
            "escalationNeeded",
            "escalationReason",
          ],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw error;
  }
};

module.exports = generateGeminiResponse;
