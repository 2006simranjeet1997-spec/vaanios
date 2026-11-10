
const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
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

    orderId: {
      type: String,
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
    },

    paymentMethod: {
      type: String,
      default: "Not provided",
    },

    paymentTime: {
      type: String,
      default: "Not provided",
    },

    category: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "Normal", "High", "Urgent"],
      default: "Medium",
    },

    description: {
      type: String,
      required: true,
    },

    requestedAction: {
      type: String,
      default: "Customer assistance",
    },

    escalationReason: {
      type: String,
      default: "",
    },

    // Whether the complaint requires human support
    escalationNeeded: {
      type: Boolean,
      default: false,
    },

    // Human support assignment
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    assignedAgentName: {
      type: String,
      default: null,
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

// Indexes
supportTicketSchema.index({ assignedAgentId: 1 });
supportTicketSchema.index({ escalationNeeded: 1, status: 1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
