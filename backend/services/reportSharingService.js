const LabReport = require('../models/LabReport');
const LabLead = require('../models/LabLead');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const { ROLES } = require('../utils/constants');

const getReportForPatient = async ({ reportId, patientId }) => {
  const report = await LabReport.findOne({
    _id: reportId,
    patient: patientId,
  })
    .populate('doctor', 'firstName lastName specialization')
    .populate('laboratory', 'labName address phone')
    .populate('prescription', 'diagnosis medications investigations')
    .lean();

  if (!report) {
    const error = new Error('Report not found or access denied');
    error.status = 404;
    throw error;
  }

  // Check if patient has access (either direct share or through appointment)
  const hasDirectAccess = report.sharedWith.some(
    (share) =>
      share.sharedWith.toString() === patientId.toString() &&
      share.sharedWithModel === 'Patient' &&
      (!share.expiresAt || share.expiresAt > new Date())
  );

  if (!hasDirectAccess) {
    const error = new Error('You do not have access to this report');
    error.status = 403;
    throw error;
  }

  return report;
};

const getReportForDoctor = async ({ reportId, doctorId }) => {
  const report = await LabReport.findOne({
    _id: reportId,
    'sharedWith.sharedWith': doctorId,
    'sharedWith.sharedWithModel': 'Doctor',
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('laboratory', 'labName address phone')
    .populate('prescription', 'diagnosis medications investigations')
    .lean();

  if (!report) {
    const error = new Error('Report not found or access denied');
    error.status = 404;
    throw error;
  }

  // Check if doctor has valid access
  const share = report.sharedWith.find(
    (s) =>
      s.sharedWith.toString() === doctorId.toString() &&
      s.sharedWithModel === 'Doctor' &&
      (!s.expiresAt || s.expiresAt > new Date())
  );

  if (!share) {
    const error = new Error('You do not have access to this report or access has expired');
    error.status = 403;
    throw error;
  }

  // Mark as viewed
  await LabReport.updateOne(
    {
      _id: reportId,
      'sharedWith._id': share._id,
    },
    {
      $set: {
        'sharedWith.$.viewed': true,
        'sharedWith.$.viewedAt': new Date(),
      },
    }
  );

  // Store report for doctor (they can access it later)
  // The report is already in sharedWith, so doctor can access it anytime until expiry
  // No need for separate storage - sharedWith acts as storage

  return { ...report, shareDetails: share };
};

const shareReportWithDoctor = async ({
  reportId,
  patientId,
  doctorId,
  appointmentId,
  notes,
}) => {
  const report = await LabReport.findOne({
    _id: reportId,
    patient: patientId,
  })
    .populate('prescription')
    .populate('doctor');

  if (!report) {
    const error = new Error('Report not found');
    error.status = 404;
    throw error;
  }

  // Check if already shared with this doctor
  const existingShare = report.sharedWith.find(
    (share) =>
      share.sharedWith.toString() === doctorId.toString() &&
      share.sharedWithModel === 'Doctor' &&
      (!share.expiresAt || share.expiresAt > new Date())
  );

  if (existingShare) {
    return report; // Already shared
  }

  const prescribingDoctorId = report.doctor._id || report.doctor;
  const isPrescribingDoctor = prescribingDoctorId.toString() === doctorId.toString();

  let shareType = 'appointment_based';
  let expiresAt = null;
  let appointment = null;

  if (isPrescribingDoctor) {
    // Direct share with prescribing doctor - valid for 1 month from report upload date
    shareType = 'direct';
    
    // Get report upload date (from reportFile.uploadedAt or createdAt)
    const reportUploadDate = report.reportFile?.uploadedAt || report.createdAt || new Date();
    const oneMonthFromUpload = new Date(reportUploadDate);
    oneMonthFromUpload.setMonth(oneMonthFromUpload.getMonth() + 1);
    
    // Check if 1 month has passed since upload
    if (oneMonthFromUpload < new Date()) {
      const error = new Error('Direct share with prescribing doctor is only valid for 1 month from report upload date. Please book an appointment to share.');
      error.status = 400;
      throw error;
    }
    
    // Set expiry to 1 month from upload date
    expiresAt = oneMonthFromUpload;
  } else {
    // Share with other doctor - requires appointment
    if (!appointmentId) {
      const error = new Error('Appointment ID is required to share report with other doctors');
      error.status = 400;
      throw error;
    }

    appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: patientId,
      doctor: doctorId,
      status: { $in: ['scheduled', 'confirmed', 'completed'] },
    });

    if (!appointment) {
      const error = new Error('Valid appointment is required to share report with this doctor');
      error.status = 400;
      throw error;
    }

    // Share valid until appointment date + 1 month
    expiresAt = new Date(appointment.scheduledFor || appointment.date || new Date());
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  // Add to sharedWith
  report.sharedWith.push({
    sharedWith: doctorId,
    sharedWithModel: 'Doctor',
    sharedWithRole: ROLES.DOCTOR,
    shareType,
    appointmentId: appointmentId || null,
    sharedAt: new Date(),
    expiresAt,
    viewed: false,
    notes: notes || undefined,
  });

  // Add to share history
  report.shareHistory.push({
    sharedWith: doctorId,
    sharedWithModel: 'Doctor',
    sharedWithRole: ROLES.DOCTOR,
    shareType,
    appointmentId: appointmentId || null,
    sharedAt: new Date(),
    sharedBy: patientId,
    sharedByModel: 'Patient',
    sharedByRole: ROLES.PATIENT,
    notes: notes || undefined,
  });

  if (report.status === 'shared_with_patient') {
    report.status = 'shared_with_doctor';
  }

  await report.save();


  return report;
};

const listPatientReports = async ({ patientId }) => {
  return LabReport.find({ patient: patientId })
    .populate('doctor', 'firstName lastName specialization')
    .populate('laboratory', 'labName address phone')
    .populate('prescription', 'diagnosis')
    .sort({ createdAt: -1 })
    .lean();
};

const listDoctorReports = async ({ doctorId }) => {
  const reports = await LabReport.find({
    'sharedWith.sharedWith': doctorId,
    'sharedWith.sharedWithModel': 'Doctor',
    $or: [
      { 'sharedWith.expiresAt': { $exists: false } },
      { 'sharedWith.expiresAt': { $gt: new Date() } },
    ],
  })
    .populate('patient', 'firstName lastName phone email')
    .populate('laboratory', 'labName address phone')
    .populate('prescription', 'diagnosis')
    .sort({ createdAt: -1 })
    .lean();

  // Add share details to each report
  return reports.map((report) => {
    const share = report.sharedWith.find(
      (s) =>
        s.sharedWith.toString() === doctorId.toString() &&
        s.sharedWithModel === 'Doctor' &&
        (!s.expiresAt || s.expiresAt > new Date())
    );
    return {
      ...report,
      shareDetails: share,
      isStored: true, // All accessible reports are considered stored
    };
  });
};

const getReportShareHistory = async ({ reportId, patientId }) => {
  const report = await LabReport.findOne({
    _id: reportId,
    patient: patientId,
  })
    .populate('shareHistory.sharedWith', 'firstName lastName specialization')
    .populate('shareHistory.appointmentId', 'scheduledFor status')
    .lean();

  if (!report) {
    const error = new Error('Report not found');
    error.status = 404;
    throw error;
  }

  return report.shareHistory || [];
};

module.exports = {
  getReportForPatient,
  getReportForDoctor,
  shareReportWithDoctor,
  listPatientReports,
  listDoctorReports,
  getReportShareHistory,
};

