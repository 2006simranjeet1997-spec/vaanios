const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
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
      // Check whether audio was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an audio file.",
        });
      }
  
      // Prepare audio for Gnani API
      const formData = new FormData();
  
      const audioBlob = new Blob([req.file.buffer], {
        type: req.file.mimetype || "audio/wav",
      });
  
      formData.append("audio_file", audioBlob, req.file.originalname);
      formData.append("model", "prisma-v3.0");
      formData.append("language_code", "indic-auto");
  
      // Send audio to Gnani Prisma V3
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
        return res.status(response.status).json({
          success: false,
          message: "Gnani API request failed.",
          details: result,
        });
      }
  
      // Return transcript to VaaniOS
      res.json(result);
  
    } catch (error) {
      console.error("Prisma STT Error:", error.message);
  
      res.status(500).json({
        success: false,
        message: "Speech-to-text processing failed.",
      });
    }
  });
  

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`VaaniOS server running on port ${PORT}`);
});