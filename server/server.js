
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/db");

const Conversation = require("./models/Conversation");
const SupportTicket = require("./models/SupportTicket");
const Notification = require("./models/Notification");
const AppSettings = require("./models/AppSettings");
const generateGeminiResponse = require("./services/geminiService");

const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

console.log("authRoutes:", typeof authRoutes);
console.log("protect:", typeof protect);

app.use("/api/auth", authRoutes);

// Protect all remaining API routes
app.use("/api", protect);

// ==========================================
// NOTIFICATION HELPER
// ==========================================

const createNotification = async ({
  title,
  message,
  type,
  ticketId = null,
}) => {
  try {
    const settings = await AppSettings.findOne();

    const preferences = settings?.notificationPreferences || {
      newTicket: true,
      highPriority: true,
      escalation: true,
      statusUpdate: true,
    };

    const preferenceMap = {
      "New Ticket": "newTicket",
      "High Priority": "highPriority",
      Escalation: "escalation",
      "Status Update": "statusUpdate",
    };

    const preferenceKey = preferenceMap[type];

    if (preferenceKey && preferences[preferenceKey] === false) {
      console.log(`Notification disabled: ${type}`);
      return null;
    }

    return await Notification.create({
      title,
      message,
      type,
      ticketId,
    });
  } catch (error) {
    console.error("Notification Creation Error:", error.message);
    return null;
  }
};

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

    const response = await fetch("https://api.vachana.ai/stt/v3", {
      method: "POST",
      headers: {
        "X-API-Key-ID": process.env.GNANI_API_KEY,
      },
      body: formData,
    });

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

    const audioBuffer = Buffer.from(await response.arrayBuffer());

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
// GET APP SETTINGS
// ==========================================

app.get("/api/settings", async (req, res) => {
  try {
    const settings = await AppSettings.findOneAndUpdate(
      {},
      { $setOnInsert: {} },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Fetch Settings Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch settings.",
    });
  }
});

// ==========================================
// UPDATE APP SETTINGS
// ==========================================

app.put("/api/settings", async (req, res) => {
  try {
    const { notificationPreferences } = req.body;

    if (
      !notificationPreferences ||
      typeof notificationPreferences !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification preferences.",
      });
    }

    const allowedKeys = [
      "newTicket",
      "highPriority",
      "escalation",
      "statusUpdate",
    ];

    for (const key of allowedKeys) {
      if (typeof notificationPreferences[key] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${key}.`,
        });
      }
    }

    const settings = await AppSettings.findOneAndUpdate(
      {},
      {
        $set: {
          notificationPreferences,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Notification preferences saved successfully.",
      settings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update settings.",
    });
  }
});

// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({
      createdAt: -1,
    });

    const unreadCount = await Notification.countDocuments({
      isRead: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
});

// ==========================================
// MARK SINGLE NOTIFICATION AS READ
// ==========================================

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { returnDocument: "after" }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not update notification.",
    });
  }
});

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================

app.patch("/api/notifications/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not update notifications.",
    });
  }
});

// ==========================================
// GET ALL CONVERSATIONS
// ==========================================

app.get("/api/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({
      createdAt: -1,
    });

    const updatedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const ticket = await SupportTicket.findOne({
          conversationId: conversation._id,
        }).select("customerName");

        const data = conversation.toObject();

        if (
          (!data.customerName || data.customerName === "Guest") &&
          ticket?.customerName
        ) {
          data.customerName = ticket.customerName;
        }

        return data;
      })
    );

    res.json({
      success: true,
      count: updatedConversations.length,
      conversations: updatedConversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
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

    const existingTicket = await SupportTicket.findById(req.params.id);

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    const previousStatus = existingTicket.status;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (ticket.conversationId) {
      await Conversation.findByIdAndUpdate(
        ticket.conversationId,
        { status },
        { runValidators: true }
      );
    }

    if (previousStatus !== status) {
      const isEscalated = status === "Escalated";

      await createNotification({
        title: isEscalated
          ? "Ticket Escalated"
          : "Ticket Status Updated",
        message: `Ticket for ${ticket.customerName} changed from ${previousStatus} to ${status}.`,
        type: isEscalated ? "Escalation" : "Status Update",
        ticketId: ticket._id,
      });
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
    console.log("UNDERSTAND API ROUTE HIT");

    const { transcript, customerName } = req.body;

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

    const normalizedCustomerName =
      typeof customerName === "string" && customerName.trim()
        ? customerName.trim()
        : "Guest";

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
         without it.

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

    const initialStatus = escalationNeeded
      ? "Escalated"
      : "Open";

    // Save conversation
    const conversation = await Conversation.create({
      customerName: normalizedCustomerName,
      transcript: transcript.trim(),
      category,
      priority,
      language,
      response,
      status: initialStatus,
    });

    // Automatically create support ticket
    const ticket = await SupportTicket.create({
      customerName: normalizedCustomerName,
      orderId,
      category,
      priority,
      description: transcript.trim(),
      requestedAction,
      escalationReason,
      conversationId: conversation._id,
      status: initialStatus,
    });

    // ==========================================
    // AUTOMATIC NOTIFICATIONS
    // ==========================================

    await createNotification({
      title: "New Support Ticket",
      message: `A new ticket has been created for ${normalizedCustomerName}.`,
      type: "New Ticket",
      ticketId: ticket._id,
    });

    if (priority === "High" || priority === "Urgent") {
      await createNotification({
        title: `${priority} Priority Complaint`,
        message: `${normalizedCustomerName} has submitted a ${priority.toLowerCase()} priority complaint.`,
        type: "High Priority",
        ticketId: ticket._id,
      });
    }

    if (escalationNeeded) {
      await createNotification({
        title: "Complaint Escalated",
        message: `A complaint from ${normalizedCustomerName} requires human support. Reason: ${escalationReason}`,
        type: "Escalation",
        ticketId: ticket._id,
      });
    }

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
    console.error("AI Complaint Understanding Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not process the customer complaint.",
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5001;

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
