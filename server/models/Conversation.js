
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      default: "Guest",
    },

    transcript: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      default: "unknown",
    },

    category: {
      type: String,
      default: "General Inquiry",
    },

    priority: {
      type: String,
      default: "Normal",
    },

    response: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Escalated"],
      default: "Open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
