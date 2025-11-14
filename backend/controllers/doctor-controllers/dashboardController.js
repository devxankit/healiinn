const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');
const LabLead = require('../../models/LabLead');
const Notification = require('../../models/Notification');
const Patient = require('../../models/Patient');
const { ROLES, CONSULTATION_STATUS } = require('../../utils/constants');
const { getDoctorWalletSummary, COMMISSION_RATE } = require('../../services/walletService');

const toObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfMonth = (date) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const startOfYear = (date) => {
  const d = startOfDay(date);
  d.setMonth(0, 1);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const mapPatientSummary = (patient) =>
  patient
    ? {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        gender: patient.gender || null,
        phone: patient.phone || null,
        email: patient.email || null,
      }
    : null;

const mapClinicSummary = (clinic) =>
  clinic
    ? {
        id: clinic._id,
        name: clinic.name,
        address: clinic.address || null,
      }
    : null;

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const doctorId = toObjectId(req.auth.id);
    const now = new Date();

    const dayStart = startOfDay(now);
    const dayEnd = addDays(dayStart, 1);

    const monthStart = startOfMonth(now);
    const monthEnd = addMonths(monthStart, 1);

    const yearStart = startOfYear(now);
    const yearEnd = addYears(yearStart, 1);

    const appointmentBaseFilter = {
      doctor: doctorId,
      status: { $nin: ['cancelled', 'no_show'] },
    };

    const [
      dailyAppointments,
      monthlyAppointments,
      yearlyAppointments,
      distinctPatients,
      totalPrescriptions,
      upcomingAppointmentsRaw,
      recentReportsRaw,
      notificationsRaw,
      walletSummary,
    ] = await Promise.all([
      Appointment.countDocuments({
        ...appointmentBaseFilter,
        scheduledFor: { $gte: dayStart, $lt: dayEnd },
      }),
      Appointment.countDocuments({
        ...appointmentBaseFilter,
        scheduledFor: { $gte: monthStart, $lt: monthEnd },
      }),
      Appointment.countDocuments({
        ...appointmentBaseFilter,
        scheduledFor: { $gte: yearStart, $lt: yearEnd },
      }),
      Consultation.distinct('patient', {
        doctor: doctorId,
        status: CONSULTATION_STATUS.COMPLETED,
      }),
      Prescription.countDocuments({ doctor: doctorId }),
      Appointment.find({
        ...appointmentBaseFilter,
        scheduledFor: { $gte: now },
      })
        .populate('patient', 'firstName lastName gender phone email')
        .populate('clinic', 'name address')
        .sort({ scheduledFor: 1 })
        .limit(5)
        .lean(),
      LabLead.find({
        doctor: doctorId,
        'reportDetails.uploadedAt': { $exists: true },
      })
        .populate('patient', 'firstName lastName gender phone email')
        .populate('preferredLaboratories', 'labName phone email address')
        .sort({ 'reportDetails.uploadedAt': -1 })
        .limit(5)
        .lean(),
      Notification.find({
        'recipients.user': doctorId,
        'recipients.role': ROLES.DOCTOR,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      getDoctorWalletSummary(doctorId),
    ]);

    const upcomingAppointments = upcomingAppointmentsRaw.map((item) => ({
      id: item._id,
      scheduledFor: item.scheduledFor,
      status: item.status,
      reason: item.reason || null,
      type: item.type || null,
      patient: mapPatientSummary(item.patient),
      clinic: mapClinicSummary(item.clinic),
    }));

    const recentReports = recentReportsRaw.map((item) => {
      const labs = (item.preferredLaboratories || []).map((lab) => ({
        id: lab._id,
        name: lab.labName,
        phone: lab.phone || null,
        email: lab.email || null,
        address: lab.address || null,
      }));

      return {
        id: item._id,
        uploadedAt: item.reportDetails?.uploadedAt || null,
        fileUrl: item.reportDetails?.fileUrl || null,
        fileName: item.reportDetails?.fileName || null,
        mimeType: item.reportDetails?.mimeType || null,
        notes: item.reportDetails?.notes || null,
        patient: mapPatientSummary(item.patient),
        laboratories: labs,
      };
    });

    const notifications = notificationsRaw.map((item) => {
      const recipient = (item.recipients || []).find(
        (entry) =>
          entry.role === ROLES.DOCTOR &&
          entry.user &&
          entry.user.toString() === doctorId.toString()
      );

      return {
        id: item._id,
        title: item.title,
        message: item.message,
        type: item.type || null,
        priority: item.priority || 'normal',
        createdAt: item.createdAt,
        readAt: recipient?.readAt || null,
        data: item.data || null,
      };
    });

    res.json({
      success: true,
      metrics: {
        appointments: {
          daily: dailyAppointments,
          monthly: monthlyAppointments,
          yearly: yearlyAppointments,
        },
        patientsConsulted: distinctPatients.length,
        prescriptionsCreated: totalPrescriptions,
      },
      wallet: {
        ...walletSummary,
        commissionRate: COMMISSION_RATE,
      },
      upcomingAppointments,
      recentReports,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

