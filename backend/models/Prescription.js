const mongoose = require('mongoose');

const PRESCRIPTION_STATUS = ['draft', 'issued', 'revoked'];

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    route: { type: String, trim: true },
    instructions: { type: String, trim: true },
    mealRelation: { type: String, enum: ['before_meal', 'after_meal', 'any'], default: 'any' },
  },
  { _id: false }
);

const investigationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    code: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    status: { type: String, enum: PRESCRIPTION_STATUS, default: 'issued', index: true },
    medications: [medicationSchema],
    investigations: [investigationSchema],
    diagnosis: { type: String, trim: true },
    advice: { type: String, trim: true },
    lifestyleAdvice: { type: String, trim: true },
    followUpAt: { type: Date },
    issuedAt: { type: Date, default: Date.now },
    validityInDays: { type: Number, default: 30 },
    pharmacyNotes: { type: String, trim: true },
    attachments: [
      {
        label: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    metadata: {
      bp: { systolic: Number, diastolic: Number },
      pulse: Number,
      bmi: Number,
      temperatureC: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

prescriptionSchema.index({ doctor: 1, createdAt: -1 });

prescriptionSchema.index({ patient: 1, issuedAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
