const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  LABORATORY: 'laboratory',
  PHARMACY: 'pharmacy',
  ADMIN: 'admin',
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
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CLOSED: 'closed',
};

const LAB_ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PHARMACY_LEAD_STATUS = {
  NEW: 'new',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CLOSED: 'closed',
};

const PHARMACY_ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const JOB_NAMES = {
  ETA_RECALCULATION: 'queue:eta:recalculate',
  AUTO_NOSHOW: 'queue:token:auto-noshow',
  NOTIFICATION_DISPATCH: 'notification:dispatch',
  PAYOUT_RECONCILIATION: 'payments:reconcile',
};

const PASSWORD_RESET_CONFIG = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10,
  MAX_ATTEMPTS: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5,
  RESET_TOKEN_EXPIRY_MINUTES: Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 30,
};

module.exports = {
  ROLES,
  APPROVAL_STATUS,
  SESSION_STATUS,
  TOKEN_STATUS,
  CONSULTATION_STATUS,
  TOKEN_EVENTS,
  LAB_LEAD_STATUS,
  LAB_ORDER_STATUS,
  PHARMACY_LEAD_STATUS,
  PHARMACY_ORDER_STATUS,
  JOB_NAMES,
  PASSWORD_RESET_CONFIG,
};


