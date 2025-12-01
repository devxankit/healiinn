const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    appointmentType: {
      type: String,
      enum: ['New', 'Follow-up'],
      default: 'New',
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      default: 30, // minutes
    },
    fee: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    tokenNumber: {
      type: Number,
      min: 1,
    },
    queueStatus: {
      type: String,
      enum: ['waiting', 'in-consultation', 'no-show', 'completed', 'cancelled'],
      default: 'waiting',
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ sessionId: 1, tokenNumber: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;

