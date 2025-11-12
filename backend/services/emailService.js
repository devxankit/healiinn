const nodemailer = require('nodemailer');
const { APPROVAL_STATUS } = require('../utils/constants');

let cachedTransporter;

const ensureTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email credentials are not fully configured. Emails will not be sent.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return cachedTransporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = ensureTransporter();

  if (!transporter) {
    console.warn(`Skipping email to ${to}: transporter not configured.`);
    return null;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(
      `Failed to send email to ${to}: ${error.message || error}`
    );
    return null;
  }
};

const formatRoleName = (role) => role.charAt(0).toUpperCase() + role.slice(1);

const sendRoleApprovalEmail = async ({ role, email, status, reason }) => {
  const readableRole = formatRoleName(role);

  if (status === APPROVAL_STATUS.APPROVED) {
    return sendEmail({
      to: email,
      subject: `${readableRole} account approved | Healiinn`,
      text: `Hello ${readableRole},\n\nYour registration with Healiinn has been approved. You can now sign in using your credentials.\n\nThank you,\nTeam Healiinn`,
      html: `<p>Hello ${readableRole},</p><p>Your registration with <strong>Healiinn</strong> has been approved. You can now sign in using your credentials.</p><p>Thank you,<br/>Team Healiinn</p>`,
    });
  }

  if (status === APPROVAL_STATUS.REJECTED) {
    return sendEmail({
      to: email,
      subject: `${readableRole} account update | Healiinn`,
      text: `Hello ${readableRole},\n\nYour registration could not be approved at this time.${reason ? ` Reason: ${reason}.` : ''}\nPlease contact support if you need more information.\n\nRegards,\nTeam Healiinn`,
      html: `<p>Hello ${readableRole},</p><p>Your registration could not be approved at this time.${
        reason ? ` Reason: <strong>${reason}</strong>.` : ''
      }</p><p>Please contact support if you need more information.</p><p>Regards,<br/>Team Healiinn</p>`,
    });
  }

  return null;
};

const sendSignupAcknowledgementEmail = async ({ role, email, name }) => {
  const readableRole = formatRoleName(role);

  return sendEmail({
    to: email,
    subject: `${readableRole} signup received | Healiinn`,
    text: `Hello ${name || readableRole},\n\nWe have received your registration for Healiinn as a ${readableRole}. Our admin team will review your details and notify you once approved.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${name || readableRole},</p><p>We have received your registration for <strong>Healiinn</strong> as a ${readableRole}. Our admin team will review your details and notify you once approved.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

const sendAdminPendingApprovalEmail = async ({ email, role, entity }) => {
  const readableRole = formatRoleName(role);
  const name = entity?.firstName
    ? `${entity.firstName} ${entity.lastName || ''}`.trim()
    : entity?.labName || entity?.pharmacyName || entity?.ownerName || entity?.name || 'New applicant';

  const details = [
    entity?.email && `Email: ${entity.email}`,
    entity?.phone && `Phone: ${entity.phone}`,
    entity?.licenseNumber && `License: ${entity.licenseNumber}`,
  ]
    .filter(Boolean)
    .join('\n');

  const text = `Hello Admin,

A new ${readableRole} registration requires approval.

Name: ${name}
${details ? `${details}
` : ''}
Please review and take action in the admin panel.

Thank you,
Healiinn Platform`;

  const html = `<p>Hello Admin,</p><p>A new <strong>${readableRole}</strong> registration requires approval.</p><ul>${
    name ? `<li><strong>Name:</strong> ${name}</li>` : ''
  }${
    entity?.email ? `<li><strong>Email:</strong> ${entity.email}</li>` : ''
  }${
    entity?.phone ? `<li><strong>Phone:</strong> ${entity.phone}</li>` : ''
  }${
    entity?.licenseNumber ? `<li><strong>License:</strong> ${entity.licenseNumber}</li>` : ''
  }</ul><p>Please review and take action in the admin panel.</p><p>Thank you,<br/>Healiinn Platform</p>`;

  return sendEmail({
    to: email,
    subject: `New ${readableRole} registration pending approval`,
    text,
    html,
  });
};

const sendPasswordResetOtpEmail = async ({ role, email, otp }) => {
  const readableRole = formatRoleName(role);

  return sendEmail({
    to: email,
    subject: `Password reset OTP for ${readableRole} account | Healiinn`,
    text: `Hello ${readableRole},\n\nUse the following OTP to reset your Healiinn password: ${otp}.\nThis OTP will expire in ${process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10} minutes.\n\nIf you did not request this, please contact support immediately.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${readableRole},</p><p>Use the following OTP to reset your <strong>Healiinn</strong> password: <strong>${otp}</strong>.</p><p>This OTP will expire in ${
      process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10
    } minutes.</p><p>If you did not request this, please contact support immediately.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

module.exports = {
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendAdminPendingApprovalEmail,
  sendPasswordResetOtpEmail,
};


