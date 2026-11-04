
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateGeminiResponse = async (prompt) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING" },
              priority: { type: "STRING" },
              orderId: {
                type: "STRING",
                nullable: true,
              },
              requestedAction: { type: "STRING" },
              summary: { type: "STRING" },
              language: { type: "STRING" },
              clarificationNeeded: { type: "BOOLEAN" },
              clarificationMessage: { type: "STRING" },
              escalationNeeded: { type: "BOOLEAN" },
              escalationReason: { type: "STRING" },
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
      const errorMessage = error.message || "";
      const isTemporaryError =
        /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(
          errorMessage
        );

      console.error(
        `Gemini API Error (attempt ${attempt}/${maxAttempts}):`,
        errorMessage
      );

      if (!isTemporaryError || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 2000;

      console.log(`Retrying Gemini request in ${delay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = generateGeminiResponse;
