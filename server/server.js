
const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const connectDB = require("./config/db");

const Conversation = require("./models/Conversation");
const SupportTicket = require("./models/SupportTicket");
const generateGeminiResponse = require("./services/geminiService");

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());

// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.send("VaaniOS Backend is running!");
});

// ==========================================
// CHECK GNANI API KEY
// ==========================================

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

// ==========================================
// PRISMA V3 - SPEECH TO TEXT
// ==========================================

app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an audio file.",
      });
    }

    if (!process.env.GNANI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gnani API key is missing.",
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
      console.error("Prisma API Status:", response.status);
      console.error("Prisma API Details:", result);

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

// ==========================================
// TIMBRE V2.5 - TEXT TO SPEECH
// ==========================================

app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      language = "hi-IN",
      voice = "Nalini",
    } = req.body;

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

// ==========================================
// GET ALL CONVERSATIONS
// ==========================================

app.get("/api/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });

  } catch (error) {
    console.error("Fetch Conversations Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
    });
  }
});

// ==========================================
// GET ALL SUPPORT TICKETS
// ==========================================

app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("conversationId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });

  } catch (error) {
    console.error("Fetch Tickets Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets.",
    });
  }
});

// ==========================================
// UPDATE SUPPORT TICKET STATUS
// ==========================================

app.patch("/api/tickets/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Open",
      "In Progress",
      "Resolved",
      "Escalated",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status.",
      });
    }

    // Find and update the support ticket
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    // Keep the linked conversation status synchronized
    if (ticket.conversationId) {
      await Conversation.findByIdAndUpdate(
        ticket.conversationId,
        { status },
        { runValidators: true }
      );
    }

    res.json({
      success: true,
      message: "Ticket and conversation status updated successfully!",
      ticket,
    });

  } catch (error) {
    console.error("Ticket Update Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update ticket status.",
    });
  }
});

// ==========================================
// AI-POWERED CUSTOMER COMPLAINT UNDERSTANDING
// ==========================================

app.post("/api/understand", async (req, res) => {
  try {
    const { transcript } = req.body;

    // Validate transcript
    if (
      !transcript ||
      typeof transcript !== "string" ||
      !transcript.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a customer transcript.",
      });
    }

    // Send customer transcript to Gemini
    const analysis = await generateGeminiResponse(`
      You are an intelligent multilingual AI customer support assistant
      for an Indian e-commerce business.

      Analyze the following customer complaint:

      "${transcript}"

      Extract these fields:

      1. category: Choose one:
         Delayed Order, Refund Request, Return / Exchange,
         Damaged Product, General Inquiry.

      2. priority: Choose only:
         Low, Normal, High, Urgent.

      3. orderId: Extract the order ID if provided.
         Otherwise return null.

      4. requestedAction: Identify what the customer wants.

      5. summary: Write a short summary of the complaint.

      6. language: Detect the customer's language.
         Choose English, Hindi, Punjabi, Hinglish, or Other.

      7. clarificationNeeded: Return true if essential information
         is missing and the customer's request cannot proceed
         without it. For order-specific delivery, refund, or
         return requests, an order ID is generally required.
         Otherwise return false.

      8. clarificationMessage:
         If clarificationNeeded is true, ask the customer for
         the missing information in their detected language.
         If false, return an empty string.

      9. escalationNeeded:
         Return true when:
         - The customer explicitly asks to speak to a human agent.
         - The complaint involves suspected fraud or payment security.
         - The customer reports a serious safety issue.
         - The customer has an unresolved issue requiring human intervention.
         - The complaint is too complex for the AI to handle safely.

         Return false for routine complaints that AI can handle.

      10. escalationReason:
          If escalationNeeded is true, explain briefly why
          human intervention is required.
          If false, return an empty string.

      Important escalation rules:
      - A delayed order alone does not require escalation.
      - Missing order ID alone does not require escalation.
      - High priority does not automatically mean escalation.
      - If the customer explicitly requests a human,
        escalation takes priority over normal AI assistance.

      Priority guidelines:
      - Low: General questions.
      - Normal: Routine requests.
      - High: Delayed orders, refunds, or damaged products.
      - Urgent: Serious complaints requiring immediate attention.

      Examples of clarification messages:

      English: Please share your order ID so I can check your order.

      Hindi: कृपया अपना ऑर्डर आईडी बताएं ताकि मैं आपके ऑर्डर की स्थिति जांच सकूं।

      Hinglish: Please apna order ID share kar dijiye, taaki main status check kar sakun.

      Punjabi: ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਆਰਡਰ ਆਈਡੀ ਸਾਂਝਾ ਕਰੋ ਤਾਂ ਜੋ ਮੈਂ ਸਥਿਤੀ ਦੀ ਜਾਂਚ ਕਰ ਸਕਾਂ।

      Return accurate information based only on the customer's message.
    `);

    // Validate priority against MongoDB enum
    const allowedPriorities = [
      "Low",
      "Normal",
      "High",
      "Urgent",
    ];

    const priority = allowedPriorities.includes(analysis.priority)
      ? analysis.priority
      : "Normal";

    const {
      category,
      orderId,
      requestedAction,
      summary,
      language,
    } = analysis;

    const escalationNeeded = Boolean(analysis.escalationNeeded);
    const clarificationNeeded = Boolean(analysis.clarificationNeeded);

    const escalationReason = escalationNeeded
      ? analysis.escalationReason || "Human support is required."
      : "";

    const clarificationMessage = clarificationNeeded
      ? analysis.clarificationMessage || ""
      : "";

    // Generate customer-facing response
    let response = "";

    if (escalationNeeded) {
      response =
        "Your concern requires assistance from our human support team. " +
        "I'm escalating your request to a support agent.";
    } else if (clarificationNeeded && clarificationMessage) {
      response = clarificationMessage;
    } else {
      response =
        `Thank you for contacting us. I understand your concern regarding ${category.toLowerCase()}. I'm here to help you with the next steps.`;
    }

    // Determine initial status
    const initialStatus = escalationNeeded
      ? "Escalated"
      : "Open";

    // Save conversation in MongoDB
    const conversation = await Conversation.create({
      transcript: transcript.trim(),
      category,
      priority,
      language,
      response,
      status: initialStatus,
    });

    // Create support ticket in MongoDB
    const ticket = await SupportTicket.create({
      orderId,
      category,
      priority,
      description: transcript.trim(),
      requestedAction,
      escalationReason,
      conversationId: conversation._id,
      status: initialStatus,
    });

    res.json({
      success: true,

      analysis: {
        category,
        priority,
        orderId,
        requestedAction,
        summary,
        language,
        clarificationNeeded,
        clarificationMessage,
        escalationNeeded,
        escalationReason,
      },

      response,
      conversationId: conversation._id,
      ticketId: ticket._id,

      message:
        "AI analysis completed and support ticket saved successfully!",
    });

  } catch (error) {
    console.error(
      "AI Complaint Understanding Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Could not process the customer complaint.",
    });
  }
});


const PORT = 5001;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`VaaniOS server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
