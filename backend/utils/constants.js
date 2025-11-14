const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  LABORATORY: 'laboratory',
  PHARMACY: 'pharmacy',
  ADMIN: 'admin',
};

const SUBSCRIPTION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TOKEN_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  VISITED: 'visited',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  NO_SHOW: 'no_show',
  RECALLED: 'recalled',
  CANCELLED: 'cancelled',
};

const CONSULTATION_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TOKEN_EVENTS = {
  ISSUED: 'token:issued',
  CALLED: 'token:called',
  VISITED: 'token:visited',
  SKIPPED: 'token:skipped',
  RECALLED: 'token:recalled',
  ETA: 'token:eta:update',
  COMPLETED: 'token:completed',
  PRESCRIPTION_READY: 'prescription:ready',
};

const LAB_LEAD_STATUS = {
  NEW: 'new',
  HOME_COLLECTION_REQUESTED: 'home_collection_requested',
  SAMPLE_COLLECTED: 'sample_collected',
  TEST_COMPLETED: 'test_completed',
  REPORT_UPLOADED: 'report_uploaded',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PHARMACY_LEAD_STATUS = {
  NEW: 'new',
  PATIENT_ARRIVED: 'patient_arrived',
  DELIVERY_REQUESTED: 'delivery_requested',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
};

const COMMISSION_RATE = Number(process.env.DOCTOR_COMMISSION_RATE || 0.1);

const JOB_NAMES = {
  ETA_RECALCULATION: 'queue:eta:recalculate',
  AUTO_NOSHOW: 'queue:token:auto-noshow',
  NOTIFICATION_DISPATCH: 'notification:dispatch',
  PAYOUT_RECONCILIATION: 'payments:reconcile',
  SUBSCRIPTION_EXPIRY: 'subscription:auto-expire',
};

const PASSWORD_RESET_CONFIG = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10,
  MAX_ATTEMPTS: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5,
  RESET_TOKEN_EXPIRY_MINUTES: Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 30,
};

module.exports = {
  ROLES,
  SUBSCRIPTION_STATUS,
  APPROVAL_STATUS,
  SESSION_STATUS,
  TOKEN_STATUS,
  CONSULTATION_STATUS,
  TOKEN_EVENTS,
  LAB_LEAD_STATUS,
  PHARMACY_LEAD_STATUS,
  WITHDRAWAL_STATUS,
  COMMISSION_RATE,
  JOB_NAMES,
  PASSWORD_RESET_CONFIG,
};


