const LabLead = require('../models/LabLead');
const LabQuote = require('../models/LabQuote');
const LabOrder = require('../models/LabOrder');
const { LAB_LEAD_STATUS, LAB_ORDER_STATUS, ROLES } = require('../utils/constants');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const listLeadsForLab = ({ laboratoryId }) =>
  LabLead.find({
    $or: [
      { preferredLaboratories: laboratoryId },
      { preferredLaboratories: { $exists: false } },
    ],
    status: { $in: [LAB_LEAD_STATUS.NEW, LAB_LEAD_STATUS.QUOTED] },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

const createQuote = async ({ leadId, laboratoryId, tests, totalAmount, currency, expiresAt, remarks }) => {
  const lead = await LabLead.findById(leadId);

  if (!lead) {
    throw createError(404, 'Lab lead not found');
  }

  if (lead.status === LAB_LEAD_STATUS.ACCEPTED) {
    throw createError(400, 'Lead already accepted');
  }

  const quote = await LabQuote.create({
    lead: lead._id,
    laboratory: laboratoryId,
    tests,
    totalAmount,
    currency: currency || 'INR',
    expiresAt,
    remarks,
  });

  lead.status = LAB_LEAD_STATUS.QUOTED;
  await lead.save();

  return quote;
};

const acceptQuote = async ({ quoteId, actorRole, actorId }) => {
  const quote = await LabQuote.findById(quoteId);

  if (!quote) {
    throw createError(404, 'Quote not found');
  }

  const lead = await LabLead.findById(quote.lead);

  if (!lead) {
    throw createError(404, 'Lead not found');
  }

  if (actorRole === ROLES.PATIENT && lead.patient.toString() !== actorId.toString()) {
    throw createError(403, 'Lead not accessible');
  }

  quote.status = LAB_LEAD_STATUS.ACCEPTED;
  quote.acceptedAt = new Date();
  await quote.save();

  lead.status = LAB_LEAD_STATUS.ACCEPTED;
  lead.acceptedQuote = quote._id;
  await lead.save();

  const order = await LabOrder.create({
    lead: lead._id,
    quote: quote._id,
    laboratory: quote.laboratory,
    patient: lead.patient,
    tests: quote.tests.map((test) => ({
      testName: test.testName,
      price: test.price,
      status: 'pending',
    })),
    status: LAB_ORDER_STATUS.PENDING,
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

const listOrdersForLab = ({ laboratoryId }) =>
  LabOrder.find({ laboratory: laboratoryId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

module.exports = {
  listLeadsForLab,
  createQuote,
  acceptQuote,
  listOrdersForLab,
};

