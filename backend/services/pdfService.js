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

      let yPos = 50;

      // Header - Healiinn (Above Clinic Name)
      doc.fontSize(24).font('Helvetica-Bold').fillColor(17, 73, 108).text('Healiinn', 50, yPos, { align: 'center' });
      yPos += 15;
      
      // Clinic Name (if available) - Below Healiinn
      if (doctorData.letterhead?.clinicName) {
        doc.fontSize(16).font('Helvetica').fillColor(0, 0, 0).text(doctorData.letterhead.clinicName, 50, yPos, { align: 'center' });
        yPos += 10;
      } else if (doctorData.clinicName) {
        doc.fontSize(16).font('Helvetica').fillColor(0, 0, 0).text(doctorData.clinicName, 50, yPos, { align: 'center' });
        yPos += 10;
      }

      // Clinic Address (if available)
      if (doctorData.letterhead?.address) {
        doc.fontSize(9).text(doctorData.letterhead.address, 50, yPos, { align: 'center' });
        yPos += 8;
      }
      
      // Contact Info
      if (doctorData.letterhead?.phone || doctorData.letterhead?.email) {
        const contactInfo = [];
        if (doctorData.letterhead.phone) contactInfo.push(`Phone: ${doctorData.letterhead.phone}`);
        if (doctorData.letterhead.email) contactInfo.push(`Email: ${doctorData.letterhead.email}`);
        doc.fontSize(9).text(contactInfo.join(' | '), 50, yPos, { align: 'center' });
        yPos += 15;
      }

      // Doctor Information (Left)
      doc.fontSize(12).font('Helvetica-Bold').fillColor(0, 0, 0).text('Doctor Information', 50, yPos);
      yPos += 15;
      doc.fontSize(10).font('Helvetica').text(`Name: Dr. ${doctorData.firstName} ${doctorData.lastName}`, 50, yPos);
      yPos += 12;
      doc.text(`Specialty: ${doctorData.specialization || 'General Physician'}`, 50, yPos);
      yPos += 12;
      doc.text(`Date: ${new Date(prescriptionData.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, yPos);
      yPos += 20;

      // Patient Information (Right)
      const patientYPos = yPos - 35;
      doc.fontSize(12).font('Helvetica-Bold').text('Patient Information', 400, patientYPos);
      let currentPatientY = patientYPos + 15;
      doc.fontSize(10).font('Helvetica').text(`Name: ${patientData.firstName} ${patientData.lastName}`, 400, currentPatientY);
      currentPatientY += 12;
      if (patientData.dateOfBirth) {
        const age = Math.floor((new Date() - new Date(patientData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
        doc.text(`Age: ${age} years`, 400, currentPatientY);
        currentPatientY += 12;
      }
      doc.text(`Gender: ${patientData.gender || 'N/A'}`, 400, currentPatientY);
      currentPatientY += 12;
      if (patientData.phone) {
        doc.text(`Phone: ${patientData.phone}`, 400, currentPatientY);
        currentPatientY += 12;
      }
      if (patientData.address) {
        let addressText = '';
        if (typeof patientData.address === 'string') {
          addressText = patientData.address;
        } else if (typeof patientData.address === 'object') {
          // Build address string from object
          const addressParts = [];
          if (patientData.address.line1) addressParts.push(patientData.address.line1);
          if (patientData.address.line2) addressParts.push(patientData.address.line2);
          if (patientData.address.city) addressParts.push(patientData.address.city);
          if (patientData.address.state) addressParts.push(patientData.address.state);
          if (patientData.address.pincode || patientData.address.postalCode) {
            addressParts.push(patientData.address.pincode || patientData.address.postalCode);
          }
          addressText = addressParts.join(', ').trim();
        }
        
        if (addressText && addressText !== '[object Object]') {
          const addressLines = doc.splitTextToSize(`Address: ${addressText}`, 150);
          addressLines.forEach((line, index) => {
            doc.text(line, 400, currentPatientY + (index * 12), { align: 'left' });
          });
          currentPatientY += addressLines.length * 12;
        }
      }

      // Set yPos to max of doctor and patient info
      yPos = Math.max(yPos, currentPatientY) + 15;

      // Diagnosis Section
      doc.fontSize(12).font('Helvetica-Bold').text('Diagnosis', 50, yPos);
      yPos += 15;
      const diagnosisText = prescriptionData.diagnosis || prescriptionData.consultationId?.diagnosis || 'N/A';
      doc.fontSize(10).font('Helvetica').fillColor(230, 240, 255).rect(50, yPos - 5, 500, 15).fill();
      doc.fillColor(0, 0, 0).text(diagnosisText, 55, yPos);
      yPos += 25;

      // Symptoms Section
      const symptoms = prescriptionData.symptoms || prescriptionData.consultationId?.symptoms;
      if (symptoms) {
        doc.fontSize(12).font('Helvetica-Bold').text('Symptoms', 50, yPos);
        yPos += 15;
        doc.fontSize(10).font('Helvetica');
        const symptomList = Array.isArray(symptoms) ? symptoms : (typeof symptoms === 'string' ? symptoms.split('\n').filter(s => s.trim()) : []);
        symptomList.forEach((symptom) => {
          const symptomText = typeof symptom === 'string' ? symptom.trim() : String(symptom);
          if (symptomText) {
            doc.fillColor(34, 197, 94).circle(55, yPos - 2, 2, 'F');
            doc.fillColor(0, 0, 0).text(symptomText, 65, yPos);
            yPos += 12;
          }
        });
        yPos += 5;
      }

      // Medications Section
      if (prescriptionData.medications && prescriptionData.medications.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Medications', 50, yPos);
        yPos += 15;
        prescriptionData.medications.forEach((med, index) => {
          doc.fontSize(10).font('Helvetica');
          doc.fillColor(245, 245, 245).rect(50, yPos - 5, 500, 50).fill();
          doc.fillColor(17, 73, 108).circle(480, yPos + 15, 12, 'F');
          doc.fillColor(255, 255, 255).font('Helvetica-Bold').text(String(index + 1), 480, yPos + 12, { align: 'center', width: 24 });
          doc.fillColor(0, 0, 0).font('Helvetica-Bold').text(`${med.name || 'Medication'}`, 70, yPos);
          if (med.dosage) doc.font('Helvetica').text(`Dosage: ${med.dosage}`, 70, yPos + 12);
          if (med.frequency) doc.text(`Frequency: ${med.frequency}`, 70, yPos + 24);
          if (med.duration) doc.text(`Duration: ${med.duration}`, 70, yPos + 36);
          if (med.instructions) doc.text(`Instructions: ${med.instructions}`, 250, yPos + 12, { width: 220 });
          yPos += 60;
        });
        yPos += 5;
      }

      // Investigations/Tests Section
      // Get investigations from prescriptionData directly or from consultationId object
      let investigations = prescriptionData.investigations;
      
      // If not in prescriptionData, try to get from consultationId (which might be the full consultation object)
      if (!investigations || investigations.length === 0) {
        if (prescriptionData.consultationId) {
          // consultationId might be the full consultation object passed from controller
          const consultation = prescriptionData.consultationId;
          if (consultation.investigations && Array.isArray(consultation.investigations) && consultation.investigations.length > 0) {
            investigations = consultation.investigations.map(inv => {
              const invObj = inv.toObject ? inv.toObject() : inv;
              return {
                name: invObj.testName || invObj.name || 'Investigation',
                testName: invObj.testName || invObj.name || 'Investigation',
                notes: invObj.notes || ''
              };
            });
          }
        }
      }
      
      // Debug logging
      console.log('📄 PDF Service - investigations received:', JSON.stringify(investigations, null, 2));
      
      if (investigations && Array.isArray(investigations) && investigations.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Investigations', 50, yPos);
        yPos += 15;
        doc.fontSize(10).font('Helvetica');
        investigations.forEach((inv, index) => {
          // Handle both frontend format (name) and backend format (testName)
          const invObj = inv.toObject ? inv.toObject() : inv;
          const invName = typeof invObj === 'string' 
            ? invObj 
            : (invObj.name || invObj.testName || 'Investigation');
          const invNotes = typeof invObj === 'object' ? (invObj.notes || '') : '';
          const testBoxHeight = invNotes ? 14 : 9;
          doc.fillColor(240, 230, 250).rect(50, yPos - 5, 500, testBoxHeight, 2, 2).fill();
          doc.fillColor(0, 0, 0).font('Helvetica-Bold').text(invName, 55, yPos);
          if (invNotes) {
            doc.fontSize(8).font('Helvetica').fillColor(80, 80, 80).text(invNotes, 55, yPos + 6);
          }
          yPos += testBoxHeight + 3;
        });
        yPos += 5;
      } else {
        console.log('⚠️ PDF Service - No investigations found to display');
      }

      // Medical Advice/Notes
      const advice = prescriptionData.notes || prescriptionData.advice || prescriptionData.consultationId?.advice;
      if (advice) {
        doc.fontSize(12).font('Helvetica-Bold').text('Medical Advice', 50, yPos);
        yPos += 15;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.fillColor(0, 0, 0).text(advice, 50, yPos, { width: 500 });
        yPos += 15;
      }

      // Follow-up Date
      if (prescriptionData.expiryDate || prescriptionData.followUpDate || prescriptionData.consultationId?.followUpDate) {
        const followUpDate = prescriptionData.expiryDate || prescriptionData.followUpDate || prescriptionData.consultationId?.followUpDate;
        if (followUpDate) {
          doc.fontSize(12).font('Helvetica-Bold').text('Follow-up Appointment', 50, yPos);
          yPos += 15;
          doc.fontSize(10).font('Helvetica');
          const followUpDateStr = new Date(followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          doc.fillColor(255, 255, 200).rect(50, yPos - 5, 500, 15).fill();
          doc.fillColor(0, 0, 0).text(followUpDateStr, 55, yPos);
          yPos += 20;
        }
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).font('Helvetica').fillColor(100, 100, 100).text('This is a digitally generated prescription. For any queries, please contact the clinic.', 50, footerY, { align: 'center', width: 500 });

      // Digital Signature
      if (doctorData.digitalSignature?.imageUrl) {
        doc.image(doctorData.digitalSignature.imageUrl, 400, footerY - 30, { width: 100 });
      } else {
        // Draw signature line
        doc.strokeColor(0, 0, 0).lineWidth(0.5).moveTo(400, footerY - 20).lineTo(500, footerY - 20).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(0, 0, 0).text(`Dr. ${doctorData.firstName} ${doctorData.lastName}`, 450, footerY - 10, { align: 'center' });
        doc.fontSize(7).font('Helvetica').text(doctorData.specialization || 'General Physician', 450, footerY - 2, { align: 'center' });
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

