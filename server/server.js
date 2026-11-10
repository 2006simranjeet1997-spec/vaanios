const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const ffmpeg = require("fluent-ffmpeg");
const { Readable } = require("stream");
const fs = require("fs");
const os = require("os");
const path = require("path");

const connectDB = require("./config/db");

const Admin = require("./models/Admin");
const Customer = require("./models/Customer");
const Conversation = require("./models/Conversation");
const SupportTicket = require("./models/SupportTicket");
const Notification = require("./models/Notification");
const AppSettings = require("./models/AppSettings");

const generateGeminiResponse = require("./services/geminiService");

const authRoutes = require("./routes/authRoutes");
const customerAuthRoutes = require("./routes/customerAuthRoutes");

const protect = require("./middleware/authMiddleware");
const protectCustomer = require("./middleware/customerAuthMiddleware");

const app = express();
const server = http.createServer(app);

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ==========================================
// CHAT MESSAGE MODEL
// ==========================================

const chatMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["admin", "customer"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
  },
  { timestamps: true }
);

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.send("VaaniOS Backend is running!");
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/customer-auth", customerAuthRoutes);

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
      return null;
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      ticketId,
    });

    io.to("admins").emit("notification:new", notification);

    return notification;
  } catch (error) {
    console.error("Notification Creation Error:", error.message);
    return null;
  }
};

// ==========================================
// CUSTOMER ROUTES
// ==========================================

app.use("/api/customer", protectCustomer);

// GET CUSTOMER PROFILE
app.get("/api/customer/profile", async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select(
      "-passwordHash"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found.",
      });
    }

    res.json({ success: true, customer });
  } catch (error) {
    console.error("Customer Profile Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer profile.",
    });
  }
});

// CUSTOMER DASHBOARD
app.get("/api/customer/dashboard", async (req, res) => {
  try {
    const customerId = req.customer.id;

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets,
    ] = await Promise.all([
      SupportTicket.countDocuments({ customerId }),
      SupportTicket.countDocuments({ customerId, status: "Open" }),
      SupportTicket.countDocuments({
        customerId,
        status: "In Progress",
      }),
      SupportTicket.countDocuments({
        customerId,
        status: "Resolved",
      }),
      SupportTicket.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("conversationId"),
    ]);

    res.json({
      success: true,
      summary: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
      },
      recentTickets,
    });
  } catch (error) {
    console.error("Customer Dashboard Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to load customer dashboard.",
    });
  }
});

// CUSTOMER TICKETS
app.get("/api/customer/tickets", async (req, res) => {
  try {
    const tickets = await SupportTicket.find({
      customerId: req.customer.id,
    })
      .populate("conversationId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Customer Tickets Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets.",
    });
  }
});

// CUSTOMER CONVERSATIONS
app.get("/api/customer/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      customerId: req.customer.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Customer Conversations Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
    });
  }
});

// ==========================================
// CUSTOMER SPEECH TO TEXT
// ==========================================



app.post(
  "/api/customer/stt",
  upload.single("audio"),
  async (req, res) => {
    let inputPath;
    let outputPath;

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

      inputPath = path.join(
        os.tmpdir(),
        `vaanios-${Date.now()}.webm`
      );

      outputPath = path.join(
        os.tmpdir(),
        `vaanios-${Date.now()}.wav`
      );

      fs.writeFileSync(inputPath, req.file.buffer);

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat("wav")
          .audioCodec("pcm_s16le")
          .audioFrequency(16000)
          .audioChannels(1)
          .on("end", resolve)
          .on("error", reject)
          .save(outputPath);
      });

      const wavBuffer = fs.readFileSync(outputPath);

      console.log("Converted WAV size:", wavBuffer.length);

      const formData = new FormData();

      const audioBlob = new Blob([wavBuffer], {
        type: "audio/wav",
      });

      formData.append(
        "audio_file",
        audioBlob,
        "customer-recording.wav"
      );

      formData.append("model", "prisma-v3.0");
      formData.append("language_code", "indic-auto");

      const gnaniResponse = await fetch(
        "https://api.vachana.ai/stt/v3",
        {
          method: "POST",
          headers: {
            "X-API-Key-ID": process.env.GNANI_API_KEY,
          },
          body: formData,
        }
      );

      const responseBody = await gnaniResponse.text();

      console.log("GNANI STT STATUS:", gnaniResponse.status);
      console.log("GNANI STT RESPONSE:", responseBody);

      if (!gnaniResponse.ok) {
        return res.status(gnaniResponse.status).json({
          success: false,
          message: "Gnani Prisma request failed.",
          details: responseBody,
        });
      }

      let result;

      try {
        result = JSON.parse(responseBody);
      } catch {
        return res.status(502).json({
          success: false,
          message: "Unexpected response from Gnani.",
          details: responseBody,
        });
      }

      return res.json(result);
    } catch (error) {
      console.error("Customer STT Error:", error);

      return res.status(500).json({
        success: false,
        message: "Speech-to-text processing failed.",
        details: error.message,
      });
    } finally {
      if (inputPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      if (outputPath && fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }
  }
);



// ==========================================
// CUSTOMER TEXT TO SPEECH
// ==========================================


app.post("/api/customer/tts", async (req, res) => {
  try {
    const {
      text,
      language = "hi-IN",
      voice = "Nalini",
    } = req.body;

    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid text of up to 3000 characters.",
      });
    }

    if (!process.env.GNANI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gnani API key is missing.",
      });
    }

    const gnaniResponse = await fetch(
      "https://api.vachana.ai/api/v1/tts/inference",
      {
        method: "POST",
        headers: {
          "X-API-Key-ID": process.env.GNANI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!gnaniResponse.ok) {
      const errorText = await gnaniResponse.text();

      console.error("Gnani TTS Error:", {
        status: gnaniResponse.status,
        response: errorText,
      });

      return res.status(gnaniResponse.status).json({
        success: false,
        message: "Gnani Timbre voice generation failed.",
        details: errorText,
      });
    }

    const contentType =
      gnaniResponse.headers.get("content-type") || "";

    if (
      contentType.includes("application/json") ||
      contentType.includes("text/")
    ) {
      const responseText = await gnaniResponse.text();

      console.error("Unexpected Gnani TTS response:", responseText);

      return res.status(502).json({
        success: false,
        message: "Gnani returned text instead of audio.",
      });
    }

    const audioBuffer = Buffer.from(
      await gnaniResponse.arrayBuffer()
    );

    if (!audioBuffer.length) {
      return res.status(502).json({
        success: false,
        message: "Gnani returned an empty audio response.",
      });
    }

    res.set({
      "Content-Type": contentType || "audio/wav",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "no-store",
    });

    return res.send(audioBuffer);

  } catch (error) {
    console.error("Customer TTS Error:", error);

    return res.status(500).json({
      success: false,
      message: "Text-to-speech processing failed.",
    });
  }
});

// ==========================================
// CUSTOMER COMPLAINT UNDERSTANDING
// ==========================================


const understandComplaint = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (
      typeof transcript !== "string" ||
      !transcript.trim() ||
      transcript.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid complaint transcript.",
      });
    }

    let customerName = "Guest";
    let customerId = null;

    if (req.customer) {
      const customer = await Customer.findById(req.customer.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer account not found.",
        });
      }

      customerName = customer.name;
      customerId = customer._id;
    }

    // Generate AI complaint analysis
    const analysis = await generateGeminiResponse(transcript, {
      customerName,
    });

    if (!analysis || typeof analysis !== "object") {
      return res.status(500).json({
        success: false,
        message: "AI could not analyse the complaint.",
      });
    }

    // Normalize priority
    const priorityValue = String(
      analysis.priority || "Medium"
    ).toLowerCase();

    const priorityMap = {
      low: "Low",
      medium: "Medium",
      normal: "Normal",
      high: "High",
      urgent: "Urgent",
    };

    const priority = priorityMap[priorityValue] || "Medium";

    // Normalize escalation
    const escalationNeeded =
      analysis.escalationNeeded === true;

    const escalationReason =
      analysis.escalationReason || "";

    // Determine ticket status
    const ticketStatus = escalationNeeded
      ? "Escalated"
      : "Open";

    // Create conversation
    const conversation = await Conversation.create({
      customerId,
      customerName,
      transcript,
      summary: analysis.summary || "",
      category: analysis.category || "General",
      priority,
      status: "Open",
      language: analysis.language || "English",
      analysis,
    });

    // Create support ticket
    const ticket = await SupportTicket.create({
      customerId,
      customerName,
      conversationId: conversation._id,

      description: transcript,
      category: analysis.category || "General",
      priority,

      status: ticketStatus,

      orderId: analysis.orderId || "",
      transactionId: analysis.transactionId || "",

      paymentMethod: analysis.paymentMethod || "Not provided",
      paymentTime: analysis.paymentTime || "Not provided",

      requestedAction:
        analysis.requestedAction || "Customer assistance",

      escalationNeeded,
      escalationReason,
    });

    // New ticket notification
    await createNotification({
      title: "New Ticket",
      message: `A new support ticket was created by ${customerName}.`,
      type: "New Ticket",
      ticketId: ticket._id,
    });

    // High-priority notification
    if (priority === "High" || priority === "Urgent") {
      await createNotification({
        title: "High Priority",
        message: `A ${priority.toLowerCase()} priority ticket requires attention.`,
        type: "High Priority",
        ticketId: ticket._id,
      });
    }

    // Human support escalation
    if (escalationNeeded) {
      await createNotification({
        title: "Escalation",
        message: `Ticket from ${customerName} requires human support.`,
        type: "Escalation",
        ticketId: ticket._id,
      });

      // Notify connected admin clients
      io.to("admins").emit("human-support:requested", {
        ticketId: ticket._id,
        customerName,
        priority: ticket.priority,
        category: ticket.category,
        message:
          escalationReason || "Human support requested.",
      });
    }

    // Send response to frontend
    return res.status(201).json({
      success: true,
      message: "Complaint analysed successfully.",

      ticketId: ticket._id,
      conversationId: conversation._id,

      analysis,

      response: analysis.response || "",
    });

  } catch (error) {
    console.error("Complaint Understanding Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to understand complaint.",
    });
  }
};

// CUSTOMER COMPLAINT UNDERSTANDING
app.post("/api/customer/understand", understandComplaint);


// ==========================================
// ADMIN ROUTES
// ==========================================

app.use("/api", protect);

// CONFIGURATION CHECK
app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    gnaniConfigured: Boolean(process.env.GNANI_API_KEY),
  });
});

// ==========================================
// ADMIN SPEECH TO TEXT
// ==========================================

app.post(
  "/api/stt",
  upload.single("audio"),
  async (req, res) => {
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
        type: req.file.mimetype || "audio/webm",
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
        console.error("Admin Prisma API Error:", result);

        return res.status(response.status).json({
          success: false,
          message: "Gnani Prisma request failed.",
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Admin STT Error:", error.message);

      res.status(500).json({
        success: false,
        message: "Speech-to-text processing failed.",
      });
    }
  }
);

// ==========================================
// ADMIN TEXT TO SPEECH
// ==========================================

app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      language = "hi-IN",
      voice = "Nalini",
    } = req.body;

    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid text of up to 3000 characters.",
      });
    }

    if (!process.env.GNANI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gnani API key is missing.",
      });
    }

    const response = await fetch(
      "https://api.vachana.ai/api/v1/tts/inference",
      {
        method: "POST",
        headers: {
          "X-API-Key-ID": process.env.GNANI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Admin TTS Error:", errorText);

      return res.status(response.status).json({
        success: false,
        message: "Gnani Timbre request failed.",
      });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error("Admin TTS Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Text-to-speech processing failed.",
    });
  }
});

// ==========================================
// ADMIN COMPLAINT UNDERSTANDING
// ==========================================

app.post("/api/understand", understandComplaint);

// ==========================================
// SETTINGS
// ==========================================

app.get("/api/settings", async (req, res) => {
  try {
    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create({});
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Settings Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch settings.",
    });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const settings = await AppSettings.findOneAndUpdate(
      {},
      { $set: req.body },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("Settings Update Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update settings.",
    });
  }
});

// ==========================================
// NOTIFICATIONS
// ==========================================

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Notifications Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Notification Read Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
});

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
    console.error("Read All Notifications Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
    });
  }
});

// ==========================================
// ADMIN CONVERSATIONS
// ==========================================

app.get("/api/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 })
      .populate("customerId", "name email");

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Conversations Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
    });
  }
});

// ==========================================
// ADMIN TICKETS
// ==========================================

app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("customerId", "name email")
      .populate("conversationId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Tickets Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets.",
    });
  }
});

app.patch("/api/tickets/:id/status", async (req, res) => {
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

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    ticket.status = status;
    await ticket.save();

    if (ticket.conversationId) {
      await Conversation.findByIdAndUpdate(
        ticket.conversationId,
        { status }
      );
    }

    await createNotification({
      title: "Status Update",
      message: `Ticket ${ticket._id} status changed to ${status}.`,
      type: "Status Update",
      ticketId: ticket._id,
    });

    io.to(`ticket:${ticket._id}`).emit("ticket:status", {
      ticketId: ticket._id,
      status,
    });

    res.json({
      success: true,
      message: "Ticket status updated.",
      ticket,
    });
  } catch (error) {
    console.error("Ticket Status Update Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update ticket status.",
    });
  }
});

// ==========================================
// HUMAN SUPPORT QUEUE
// ==========================================

app.get("/api/human-support/requests", async (req, res) => {
  try {
    const requests = await SupportTicket.find({
      status: "Escalated",
    })
      .populate("customerId", "name email")
      .populate("conversationId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Human Support Queue Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch human support requests.",
    });
  }
});

// ==========================================
// ADMIN CHAT HISTORY
// ==========================================

app.get("/api/chat/:ticketId", async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    const messages = await ChatMessage.find({
      ticketId: ticket._id,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Chat History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history.",
    });
  }
});

// ==========================================
// SOCKET.IO AUTHENTICATION
// ==========================================

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";

    const cookies = Object.fromEntries(
      cookieHeader.split(";").filter(Boolean).map((item) => {
        const separator = item.indexOf("=");

        return [
          item.slice(0, separator).trim(),
          decodeURIComponent(item.slice(separator + 1).trim()),
        ];
      })
    );

    // Client identifies which login session it is using.
    // The server still verifies the token and its role.
    const requestedRole = socket.handshake.auth?.role;
    console.log("ROLE:", requestedRole);
    console.log("COOKIES:", Object.keys(cookies));

    let token;

    if (requestedRole === "admin") {
      token = cookies.token;
    } else if (requestedRole === "customer") {
      token = cookies.customerToken;
    } else {
      return next(new Error("User role is required."));
    }

    if (!token || !process.env.JWT_SECRET) {
      return next(new Error("Authentication required."));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (requestedRole === "admin" && decoded.role === "admin" && decoded.id) {
      const admin = await Admin.findById(decoded.id).select("_id name email");

      if (!admin) {
        return next(new Error("Admin account not found."));
      }

      socket.user = {
        id: String(admin._id),
        name: admin.name || "Vaani Admin",
        role: "admin",
      };

      return next();
    }

    if (
      requestedRole === "customer" &&
      decoded.role === "customer" &&
      decoded.id
    ) {
      const customer = await Customer.findById(decoded.id).select(
        "_id name email"
      );

      if (!customer) {
        return next(new Error("Customer account not found."));
      }

      socket.user = {
        id: String(customer._id),
        name: customer.name || "Customer",
        role: "customer",
      };

      return next();
    }

    return next(new Error("Invalid user role."));
  } catch (error) {
    console.error("Socket Authentication Error:", error.message);
    return next(new Error("Invalid or expired session."));
  }
});

// ==========================================
// SOCKET.IO CHAT EVENTS
// ==========================================

io.on("connection", (socket) => {
  console.log(
    `${socket.user.role} connected: ${socket.user.name}`
  );

  if (socket.user.role === "admin") {
    socket.join("admins");
  }

  // Join a ticket chat room
  socket.on("chat:join", async (ticketId, callback) => {
    try {
      if (!mongoose.isValidObjectId(ticketId)) {
        return callback?.({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const ticket = await SupportTicket.findById(ticketId);

      if (!ticket) {
        return callback?.({
          success: false,
          message: "Ticket not found.",
        });
      }

      if (
        socket.user.role === "customer" &&
        String(ticket.customerId) !== socket.user.id
      ) {
        return callback?.({
          success: false,
          message: "You cannot access this chat.",
        });
      }

      socket.join(`ticket:${ticketId}`);

      const messages = await ChatMessage.find({
        ticketId,
      }).sort({ createdAt: 1 });

      callback?.({
        success: true,
        messages,
      });
    } catch (error) {
      console.error("Chat Join Error:", error.message);

      callback?.({
        success: false,
        message: "Could not join chat.",
      });
    }
  });

  // Send a chat message
  socket.on("chat:send", async (payload, callback) => {
    console.log("CHAT SENDER:", socket.user);
    try {
      const { ticketId, message } = payload || {};

      if (
        !mongoose.isValidObjectId(ticketId) ||
        typeof message !== "string" ||
        !message.trim() ||
        message.length > 3000
      ) {
        return callback?.({
          success: false,
          message: "Invalid chat message.",
        });
      }

      const ticket = await SupportTicket.findById(ticketId);

      if (!ticket) {
        return callback?.({
          success: false,
          message: "Ticket not found.",
        });
      }

      if (
        socket.user.role === "customer" &&
        String(ticket.customerId) !== socket.user.id
      ) {
        return callback?.({
          success: false,
          message: "You cannot send messages in this chat.",
        });
      }

      if (
        socket.user.role === "customer" &&
        ticket.status === "Resolved"
      ) {
        return callback?.({
          success: false,
          message: "This support ticket is already resolved.",
        });
      }

      if (
        socket.user.role === "admin" &&
        String(ticket.assignedAgentId || "") !== socket.user.id
      ) {
        return callback?.({
          success: false,
          message: "Accept and get assigned to this ticket before replying.",
        });
      }

      const chatMessage = await ChatMessage.create({
        ticketId: ticket._id,
        senderId: socket.user.id,
        senderRole: socket.user.role,
        senderName: socket.user.name,
        message: message.trim(),
      });

      io.to(`ticket:${ticketId}`).emit(
        "chat:message",
        chatMessage
      );

      callback?.({
        success: true,
        message: chatMessage,
      });
    } catch (error) {
      console.error("Chat Send Error:", error.message);

      callback?.({
        success: false,
        message: "Could not send message.",
      });
    }
  });

  // Admin accepts a human-support request
  socket.on("human-support:accept", async (ticketId, callback) => {
    try {
      if (socket.user.role !== "admin") {
        return callback?.({
          success: false,
          message: "Admin access required.",
        });
      }

      if (!mongoose.isValidObjectId(ticketId)) {
        return callback?.({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const ticket = await SupportTicket.findById(ticketId);

      if (!ticket) {
        return callback?.({
          success: false,
          message: "Ticket not found.",
        });
      }

      if (ticket.status !== "Escalated") {
        return callback?.({
          success: false,
          message: "This request is no longer pending.",
        });
      }

      // Assign this ticket to the admin who accepted the request.
      ticket.assignedAgentId = socket.user.id;
      ticket.assignedAgentName = socket.user.name;
      ticket.status = "In Progress";
      await ticket.save();

      if (ticket.conversationId) {
        await Conversation.findByIdAndUpdate(
          ticket.conversationId,
          { status: "In Progress" }
        );
      }

      io.to(`ticket:${ticketId}`).emit("ticket:status", {
        ticketId,
        status: "In Progress",
      });

      io.to("admins").emit("human-support:accepted", {
        ticketId,
        adminName: socket.user.name,
        assignedAgentId: socket.user.id,
        assignedAgentName: socket.user.name,
      });

      io.to(`ticket:${ticketId}`).emit("human-support:assigned", {
        ticketId,
        assignedAgentId: socket.user.id,
        assignedAgentName: socket.user.name,
        status: "In Progress",
      });

      callback?.({
        success: true,
        message: "Human support request accepted.",
      });
    } catch (error) {
      console.error("Accept Support Error:", error.message);

      callback?.({
        success: false,
        message: "Could not accept support request.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(
      `${socket.user.role} disconnected: ${socket.user.name}`
    );
  });
});
// ==========================================
// SERVER STARTUP
// ==========================================

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`VaaniOS backend running on port ${PORT}`);
      console.log(`Allowed frontend origin: ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error("Server Startup Error:", error);
    process.exit(1);
  }
};

startServer();