const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema(
  {
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