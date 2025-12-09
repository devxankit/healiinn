const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Order = require('../../models/Order');
const Prescription = require('../../models/Prescription');
const LabReport = require('../../models/LabReport');
const Transaction = require('../../models/Transaction');
const Request = require('../../models/Request');
const Session = require('../../models/Session');
const { calculateQueueETAs } = require('../../services/etaService');

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
    // Upcoming appointments (next 7 days) - exclude pending payment appointments
    Appointment.find({
      patientId: id,
      appointmentDate: { $gte: today },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
      paymentStatus: { $ne: 'pending' }, // Exclude pending payment appointments
    })
      .populate('doctorId', 'firstName lastName specialization profileImage consultationFee rating clinicDetails')
      .populate('sessionId', 'date sessionStartTime sessionEndTime')
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
      .select('firstName lastName specialization profileImage consultationFee rating clinicDetails reviewCount')
      .sort({ rating: -1 })
      .limit(5),
  ]);

  // Transform upcoming appointments with full data including location
  const transformedUpcomingAppointments = upcomingAppointments.map(apt => {
    // Format clinic address
    const formatFullAddress = (clinicDetails) => {
      if (!clinicDetails?.address) return null;
      const addr = clinicDetails.address;
      const parts = [];
      if (addr.line1) parts.push(addr.line1);
      if (addr.line2) parts.push(addr.line2);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.pincode || addr.postalCode) parts.push(addr.pincode || addr.postalCode);
      return parts.join(', ').trim();
    };

    return {
    _id: apt._id,
    id: apt._id,
    doctorId: apt.doctorId?._id || apt.doctorId,
    doctorName: apt.doctorId?.firstName && apt.doctorId?.lastName
      ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
      : apt.doctorId?.name || 'Doctor',
    doctorSpecialty: apt.doctorId?.specialization || apt.doctorId?.specialty || 'General',
    doctorImage: apt.doctorId?.profileImage || null,
    appointmentDate: apt.appointmentDate,
      appointmentTime: apt.time || apt.appointmentTime,
    status: apt.status,
    consultationFee: apt.doctorId?.consultationFee || 0,
      type: apt.appointmentType || apt.type || 'in_person',
      clinic: apt.doctorId?.clinicDetails?.name || null,
      location: formatFullAddress(apt.doctorId?.clinicDetails) || null,
      tokenNumber: apt.tokenNumber || null,
      fee: apt.fee || apt.doctorId?.consultationFee || 0,
    };
  });

  // Transform recommended doctors with session/token info
  // Reuse today variable from above (already set at line 14)
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const transformedDoctors = await Promise.all(
    recommendedDoctors.map(async (doctor) => {
      // Get today's session for this doctor
      const todaySession = await Session.findOne({
        doctorId: doctor._id,
        date: { $gte: today, $lt: todayEnd },
        status: { $in: ['scheduled', 'live', 'paused'] },
      });

      let currentToken = 0;
      let isServing = false;
      let eta = null;
      let nextToken = null;

      if (todaySession) {
        currentToken = todaySession.currentToken || 0;
        isServing = todaySession.status === 'live' && !todaySession.isPaused;
        
        // Calculate next token number if slots available
        if (todaySession.currentToken < todaySession.maxTokens) {
          nextToken = todaySession.currentToken + 1;
          
          // Calculate ETA for next patient
          const etas = await calculateQueueETAs(todaySession._id);
          const nextPatient = etas.find(e => e.patientsAhead === 0);
          if (nextPatient) {
            eta = `${nextPatient.estimatedWaitMinutes} min`;
          }
        }
      }

      // Format full address
      const formatFullAddress = (clinicDetails) => {
        if (!clinicDetails) return null;
        
        const parts = [];
        if (clinicDetails.name) parts.push(clinicDetails.name);
        
        if (clinicDetails.address) {
          const addr = clinicDetails.address;
          if (addr.line1) parts.push(addr.line1);
          if (addr.line2) parts.push(addr.line2);
          if (addr.city) parts.push(addr.city);
          if (addr.state) parts.push(addr.state);
          if (addr.postalCode) parts.push(addr.postalCode);
          if (addr.country) parts.push(addr.country);
        }
        
        return parts.length > 0 ? parts.join(', ') : null;
      };

      return {
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
        reviewCount: doctor.reviewCount || 0,
        clinicName: doctor.clinicDetails?.name || null,
        clinicAddress: formatFullAddress(doctor.clinicDetails),
        isServing,
        currentToken,
        nextToken,
        eta,
      };
    })
  );

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

