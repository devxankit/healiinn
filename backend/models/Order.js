const mongoose = require('mongoose');

const ORDER_STATUS = ['pending', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled'];
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded', 'cod'];

const orderItemSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    prescriptionMedicine: { type: Boolean, default: false },
    dosage: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    placedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'placedByModel' },
    placedByModel: { type: String, enum: ['Patient', 'Doctor', 'Admin'] },
    items: { type: [orderItemSchema], required: true },
    status: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    payment: {
      status: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
      paymentStatus: { type: String, enum: PAYMENT_STATUS },
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      method: { type: String, trim: true },
      transactionId: { type: String, trim: true },
      paidAt: { type: Date },
    },
    delivery: {
      mode: { type: String, enum: ['pickup', 'delivery'], default: 'delivery' },
      address: {
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
      },
      scheduledAt: { type: Date },
      deliveredAt: { type: Date },
      agentName: { type: String, trim: true },
      trackingId: { type: String, trim: true },
    },
    notes: { type: String, trim: true },
    auditTrail: [
      {
        status: { type: String, enum: ORDER_STATUS },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'auditTrail.changedByModel' },
        changedByModel: { type: String, enum: ['Patient', 'Doctor', 'Admin', 'Pharmacy'] },
        remarks: { type: String, trim: true },
      },
    ],
    totalAmount: { type: Number, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUS },
    deliveryStatus: { type: String, enum: ORDER_STATUS },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.index({ pharmacy: 1, status: 1, createdAt: -1 });
orderSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
