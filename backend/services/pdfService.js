const PDFDocument = require('pdfkit');
const { uploadFromBuffer } = require('./fileUploadService');

/**
 * Generate prescription PDF
 * @param {Object} prescriptionData - Prescription data
 * @param {Object} doctorData - Doctor data
 * @param {Object} patientData - Patient data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePrescriptionPDF = async (prescriptionData, doctorData, patientData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      if (doctorData.letterhead?.logo) {
        doc.image(doctorData.letterhead.logo, 50, 50, { width: 100 });
      }

      doc.fontSize(20).text(doctorData.letterhead?.clinicName || 'Prescription', 160, 50);
      if (doctorData.letterhead?.tagline) {
        doc.fontSize(12).text(doctorData.letterhead.tagline, 160, 75);
      }

      // Doctor Information
      doc.fontSize(14).text('Doctor Information', 50, 150);
      doc.fontSize(10).text(`Name: Dr. ${doctorData.firstName} ${doctorData.lastName}`, 50, 170);
      doc.text(`Specialization: ${doctorData.specialization}`, 50, 185);
      if (doctorData.licenseNumber) {
        doc.text(`License: ${doctorData.licenseNumber}`, 50, 200);
      }

      // Patient Information
      doc.fontSize(14).text('Patient Information', 50, 230);
      doc.fontSize(10).text(`Name: ${patientData.firstName} ${patientData.lastName}`, 50, 250);
      if (patientData.dateOfBirth) {
        doc.text(`Date of Birth: ${new Date(patientData.dateOfBirth).toLocaleDateString()}`, 50, 265);
      }
      if (patientData.phone) {
        doc.text(`Phone: ${patientData.phone}`, 50, 280);
      }

      // Prescription Date
      doc.fontSize(14).text('Prescription Details', 50, 310);
      doc.fontSize(10).text(`Date: ${new Date(prescriptionData.createdAt).toLocaleDateString()}`, 50, 330);

      // Medications
      if (prescriptionData.medications && prescriptionData.medications.length > 0) {
        doc.fontSize(14).text('Medications', 50, 360);
        let yPos = 380;
        prescriptionData.medications.forEach((med, index) => {
          doc.fontSize(10).text(`${index + 1}. ${med.name}`, 50, yPos);
          if (med.dosage) doc.text(`   Dosage: ${med.dosage}`, 70, yPos + 15);
          if (med.frequency) doc.text(`   Frequency: ${med.frequency}`, 70, yPos + 30);
          if (med.duration) doc.text(`   Duration: ${med.duration}`, 70, yPos + 45);
          if (med.instructions) doc.text(`   Instructions: ${med.instructions}`, 70, yPos + 60);
          yPos += 90;
        });
      }

      // Notes
      if (prescriptionData.notes) {
        doc.fontSize(14).text('Notes', 50, yPos + 20);
        doc.fontSize(10).text(prescriptionData.notes, 50, yPos + 40, { width: 500 });
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).text('This is a computer-generated prescription.', 50, footerY, { align: 'center' });

      // Digital Signature
      if (doctorData.digitalSignature?.imageUrl) {
        doc.image(doctorData.digitalSignature.imageUrl, 400, footerY - 30, { width: 100 });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate lab report PDF
 * @param {Object} reportData - Lab report data
 * @param {Object} laboratoryData - Laboratory data
 * @param {Object} patientData - Patient data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateLabReportPDF = async (reportData, laboratoryData, patientData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Laboratory Report', 50, 50, { align: 'center' });
      doc.fontSize(12).text(laboratoryData.labName, 50, 75, { align: 'center' });

      // Patient Information
      doc.fontSize(14).text('Patient Information', 50, 120);
      doc.fontSize(10).text(`Name: ${patientData.firstName} ${patientData.lastName}`, 50, 140);
      if (patientData.dateOfBirth) {
        doc.text(`Date of Birth: ${new Date(patientData.dateOfBirth).toLocaleDateString()}`, 50, 155);
      }
      if (patientData.phone) {
        doc.text(`Phone: ${patientData.phone}`, 50, 170);
      }

      // Report Details
      doc.fontSize(14).text('Test Details', 50, 200);
      doc.fontSize(10).text(`Test Name: ${reportData.testName}`, 50, 220);
      doc.text(`Report Date: ${new Date(reportData.reportDate).toLocaleDateString()}`, 50, 235);

      // Results
      if (reportData.results && reportData.results.length > 0) {
        doc.fontSize(14).text('Test Results', 50, 265);
        let yPos = 285;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Parameter', 50, yPos);
        doc.text('Value', 200, yPos);
        doc.text('Unit', 300, yPos);
        doc.text('Normal Range', 350, yPos);
        doc.text('Status', 450, yPos);

        yPos += 20;
        doc.font('Helvetica');

        reportData.results.forEach((result) => {
          doc.text(result.parameter || '-', 50, yPos);
          doc.text(result.value || '-', 200, yPos);
          doc.text(result.unit || '-', 300, yPos);
          doc.text(result.normalRange || '-', 350, yPos);
          doc.text(result.status || 'normal', 450, yPos);
          yPos += 20;
        });
      }

      // Notes
      if (reportData.notes) {
        doc.fontSize(14).text('Notes', 50, yPos + 20);
        doc.fontSize(10).text(reportData.notes, 50, yPos + 40, { width: 500 });
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).text('This is a computer-generated report.', 50, footerY, { align: 'center' });
      doc.text(`Reported by: ${laboratoryData.labName}`, 50, footerY + 15, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Upload PDF to local storage and return URL
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {String} folder - Folder path (default: 'prescriptions')
 * @param {String} fileName - File name (optional)
 * @returns {Promise<String>} PDF URL
 */
const uploadPrescriptionPDF = async (pdfBuffer, folder = 'prescriptions', fileName = null) => {
  const result = await uploadFromBuffer(
    pdfBuffer,
    fileName || `prescription_${Date.now()}.pdf`,
    'application/pdf',
    folder,
    'prescription'
  );
  return result.url;
};

const uploadLabReportPDF = async (pdfBuffer, folder = 'reports', fileName = null) => {
  const result = await uploadFromBuffer(
    pdfBuffer,
    fileName || `report_${Date.now()}.pdf`,
    'application/pdf',
    folder,
    'report'
  );
  return result.url;
};

module.exports = {
  generatePrescriptionPDF,
  generateLabReportPDF,
  uploadPrescriptionPDF,
  uploadLabReportPDF,
};

