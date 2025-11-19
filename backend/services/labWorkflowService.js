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
  tests, // Updated tests with availability and prices
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

  // If accepting, validate that tests and billing are provided
  if (status === LAB_LEAD_STATUS.ACCEPTED) {
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      const error = new Error('Tests with availability and prices are required when accepting a request.');
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
      report,
    }),
  ];

  // Update tests with availability and prices when accepting
  if (status === LAB_LEAD_STATUS.ACCEPTED && tests) {
    lead.tests = tests.map((test) => ({
      testName: test.testName,
      description: test.description || '',
      notes: test.notes || '',
      priority: test.priority || 'normal',
      available: test.available !== undefined ? test.available : true,
      price: test.price !== undefined ? Number(test.price) : 0,
      availabilityNotes: test.availabilityNotes || '',
    }));
    // Track which laboratory accepted
    lead.acceptedBy = laboratoryId;
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

    // Create or update LabReport when report is uploaded
    if (status === LAB_LEAD_STATUS.REPORT_UPLOADED) {
      const LabReport = require('../models/LabReport');
      let labReport = await LabReport.findOne({ labLead: lead._id });

      if (!labReport) {
        labReport = new LabReport({
          labLead: lead._id,
          prescription: lead.prescription,
          consultation: lead.consultation,
          laboratory: laboratoryId,
          doctor: lead.doctor,
          patient: lead.patient,
          reportFile: {
            fileUrl: report.fileUrl,
            fileName: report.fileName,
            mimeType: report.mimeType || 'application/pdf',
            uploadedBy: actorId,
            uploadedAt: new Date(),
          },
          reportData: report.reportData || {},
          status: 'uploaded',
        });
      } else {
        labReport.reportFile = {
          fileUrl: report.fileUrl,
          fileName: report.fileName,
          mimeType: report.mimeType || 'application/pdf',
          uploadedBy: actorId,
          uploadedAt: new Date(),
        };
        labReport.status = 'uploaded';
      }

      await labReport.save();

      // Automatically share with patient when report is uploaded
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      labReport.sharedWith.push({
        sharedWith: lead.patient,
        sharedWithModel: 'Patient',
        sharedWithRole: 'patient',
        shareType: 'direct',
        sharedAt: new Date(),
        expiresAt: null, // Patient access never expires
      });

      labReport.shareHistory.push({
        sharedWith: lead.patient,
        sharedWithModel: 'Patient',
        sharedWithRole: 'patient',
        shareType: 'direct',
        sharedAt: new Date(),
        sharedBy: laboratoryId,
        sharedByModel: 'Laboratory',
        sharedByRole: 'laboratory',
        notes: 'Report automatically shared with patient',
      });

      labReport.status = 'shared_with_patient';
      await labReport.save();

      // Notify patient that report is ready
      const { notifyLabReportReady } = require('./notificationEvents');
      const Laboratory = require('../models/Laboratory');
      try {
        const lab = await Laboratory.findById(laboratoryId).select('labName').lean();
        await notifyLabReportReady({
          patientId: lead.patient,
          laboratoryName: lab?.labName || 'Laboratory',
          reportId: labReport._id,
        });
      } catch (notificationError) {
        console.error('Failed to send lab report ready notification:', notificationError);
      }
    }
  }

  await lead.save();

  // Send notifications for status changes
  const { 
    notifyLabLeadStatusChange, 
    notifyLabRequestReceived, 
    notifyLabAccepted 
  } = require('./notificationEvents');
  const Laboratory = require('../models/Laboratory');
  const Patient = require('../models/Patient');

  try {
    if (status === LAB_LEAD_STATUS.NEW) {
      // Notify all preferred laboratories
      const labs = await Laboratory.find({ _id: { $in: lead.preferredLaboratories } })
        .select('labName')
        .lean();
      for (const lab of labs) {
        await notifyLabRequestReceived({
          laboratoryId: lab._id,
          patientName: null, // Will be populated if needed
          leadId: lead._id,
        });
      }
    } else if (status === LAB_LEAD_STATUS.ACCEPTED) {
      const patient = await Patient.findById(lead.patient).select('firstName lastName').lean();
      const lab = await Laboratory.findById(laboratoryId).select('labName').lean();
      await notifyLabAccepted({
        patientId: lead.patient,
        laboratoryName: lab?.labName || 'Laboratory',
        leadId: lead._id,
        totalAmount: billing?.totalAmount || 0,
      });
    } else {
      // Notify status change
      await notifyLabLeadStatusChange({
        patientId: lead.patient,
        laboratoryId,
        status,
        leadId: lead._id,
        notes,
      });
    }
  } catch (notificationError) {
    console.error('Failed to send lab lead notification:', notificationError);
    // Don't fail the update if notification fails
  }

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

