const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const PDFDocument = require('pdfkit');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const { TOKEN_EVENTS } = require('../utils/constants');
const { notifyPrescriptionReady } = require('./notificationEvents');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const ensureDirectory = async (dirPath) => {
  try {
    await mkdirAsync(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const generatePrescriptionPdf = async ({ prescription, doctor, patient }) => {
  const uploadsDir = path.join(process.cwd(), 'backend', 'uploads', 'prescriptions');
  await ensureDirectory(uploadsDir);

  const fileName = `prescription-${prescription._id}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text('Healiinn Prescription', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Prescription ID: ${prescription._id}`);
  doc.text(`Doctor: ${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim());
  if (doctor?.phone) {
    doc.text(`Doctor Mobile: ${doctor.phone}`);
  }
  const clinic = doctor?.clinicDetails || {};
  if (clinic.name) {
    doc.text(`Clinic: ${clinic.name}`);
  }
  if (clinic.address) {
    const clinicAddress = [
      clinic.address.line1,
      clinic.address.line2,
      clinic.address.city,
      clinic.address.state,
      clinic.address.postalCode,
      clinic.address.country,
    ]
      .filter(Boolean)
      .join(', ');
    if (clinicAddress) {
      doc.text(`Clinic Address: ${clinicAddress}`);
    }
  }

  doc.text(`Patient: ${patient?.firstName || ''} ${patient?.lastName || ''}`.trim());
  if (patient?.phone) {
    doc.text(`Patient Mobile: ${patient.phone}`);
  }
  if (patient?.email) {
    doc.text(`Patient Email: ${patient.email}`);
  }
  if (patient?.address) {
    const patientAddress = [
      patient.address.line1,
      patient.address.line2,
      patient.address.city,
      patient.address.state,
      patient.address.postalCode,
      patient.address.country,
    ]
      .filter(Boolean)
      .join(', ');
    if (patientAddress) {
      doc.text(`Patient Address: ${patientAddress}`);
    }
  }
  doc.text(`Date: ${new Date().toLocaleString('en-IN')}`);
  doc.moveDown();

  if (prescription.diagnosis) {
    doc.fontSize(14).text('Diagnosis', { underline: true });
    doc.fontSize(12).text(prescription.diagnosis);
    doc.moveDown();
  }

  if (prescription.medications?.length) {
    doc.fontSize(14).text('Medications', { underline: true });
    prescription.medications.forEach((med, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${med.name} - ${med.dosage || ''} - ${med.frequency || ''} - ${med.duration || ''}`
      );
      if (med.instructions) {
        doc.fontSize(10).text(`Instructions: ${med.instructions}`);
      }
    });
    doc.moveDown();
  }

  if (prescription.investigations?.length) {
    doc.fontSize(14).text('Investigations', { underline: true });
    prescription.investigations.forEach((investigation, index) => {
      doc.fontSize(12).text(`${index + 1}. ${investigation.name} - ${investigation.notes || ''}`);
    });
    doc.moveDown();
  }

  if (prescription.advice) {
    doc.fontSize(14).text('Advice', { underline: true });
    doc.fontSize(12).text(prescription.advice);
    doc.moveDown();
  }

  doc.fontSize(10).text('Digitally signed by Healiinn', { align: 'right' });
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filePath;
};

const createPrescription = async ({
  consultationId,
  doctorId,
  payload,
  io,
}) => {
  const consultation = await Consultation.findById(consultationId)
    .populate('doctor', 'firstName lastName phone clinicDetails email')
    .populate('patient', 'firstName lastName phone email address')
    .populate('session')
    .populate('token');

  if (!consultation) {
    const error = new Error('Consultation not found');
    error.status = 404;
    throw error;
  }

  if (consultation.doctor._id.toString() !== doctorId.toString()) {
    const error = new Error('Consultation does not belong to the doctor');
    error.status = 403;
    throw error;
  }

  let prescription = await Prescription.findOne({ consultation: consultationId });

  if (prescription) {
    prescription.set({
      ...payload,
      doctor: consultation.doctor._id,
      patient: consultation.patient._id,
      appointment: consultation.appointment,
      consultation: consultation._id,
    });
  } else {
    prescription = new Prescription({
      ...payload,
      doctor: consultation.doctor._id,
      patient: consultation.patient._id,
      appointment: consultation.appointment,
      consultation: consultation._id,
    });
  }

  await prescription.save();

  const pdfPath = await generatePrescriptionPdf({
    prescription,
    doctor: consultation.doctor,
    patient: consultation.patient,
  });

  prescription.metadata = prescription.metadata || {};
  prescription.metadata.pdfPath = pdfPath;
  await prescription.save();

  if (io && consultation.session) {
    io.to(`session:${consultation.session._id}`).emit(TOKEN_EVENTS.PRESCRIPTION_READY, {
      sessionId: consultation.session._id.toString(),
      tokenId: consultation.token?.toString(),
      prescriptionId: prescription._id.toString(),
    });
  }

  await notifyPrescriptionReady({
    patientId: consultation.patient._id,
    doctorName: `${consultation.doctor.firstName || ''} ${consultation.doctor.lastName || ''}`.trim(),
    prescriptionId: prescription._id,
  });

  return { prescription };
};

module.exports = {
  createPrescription,
};

