// SMS Service for sending OTP
// This service can be integrated with SMS providers like:
// - Twilio
// - AWS SNS
// - TextLocal
// - MSG91
// - Any other SMS gateway

const LOGIN_OTP_EXPIRY_MINUTES = Number(process.env.LOGIN_OTP_EXPIRY_MINUTES) || 10;

const formatRoleName = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const sendMobileOtp = async ({ phone, otp, role }) => {
  // In production, integrate with your SMS provider here
  // For now, we'll log it (useful for development/testing)

  const roleName = formatRoleName(role);
  const message = `Your Healiinn ${roleName} login OTP is: ${otp}. Valid for ${LOGIN_OTP_EXPIRY_MINUTES} minutes. Do not share this OTP with anyone.`;

  // TODO: Integrate with SMS provider
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: message,
  //   to: phone,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  // });

  // Example with AWS SNS:
  // const AWS = require('aws-sdk');
  // const sns = new AWS.SNS();
  // await sns.publish({
  //   Message: message,
  //   PhoneNumber: phone,
  // }).promise();

  // Example with TextLocal:
  // const https = require('https');
  // const querystring = require('querystring');
  // const data = querystring.stringify({
  //   apikey: process.env.TEXTLOCAL_API_KEY,
  //   numbers: phone,
  //   message: message,
  //   sender: process.env.TEXTLOCAL_SENDER_ID,
  // });
  // // Make HTTP request to TextLocal API

  // For development/testing - log the OTP
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log(`[SMS OTP] Phone: ${phone}, OTP: ${otp}, Message: ${message}`);
    console.log(`[SMS] To: ${phone}`);
    console.log(`[SMS] Message: ${message}`);
  }

  // In production, you should integrate with an SMS provider
  // For now, return success (SMS will be sent via integrated provider)
  return {
    success: true,
    message: 'OTP sent successfully',
    // In production, you might want to return provider response
  };
};

module.exports = {
  sendMobileOtp,
};

