const { getModelForRole, ROLES } = require('../utils/getModelForRole');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toPlainObject = (value) => (value && typeof value.toObject === 'function' ? value.toObject() : value);

const ensureUniqueField = async (Model, field, value, currentId, message) => {
  if (!value) {
    return;
  }

  const existing = await Model.findOne({ [field]: value, _id: { $ne: currentId } });

  if (existing) {
    throw createError(409, message || `${field} already in use.`);
  }
};

const mergeObjects = (existingValue, newValue) => {
  if (!newValue || typeof newValue !== 'object') {
    return existingValue;
  }

  const base = existingValue ? toPlainObject(existingValue) : {};
  return { ...base, ...newValue };
};

const applyPatientUpdates = async (doc, updates, Model) => {
  const allowedScalars = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup', 'profileImage'];
  const mergeFields = ['address', 'emergencyContact'];
  const arrayReplaceFields = ['medicalHistory', 'allergies'];

  if (updates.email && updates.email !== doc.email) {
    await ensureUniqueField(Model, 'email', updates.email, doc._id, 'Email already registered.');
    doc.email = updates.email.toLowerCase().trim();
  }

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  mergeFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  });

  arrayReplaceFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = updates[field];
      doc.markModified(field);
    }
  });
};

const applyDoctorUpdates = async (doc, updates, Model) => {
  const allowedScalars = [
    'firstName',
    'lastName',
    'experienceYears',
    'bio',
    'specialization',
    'gender',
    'consultationFee',
    'profileImage',
  ];
  const mergeFields = ['clinicDetails', 'documents'];
  const arrayReplaceFields = ['education', 'languages', 'consultationModes', 'availableTimings'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  mergeFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  });

  arrayReplaceFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = updates[field];
      doc.markModified(field);
    }
  });
};

const applyLaboratoryUpdates = async (doc, updates, Model) => {
  const allowedScalars = ['labName', 'ownerName', 'profileImage'];
  const mergeFields = ['address', 'contactPerson', 'documents', 'operatingHours'];
  const arrayReplaceFields = ['certifications', 'servicesOffered', 'timings'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  mergeFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  });

  arrayReplaceFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = updates[field];
      doc.markModified(field);
    }
  });
};

const applyPharmacyUpdates = async (doc, updates, Model) => {
  const allowedScalars = ['pharmacyName', 'ownerName', 'gstNumber', 'profileImage'];
  const mergeFields = ['address', 'contactPerson', 'documents'];
  const arrayReplaceFields = ['deliveryOptions', 'timings'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  mergeFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  });

  arrayReplaceFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = updates[field];
      doc.markModified(field);
    }
  });
};

const applyAdminUpdates = async (doc, updates, Model, { requester } = {}) => {
  const allowedScalars = ['name', 'phone', 'profileImage'];

  if (updates.email && updates.email !== doc.email) {
    throw createError(400, 'Email cannot be changed.');
  }

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'permissions')) {
    if (!requester || !requester.isSuperAdmin) {
      throw createError(403, 'Only super admins can update permissions.');
    }
    doc.permissions = Array.isArray(updates.permissions) ? updates.permissions : [];
    doc.markModified('permissions');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'isActive')) {
    if (!requester || !requester.isSuperAdmin || String(doc._id) === String(requester._id)) {
      throw createError(403, 'Only super admins can change active status of other admins.');
    }
    doc.isActive = Boolean(updates.isActive);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'isSuperAdmin')) {
    if (!requester || !requester.isSuperAdmin || String(doc._id) === String(requester._id)) {
      throw createError(403, 'Only super admins can modify super admin status of other admins.');
    }
    doc.isSuperAdmin = Boolean(updates.isSuperAdmin);
  }
};

const updateHandlers = {
  [ROLES.PATIENT]: applyPatientUpdates,
  [ROLES.DOCTOR]: applyDoctorUpdates,
  [ROLES.LABORATORY]: applyLaboratoryUpdates,
  [ROLES.PHARMACY]: applyPharmacyUpdates,
  [ROLES.ADMIN]: applyAdminUpdates,
};

const getProfileByRoleAndId = async (role, id) => {
  const Model = getModelForRole(role);
  const document = await Model.findById(id).select('-password');

  if (!document) {
    throw createError(404, `${role} not found`);
  }

  return document;
};

const updateProfileByRoleAndId = async (role, id, updates, options = {}) => {
  const Model = getModelForRole(role);
  const document = await Model.findById(id);

  if (!document) {
    throw createError(404, `${role} not found`);
  }

  const handler = updateHandlers[role];

  if (!handler) {
    throw createError(400, 'Profile updates are not supported for this role.');
  }

  await handler(document, updates, Model, options);

  await document.save();

  return Model.findById(id).select('-password');
};

module.exports = {
  getProfileByRoleAndId,
  updateProfileByRoleAndId,
};


