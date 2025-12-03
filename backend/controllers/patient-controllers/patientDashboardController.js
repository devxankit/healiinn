const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');
const Prescription = require('../../models/Prescription');
const LabReport = require('../../models/LabReport');
const Transaction = require('../../models/Transaction');
const Request = require('../../models/Request');

// GET /api/patients/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    upcomingAppointments,
    totalOrders,
    totalPrescriptions,
    activePrescriptions,
    totalReports,
    totalTransactions,
    todayAppointments,
    todayOrders,
    pendingRequests,
    recentOrders,
    recommendedDoctors,
  ] = await Promise.all([
    // Total appointments
    Appointment.countDocuments({ patientId: id }),
    // Upcoming appointments (next 7 days)
    Appointment.find({
      patientId: id,
      appointmentDate: { $gte: today },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
    })
      .populate('doctorId', 'firstName lastName specialization profileImage consultationFee rating')
      .sort({ appointmentDate: 1 })
      .limit(5),
    // Total orders
    Order.countDocuments({ patientId: id }),
    // Total prescriptions
    Prescription.countDocuments({ patientId: id }),
    // Active prescriptions
    Prescription.countDocuments({ patientId: id, status: 'active' }),
    // Total lab reports
    LabReport.countDocuments({ patientId: id }),
    // Total transactions
    Transaction.countDocuments({ userId: id, userType: 'patient' }),
    // Today's appointments
    Appointment.countDocuments({
      patientId: id,
      appointmentDate: { $gte: today, $lt: tomorrow },
    }),
    // Today's orders
    Order.countDocuments({
      patientId: id,
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    // Pending requests
    Request.countDocuments({ 
      patientId: id, 
      status: { $in: ['pending', 'accepted', 'confirmed'] } 
    }),
    // Recent orders (last 30 days)
    Order.find({ patientId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('providerId', 'pharmacyName labName')
      .select('totalAmount status createdAt items'),
    // Recommended doctors (top rated, approved)
    require('../../models/Doctor')
      .find({ status: 'approved', isActive: true })
      .select('firstName lastName specialization profileImage consultationFee rating')
      .sort({ rating: -1 })
      .limit(5),
  ]);

  // Transform upcoming appointments
  const transformedUpcomingAppointments = upcomingAppointments.map(apt => ({
    _id: apt._id,
    id: apt._id,
    doctorId: apt.doctorId?._id || apt.doctorId,
    doctorName: apt.doctorId?.firstName && apt.doctorId?.lastName
      ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
      : apt.doctorId?.name || 'Doctor',
    doctorSpecialty: apt.doctorId?.specialization || apt.doctorId?.specialty || 'General',
    doctorImage: apt.doctorId?.profileImage || null,
    appointmentDate: apt.appointmentDate,
    appointmentTime: apt.appointmentTime,
    status: apt.status,
    consultationFee: apt.doctorId?.consultationFee || 0,
    type: apt.type || 'in_person',
  }));

  // Transform recommended doctors
  const transformedDoctors = recommendedDoctors.map(doctor => ({
    _id: doctor._id,
    id: doctor._id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
    specialization: doctor.specialization,
    specialty: doctor.specialization,
    profileImage: doctor.profileImage,
    consultationFee: doctor.consultationFee,
    rating: doctor.rating || 0,
  }));

  // Transform recent orders
  const transformedRecentOrders = recentOrders.map(order => ({
    _id: order._id,
    id: order._id,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    providerName: order.providerId?.pharmacyName || order.providerId?.labName || 'Provider',
    items: order.items || [],
  }));

  return res.status(200).json({
    success: true,
    data: {
      totalAppointments,
      upcomingAppointments: transformedUpcomingAppointments,
      upcomingAppointmentsCount: transformedUpcomingAppointments.length,
      totalOrders,
      recentOrders: transformedRecentOrders.length, // Count of recent orders
      recentOrdersList: transformedRecentOrders, // List of recent orders
      totalPrescriptions,
      activePrescriptions, // Active prescriptions count
      totalReports,
      totalTransactions,
      pendingRequests, // Pending requests count
      todayAppointments,
      todayOrders,
      recommendedDoctors: transformedDoctors,
    },
  });
});

