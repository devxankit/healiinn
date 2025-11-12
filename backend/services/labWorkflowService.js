const LabLead = require('../models/LabLead');
const { LAB_LEAD_STATUS } = require('../utils/constants');

const listLeadsForLab = ({ laboratoryId, status }) => {
  const query = {
    preferredLaboratories: laboratoryId,
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  return LabLead.find(query)
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

const buildStatusHistoryEntry = ({
  status,
  notes,
  actorId,
  actorRole,
  billing,
  report,
}) => {
  const entry = {
    status,
    notes: notes || undefined,
    updatedBy: actorId || undefined,
    updatedByRole: actorRole || undefined,
    updatedAt: new Date(),
  };

  if (billing) {
    const snapshot = {};

    if (billing.totalAmount !== undefined) {
      snapshot.totalAmount = billing.totalAmount;
    }

    if (billing.homeCollectionCharge !== undefined) {
      snapshot.homeCollectionCharge = billing.homeCollectionCharge;
    }

    if (billing.currency) {
      snapshot.currency = billing.currency;
    }

    if (Object.keys(snapshot).length) {
      entry.billingSnapshot = snapshot;
    }
  }

  if (report) {
    const snapshot = {};

    if (report.fileUrl) {
      snapshot.fileUrl = report.fileUrl;
    }

    if (report.fileName) {
      snapshot.fileName = report.fileName;
    }

    if (report.mimeType) {
      snapshot.mimeType = report.mimeType;
    }

    if (Object.keys(snapshot).length) {
      entry.reportSnapshot = snapshot;
    }
  }

  return entry;
};

const getLeadForLab = ({ leadId, laboratoryId }) =>
  LabLead.findOne({
    _id: leadId,
    preferredLaboratories: laboratoryId,
  });

const updateLeadStatus = async ({
  leadId,
  laboratoryId,
  status,
  notes,
  billing,
  report,
  actorId,
  actorRole,
}) => {
  if (!Object.values(LAB_LEAD_STATUS).includes(status)) {
    const error = new Error('Invalid status provided.');
    error.status = 400;
    throw error;
  }

  const lead = await getLeadForLab({ leadId, laboratoryId });

  if (!lead) {
    const error = new Error('Test lead not found for this laboratory.');
    error.status = 404;
    throw error;
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
      report,
    }),
  ];

  if (billing) {
    const summary = {
      currency: billing.currency || 'INR',
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    if (typeof billing.totalAmount === 'number') {
      summary.totalAmount = billing.totalAmount;
    }

    if (typeof billing.homeCollectionCharge === 'number') {
      summary.homeCollectionCharge = billing.homeCollectionCharge;
    }

    if (billing.notes) {
      summary.notes = billing.notes;
    }

    lead.billingSummary = summary;
  }

  if (report) {
    lead.reportDetails = {
      fileUrl: report.fileUrl || undefined,
      fileName: report.fileName || undefined,
      mimeType: report.mimeType || undefined,
      notes: report.notes || undefined,
      uploadedBy: actorId,
      uploadedAt: new Date(),
    };
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
      path: 'preferredLaboratories',
      select: 'labName phone email address',
    },
  ]);

  return lead.toObject();
};

module.exports = {
  listLeadsForLab,
  updateLeadStatus,
  getLeadForLab,
};

