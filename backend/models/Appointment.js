const mongoose = require('mongoose');

const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
const APPOINTMENT_TYPE = ['in_person', 'video', 'audio', 'online'];
const PAYMENT_STATUS = ['unpaid', 'paid'];

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', index: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicSession', index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicSession' },
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionToken', index: true },
    tokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionToken' },
    tokenNumber: { type: Number },
    eta: { type: Date },
    priority: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
    createdByModel: {
      type: String,
      enum: ['Admin', 'Patient', 'Doctor'],
    },
    scheduledFor: { type: Date, required: true, index: true },
    date: { type: Date },
    time: { type: String, trim: true },
    durationMinutes: { type: Number, default: 20, min: 5 },
    type: { type: String, enum: APPOINTMENT_TYPE, default: 'in_person' },
    consultationType: { type: String, enum: APPOINTMENT_TYPE },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: APPOINTMENT_STATUS, default: 'scheduled', index: true },
    followUpAt: { type: Date },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    vitals: {
      heightCm: Number,
      weightKg: Number,
      systolic: Number,
      diastolic: Number,
      pulse: Number,
      temperatureC: Number,
    },
    attachments: [
      {
        label: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    billing: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      paid: { type: Boolean, default: false },
      paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'unpaid' },
      paymentId: { type: String, trim: true },
      transactionId: { type: String, trim: true },
      razorpayOrderId: { type: String, trim: true },
      razorpayPaymentId: { type: String, trim: true },
      razorpaySignature: { type: String, trim: true },
      paidAt: { type: Date },
      commissionRate: { type: Number, default: 0.1 },
      commissionAmount: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

appointmentSchema.index({ doctor: 1, scheduledFor: 1 });
appointmentSchema.index({ patient: 1, scheduledFor: -1 });
appointmentSchema.index({ session: 1, tokenNumber: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
