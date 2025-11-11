const PharmacyLead = require('../models/PharmacyLead');
const { PHARMACY_LEAD_STATUS } = require('../utils/constants');

const listLeadsForPharmacy = ({ pharmacyId }) =>
  PharmacyLead.find({
    preferredPharmacies: pharmacyId,
    status: PHARMACY_LEAD_STATUS.NEW,
  })
    .populate(
      'doctor',
      'firstName lastName phone email clinicDetails specialization consultationFee'
    )
    .populate('patient', 'firstName lastName phone email address')
    .populate(
      'prescription',
      'diagnosis medications investigations advice metadata issuedAt'
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

module.exports = {
  listLeadsForPharmacy,
};

