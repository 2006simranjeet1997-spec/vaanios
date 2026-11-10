
const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema(
  {
    // Business Profile
    businessName: {
      type: String,
      default: "Vaani Admin",
      trim: true,
    },

    // AI Assistant Settings
    assistantName: {
      type: String,
      default: "Vaani Assistant",
      trim: true,
    },

    language: {
      type: String,
      default: "English",
    },

    voice: {
      type: String,
      default: "Nalini",
    },

    // Notification Preferences
    notificationPreferences: {
      newTicket: { type: Boolean, default: true },
      highPriority: { type: Boolean, default: true },
      escalation: { type: Boolean, default: true },
      statusUpdate: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppSettings", appSettingsSchema);
