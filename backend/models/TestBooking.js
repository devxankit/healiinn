const mongoose = require('mongoose');

const TEST_BOOKING_STATUS = [
  'ordered',
  'sample_pending',
  'sample_collected',
  'in_progress',
  'completed',
  'cancelled',
  'pending',
];

const testBookingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    laboratory: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true, index: true },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    tests: [
      {
        name: { type: String, trim: true, required: true },
        testName: { type: String, trim: true },
        code: { type: String, trim: true },
        instructions: { type: String, trim: true },
        price: { type: Number, min: 0 },
        description: { type: String, trim: true },
      },
    ],
    status: { type: String, enum: TEST_BOOKING_STATUS, default: 'ordered', index: true },
    statusSimple: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    sampleCollection: {
      mode: { type: String, enum: ['home_visit', 'in_lab'], default: 'in_lab' },
      scheduledAt: { type: Date },
      collectedAt: { type: Date },
      agentName: { type: String, trim: true },
    },
    results: {
      summary: { type: String, trim: true },
      reportFile: { type: String, trim: true },
      files: [
        {
          label: { type: String, trim: true },
          url: { type: String, trim: true },
        },
      ],
      reportedAt: { type: Date },
      verifiedBy: { type: String, trim: true },
      testName: { type: String, trim: true },
    },
    billing: {
      totalAmount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      paid: { type: Boolean, default: false },
      paymentMethod: { type: String, trim: true },
      transactionId: { type: String, trim: true },
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

testBookingSchema.index({ laboratory: 1, status: 1, createdAt: -1 });
testBookingSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('TestBooking', testBookingSchema);
