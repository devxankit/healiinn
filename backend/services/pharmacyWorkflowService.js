const PharmacyLead = require('../models/PharmacyLead');
const { PHARMACY_LEAD_STATUS } = require('../utils/constants');

const listLeadsForPharmacy = ({ pharmacyId, status }) => {
  const query = {
    preferredPharmacies: pharmacyId,
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  return PharmacyLead.find(query)
    .populate(
      'doctor',
      'firstName lastName phone email clinicDetails specialization consultationFee'
    )
    .populate('patient', 'firstName lastName phone email address')
    .populate(
      'prescription',
      'diagnosis medications investigations advice metadata issuedAt'
    )
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
};

const buildStatusHistoryEntry = ({ status, notes, actorId, actorRole, billing }) => {
  let billingSnapshot;

  if (billing) {
    billingSnapshot = {};

    if (billing.totalAmount !== undefined) {
      billingSnapshot.totalAmount = billing.totalAmount;
    }

    if (billing.deliveryCharge !== undefined) {
      billingSnapshot.deliveryCharge = billing.deliveryCharge;
    }

    if (billing.currency) {
      billingSnapshot.currency = billing.currency;
    }

    if (!Object.keys(billingSnapshot).length) {
      billingSnapshot = undefined;
    }
  }

  return {
    status,
    notes: notes || undefined,
    updatedBy: actorId || undefined,
    updatedByRole: actorRole || undefined,
    billingSnapshot,
    updatedAt: new Date(),
  };
};

const getLeadForPharmacy = ({ leadId, pharmacyId }) =>
  PharmacyLead.findOne({
    _id: leadId,
    preferredPharmacies: pharmacyId,
  });

const updateLeadStatus = async ({
  leadId,
  pharmacyId,
  status,
  notes,
  billing,
  medicines, // Updated medicines with availability and prices
  actorId,
  actorRole,
}) => {
  if (!Object.values(PHARMACY_LEAD_STATUS).includes(status)) {
    const error = new Error('Invalid status provided.');
    error.status = 400;
    throw error;
  }

  const lead = await getLeadForPharmacy({ leadId, pharmacyId });

  if (!lead) {
    const error = new Error('Prescription lead not found for this pharmacy.');
    error.status = 404;
    throw error;
  }

  // If accepting, validate that medicines and billing are provided
  if (status === PHARMACY_LEAD_STATUS.ACCEPTED) {
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      const error = new Error('Medicines with availability and prices are required when accepting a request.');
      error.status = 400;
      throw error;
    }
    if (!billing || typeof billing.totalAmount !== 'number' || billing.totalAmount <= 0) {
      const error = new Error('Billing details with totalAmount are required when accepting a request.');
      error.status = 400;
      throw error;
    }
  }

  lead.status = status;
  lead.statusHistory = [
    ...(lead.statusHistory || []),
    buildStatusHistoryEntry({
      status,
      notes,
      actorId,
      actorRole,
      billing,
    }),
  ];

  // Update medicines with availability and prices when accepting
  if (status === PHARMACY_LEAD_STATUS.ACCEPTED && medicines) {
    lead.medicines = medicines.map((medicine) => ({
      name: medicine.name,
      dosage: medicine.dosage || '',
      quantity: medicine.quantity || 1,
      instructions: medicine.instructions || '',
      priority: medicine.priority || 'normal',
      available: medicine.available !== undefined ? medicine.available : true,
      price: medicine.price !== undefined ? Number(medicine.price) : 0,
      availableQuantity: medicine.availableQuantity !== undefined ? Number(medicine.availableQuantity) : 0,
      availabilityNotes: medicine.availabilityNotes || '',
    }));
    // Track which pharmacy accepted
    lead.acceptedBy = pharmacyId;
  }

  if (billing) {
    const summary = {
      currency: billing.currency || 'INR',
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    if (typeof billing.totalAmount === 'number') {
      summary.totalAmount = billing.totalAmount;
    }

    if (typeof billing.deliveryCharge === 'number') {
      summary.deliveryCharge = billing.deliveryCharge;
    }

    if (billing.notes) {
      summary.notes = billing.notes;
    }

    lead.billingSummary = summary;
  }

  await lead.save();


  await lead.populate([
    {
      path: 'doctor',
      select:
        'firstName lastName phone email clinicDetails specialization consultationFee',
    },
    {
      path: 'patient',
      select: 'firstName lastName phone email address',
    },
    {
      path: 'prescription',
      select: 'diagnosis medications investigations advice metadata issuedAt',
    },
    {
      path: 'preferredPharmacies',
      select: 'pharmacyName phone email address',
    },
  ]);

  return lead.toObject();
};

module.exports = {
  listLeadsForPharmacy,
  updateLeadStatus,
  getLeadForPharmacy,
};

