
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

        contents: `
You are VaaniOS, a professional multilingual customer support assistant.

Analyze the customer's complaint and generate a helpful, empathetic response.

CUSTOMER COMPLAINT:
${prompt}

IMPORTANT INSTRUCTIONS:

1. Understand the customer's actual problem.
2. Write a polite, empathetic and concise response.
3. Respond in the same language as the complaint whenever possible.
4. Explain the next appropriate support action.
5. Never claim that a refund, replacement or delivery has already been completed.
6. Never invent order details or make false promises.
7. Extract order and payment details only when explicitly provided.
8. Set escalationNeeded to true when:
   - The customer explicitly asks to speak with a human agent.
   - The customer requests human support.
   - The issue requires human intervention.
9. When escalationNeeded is true, provide a clear escalationReason.
10. Set clarificationNeeded to true when essential information is missing.
11. Keep the customer-facing response natural and easy to understand.
12. Return valid JSON matching the required schema.
        `,

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: "OBJECT",

            properties: {
              category: { type: "STRING" },
              priority: { type: "STRING" },
              orderId: { type: "STRING", nullable: true },
              transactionId: { type: "STRING", nullable: true },
              paymentMethod: { type: "STRING" },
              paymentTime: { type: "STRING" },
              requestedAction: { type: "STRING" },
              summary: { type: "STRING" },
              language: { type: "STRING" },
              clarificationNeeded: { type: "BOOLEAN" },
              clarificationMessage: { type: "STRING" },
              escalationNeeded: { type: "BOOLEAN" },
              escalationReason: { type: "STRING" },
              response: { type: "STRING" },
            },

            required: [
              "category",
              "priority",
              "orderId",
              "transactionId",
              "paymentMethod",
              "paymentTime",
              "requestedAction",
              "summary",
              "language",
              "clarificationNeeded",
              "clarificationMessage",
              "escalationNeeded",
              "escalationReason",
              "response",
            ],
          },
        },
      });

      if (!response.text) {
        throw new Error("Gemini returned an empty response.");
      }

      const result = JSON.parse(response.text);

      if (
        typeof result.response !== "string" ||
        !result.response.trim()
      ) {
        throw new Error(
          "Gemini did not generate a customer response."
        );
      }

      return result;

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

      console.log(
        `Retrying Gemini request in ${delay / 1000} seconds...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw new Error(
    "Gemini request failed after all retry attempts."
  );
};

module.exports = generateGeminiResponse;
n