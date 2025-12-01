const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Medicine = require('../../models/Medicine');
const Patient = require('../../models/Patient');
const WalletTransaction = require('../../models/WalletTransaction');

// GET /api/pharmacy/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalOrders,
    todayOrders,
    totalMedicines,
    totalPatients,
    totalEarnings,
    todayEarnings,
  ] = await Promise.all([
    Order.countDocuments({ providerId: id, providerType: 'pharmacy' }),
    Order.countDocuments({
      providerId: id,
      providerType: 'pharmacy',
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    Medicine.countDocuments({ pharmacyId: id, isActive: true }),
    Order.distinct('patientId', { providerId: id, providerType: 'pharmacy' }).then(ids => ids.length),
    WalletTransaction.aggregate([
      { $match: { userId: id, userType: 'pharmacy', type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(result => result[0]?.total || 0),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: id,
          userType: 'pharmacy',
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
      totalOrders,
      todayOrders,
      totalMedicines,
      totalPatients,
      totalEarnings,
      todayEarnings,
    },
  });
});

