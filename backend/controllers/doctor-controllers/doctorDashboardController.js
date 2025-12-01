const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Consultation = require('../../models/Consultation');
const Patient = require('../../models/Patient');
const Session = require('../../models/Session');
const WalletTransaction = require('../../models/WalletTransaction');

// GET /api/doctors/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    todayAppointments,
    totalConsultations,
    totalPatients,
    totalEarnings,
    todayEarnings,
  ] = await Promise.all([
    Appointment.countDocuments({ doctorId: id }),
    Appointment.countDocuments({
      doctorId: id,
      appointmentDate: { $gte: today, $lt: tomorrow },
    }),
    Consultation.countDocuments({ doctorId: id, status: 'completed' }),
    Appointment.distinct('patientId', { doctorId: id }).then(ids => ids.length),
    WalletTransaction.aggregate([
      { $match: { userId: id, userType: 'doctor', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: id,
          userType: 'doctor',
          type: 'earning',
          status: 'completed',
          createdAt: { $gte: today },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalAppointments,
      todayAppointments,
      totalConsultations,
      totalPatients,
      totalEarnings,
      todayEarnings,
    },
  });
});

// GET /api/doctors/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date, status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { doctorId: id };
  if (status) filter.status = status;
  if (date) {
    const dateObj = new Date(date);
    filter.appointmentDate = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
    };
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'firstName lastName phone profileImage')
      .populate('sessionId', 'date sessionStartTime sessionEndTime')
      .sort({ appointmentDate: 1, time: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/doctors/appointments/today
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.find({
    doctorId: id,
    appointmentDate: { $gte: today, $lt: tomorrow },
    status: { $in: ['scheduled', 'confirmed'] },
  })
    .populate('patientId', 'firstName lastName phone profileImage')
    .populate('sessionId', 'date sessionStartTime sessionEndTime')
    .sort({ time: 1 });

  return res.status(200).json({
    success: true,
    data: appointments,
  });
});

