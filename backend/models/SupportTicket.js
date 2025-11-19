const mongoose = require('mongoose');

const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const SUPPORT_TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'laboratory', 'pharmacy'],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      refPath: 'userModel',
    },
    userModel: {
      type: String,
      required: true,
      enum: ['Patient', 'Doctor', 'Laboratory', 'Pharmacy'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_STATUS),
      default: SUPPORT_TICKET_STATUS.OPEN,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_PRIORITY),
      default: SUPPORT_TICKET_PRIORITY.MEDIUM,
      index: true,
    },
    adminResponse: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    respondedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        mimetype: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Generate ticket number before saving
supportTicketSchema.pre('save', async function preSave() {
  if (this.isNew && !this.ticketNumber) {
    const prefix = this.role.charAt(0).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.ticketNumber = `${prefix}-${timestamp}-${random}`;
  }
});

supportTicketSchema.index({ role: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = {
  SupportTicket,
  SUPPORT_TICKET_STATUS,
  SUPPORT_TICKET_PRIORITY,
};

