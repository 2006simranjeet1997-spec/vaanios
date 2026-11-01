
const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());

// Backend health check
app.get("/", (req, res) => {
  res.send("VaaniOS Backend is running!");
});

// Check Gnani API key
app.get("/api/config-check", (req, res) => {
  const isConfigured = Boolean(process.env.GNANI_API_KEY);

  res.json({
    success: true,
    gnaniApiKeyConfigured: isConfigured,
    message: isConfigured
      ? "Gnani API key loaded successfully!"
      : "Gnani API key is missing.",
  });
});

// Prisma V3 - Speech to Text
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an audio file.",
      });
    }

    const formData = new FormData();

    const audioBlob = new Blob([req.file.buffer], {
      type: req.file.mimetype || "audio/wav",
    });

    formData.append("audio_file", audioBlob, req.file.originalname);
    formData.append("model", "prisma-v3.0");
    formData.append("language_code", "indic-auto");

    const response = await fetch(
      "https://api.vachana.ai/stt/v3",
      {
        method: "POST",
        headers: {
          "X-API-Key-ID": process.env.GNANI_API_KEY,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.log("Prisma API Status:", response.status);
      console.log("Prisma API Details:", result);

      return res.status(response.status).json({
        success: false,
        message: "Gnani Prisma request failed.",
        details: result,
      });
    }

    res.json(result);

  } catch (error) {
    console.error("Prisma STT Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Speech-to-text processing failed.",
    });
  }
});

// Timbre V2.5 - Text to Speech
app.post("/api/tts", async (req, res) => {
  try {
    const { text, language = "hi-IN", voice = "Nalini" } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide text to convert into speech.",
      });
    }

    if (!process.env.GNANI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gnani API key is missing.",
      });
    }

    // Prepare Timbre request
    const payload = {
      text: text.trim(),
      voice,
      model: "timbre-v2.5",
      language,
      speed: 1.0,
      audio_config: {
        sample_rate: 48000,
        num_channels: 1,
        sample_width: 2,
        encoding: "linear_pcm",
        container: "wav",
      },
    };

    // Send request to Gnani Timbre
    const response = await fetch(
      "https://api.vachana.ai/api/v1/tts/inference",
      {
        method: "POST",
        headers: {
          "X-API-Key-ID": process.env.GNANI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();

      console.error("Timbre API Status:", response.status);
      console.error("Timbre API Details:", errorText);

      return res.status(response.status).json({
        success: false,
        message: "Gnani Timbre request failed.",
        details: errorText,
      });
    }

    // Timbre returns binary audio
    const audioBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.length,
    });

    res.send(audioBuffer);

  } catch (error) {
    console.error("Timbre TTS Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Text-to-speech processing failed.",
    });
  }
});

  
// VaaniOS - Customer Complaint Understanding Engine
app.post("/api/understand", (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a customer transcript.",
      });
    }

    const text = transcript.toLowerCase();

    // Extract order ID
    const orderMatch = transcript.match(
    /\border\s*(?:id|number|no)\s*[:#-]?\s*([A-Z0-9-]{4,})\b/i
    );

    const orderId = orderMatch ? orderMatch[1] : null;

    // Identify complaint category
    let category = "General Inquiry";
    let priority = "Normal";
    let requestedAction = "Customer assistance";

    if (
      /delay|late|not\s+(?:been\s+)?delivered|hasn't\s+arrived|has not arrived|deliver nahi|nahi aaya|नहीं आया/i.test(text)
    ) {
      category = "Delayed Order";
      priority = "High";
      requestedAction = "Check delivery status";
    } else if (
      text.includes("refund") ||
      text.includes("money back") ||
      text.includes("paisa wapas") ||
      text.includes("पैसे वापस")
    ) {
      category = "Refund Request";
      priority = "High";
      requestedAction = "Check refund status";
    } else if (
      text.includes("return") ||
      text.includes("exchange") ||
      text.includes("wapas karna")
    ) {
      category = "Return / Exchange";
      requestedAction = "Assist with return or exchange";
    } else if (
      text.includes("damaged") ||
      text.includes("broken") ||
      text.includes("toota") ||
      text.includes("खराब")
    ) {
      category = "Damaged Product";
      priority = "High";
      requestedAction = "Arrange product issue review";
    }

    // Generate a customer support response
    let response = "";

    switch (category) {
      case "Delayed Order":
        response =
          "I'm sorry your order has been delayed. I understand how frustrating this can be. Let me help you check its delivery status.";
        break;

      case "Refund Request":
        response =
          "I'm sorry for the inconvenience. I can help you with your refund request. Let me check the details.";
        break;

      case "Return / Exchange":
        response =
          "I'd be happy to help you with your return or exchange. Let me guide you through the next steps.";
        break;

      case "Damaged Product":
        response =
          "I'm sorry your product arrived damaged. I understand your concern. Let me help you raise a complaint.";
        break;

      default:
        response =
          "Thank you for contacting us. I'm here to help you. Could you please share a few more details about your concern?";
    }

    // Generate conversation summary
    const summary =
      `Customer issue: ${category}. ` +
      `Priority: ${priority}. ` +
      `Order ID: ${orderId || "Not provided"}. ` +
      `Requested action: ${requestedAction}.`;

    res.json({
      success: true,
      analysis: {
        category,
        priority,
        orderId,
        requestedAction,
        summary,
      },
      response,
    });

  } catch (error) {
    console.error("Complaint Understanding Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not process the customer complaint.",
    });
  }
});


const PORT = 5001;

app.listen(PORT, () => {
  console.log(`VaaniOS server running on port ${PORT}`);
});
