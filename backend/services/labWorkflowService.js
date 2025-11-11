const LabLead = require('../models/LabLead');
const { LAB_LEAD_STATUS } = require('../utils/constants');

const listLeadsForLab = ({ laboratoryId }) =>
  LabLead.find({
    preferredLaboratories: laboratoryId,
    status: LAB_LEAD_STATUS.NEW,
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
  listLeadsForLab,
};

