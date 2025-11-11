const PharmacyLead = require('../models/PharmacyLead');
const PharmacyQuote = require('../models/PharmacyQuote');
const PharmacyOrder = require('../models/PharmacyOrder');
const { PHARMACY_LEAD_STATUS, PHARMACY_ORDER_STATUS, ROLES } = require('../utils/constants');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const listLeadsForPharmacy = ({ pharmacyId }) =>
  PharmacyLead.find({
    $or: [
      { preferredPharmacies: pharmacyId },
      { preferredPharmacies: { $exists: false } },
    ],
    status: { $in: [PHARMACY_LEAD_STATUS.NEW, PHARMACY_LEAD_STATUS.QUOTED] },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

const createQuote = async ({ leadId, pharmacyId, medicines, totalAmount, currency, expiresAt, remarks }) => {
  const lead = await PharmacyLead.findById(leadId);

  if (!lead) {
    throw createError(404, 'Pharmacy lead not found');
  }

  if (lead.status === PHARMACY_LEAD_STATUS.ACCEPTED) {
    throw createError(400, 'Lead already accepted');
  }

  const quote = await PharmacyQuote.create({
    lead: lead._id,
    pharmacy: pharmacyId,
    medicines,
    totalAmount,
    currency: currency || 'INR',
    expiresAt,
    remarks,
  });

  lead.status = PHARMACY_LEAD_STATUS.QUOTED;
  await lead.save();

  return quote;
};

const acceptQuote = async ({ quoteId, actorRole, actorId, deliveryType, scheduledAt }) => {
  const quote = await PharmacyQuote.findById(quoteId);

  if (!quote) {
    throw createError(404, 'Quote not found');
  }

  const lead = await PharmacyLead.findById(quote.lead);

  if (!lead) {
    throw createError(404, 'Lead not found');
  }

  if (actorRole === ROLES.PATIENT && lead.patient.toString() !== actorId.toString()) {
    throw createError(403, 'Lead not accessible');
  }

  quote.status = PHARMACY_LEAD_STATUS.ACCEPTED;
  quote.acceptedAt = new Date();
  await quote.save();

  lead.status = PHARMACY_LEAD_STATUS.ACCEPTED;
  lead.acceptedQuote = quote._id;
  await lead.save();

  const order = await PharmacyOrder.create({
    lead: lead._id,
    quote: quote._id,
    pharmacy: quote.pharmacy,
    patient: lead.patient,
    medicines: quote.medicines.map((med) => ({
      name: med.name,
      brand: med.brand,
      dosage: med.dosage,
      quantity: med.quantity,
      price: med.price,
      status: 'pending',
    })),
    status: PHARMACY_ORDER_STATUS.PENDING,
    deliveryType: deliveryType || 'pickup',
    scheduledAt,
    payment: {
      amount: quote.totalAmount,
      status: 'pending',
    },
  });

  return {
    lead,
    quote,
    order,
  };
};

const listOrdersForPharmacy = ({ pharmacyId }) =>
  PharmacyOrder.find({ pharmacy: pharmacyId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

module.exports = {
  listLeadsForPharmacy,
  createQuote,
  acceptQuote,
  listOrdersForPharmacy,
};

