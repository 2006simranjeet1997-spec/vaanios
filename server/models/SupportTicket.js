const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      default: "Guest",
    },

    orderId: {
      type: String,
      default: null,
    },

    category: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },

    description: {
      type: String,
      required: true,
    },

    requestedAction: {
      type: String,
      default: "Customer assistance",
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Escalated"],
      default: "Open",
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);