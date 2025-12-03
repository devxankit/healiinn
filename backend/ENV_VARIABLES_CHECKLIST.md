# Environment Variables Checklist for Healiinn Backend

## ✅ Complete List of Required Environment Variables

### 🔴 CRITICAL (Must be set for application to work)

1. **NODE_ENV** - `development` or `production`
2. **PORT** - Server port (default: 5000)
3. **MONGODB_URI** - MongoDB connection string
4. **JWT_SECRET** - JWT signing secret (minimum 32 characters)
5. **JWT_REFRESH_SECRET** - JWT refresh token secret (should be different from JWT_SECRET)
6. **FRONTEND_URL** - Frontend URL for CORS (e.g., http://localhost:3000)

### 🟡 IMPORTANT (Required for specific features)

#### Email Configuration (Required for email notifications)
7. **EMAIL_HOST** - SMTP host (e.g., smtp.gmail.com)
8. **EMAIL_PORT** - SMTP port (e.g., 587)
9. **EMAIL_USER** - SMTP username/email
10. **EMAIL_PASS** - SMTP password (use App-Specific Password for Gmail)
11. **EMAIL_FROM** - From email address (e.g., "Healiinn <email@example.com>")

#### SMS/OTP Configuration (Required for OTP login)
12. **SMS_PROVIDER** - SMS provider: `MSG91`, `TWILIO`, `TEXTLOCAL`, `AWS_SNS`, or `NONE`
13. **LOGIN_OTP_EXPIRY_MINUTES** - OTP expiry time (default: 10)

#### MSG91 Configuration (If using MSG91)
14. **MSG91_AUTH_KEY** - MSG91 authentication key
15. **MSG91_SENDER_ID** - MSG91 sender ID (default: HEALIN)
16. **MSG91_OTP_TEMPLATE_ID** - MSG91 OTP template ID (optional, for template-based OTP)
17. **MSG91_ROUTE** - MSG91 route (default: 4 for transactional)

#### Admin Configuration
18. **ADMIN_REGISTRATION_CODE** - Code required for admin registration
19. **ADMIN_NOTIFICATION_EMAILS** - Comma-separated admin emails for notifications

### 🟢 OPTIONAL (Has defaults or only needed for specific features)

#### Socket.IO Configuration
20. **SOCKET_IO_CORS_ORIGIN** - Socket.IO CORS origin (defaults to FRONTEND_URL)

#### JWT Token Expiry
21. **JWT_EXPIRE** - Access token expiry (default: 7d)
22. **JWT_REFRESH_EXPIRE** - Refresh token expiry (default: 30d)

#### Rate Limiting (All have defaults)
23. **RATE_LIMIT_WINDOW_MS** - General rate limit window (default: 60000ms = 1 minute)
24. **RATE_LIMIT_MAX** - General rate limit max requests (default: 120)
25. **AUTH_RATE_LIMIT_WINDOW_MS** - Auth rate limit window (default: 900000ms = 15 minutes)
26. **AUTH_RATE_LIMIT_MAX** - Auth rate limit max requests (default: 5)
27. **PASSWORD_RESET_RATE_LIMIT_WINDOW_MS** - Password reset rate limit window (default: 3600000ms = 1 hour)
28. **PASSWORD_RESET_RATE_LIMIT_MAX** - Password reset rate limit max requests (default: 3)
29. **OTP_RATE_LIMIT_WINDOW_MS** - OTP rate limit window (default: 300000ms = 5 minutes)
30. **OTP_RATE_LIMIT_MAX** - OTP rate limit max requests (default: 3)

#### Password Reset Configuration (All have defaults)
31. **PASSWORD_RESET_OTP_EXPIRY_MINUTES** - Password reset OTP expiry (default: 10)
32. **PASSWORD_RESET_MAX_ATTEMPTS** - Max password reset attempts (default: 5)
33. **PASSWORD_RESET_TOKEN_EXPIRY_MINUTES** - Password reset token expiry (default: 30)

#### Payment Gateway (Razorpay) - Optional
34. **RAZORPAY_KEY_ID** - Razorpay key ID
35. **RAZORPAY_KEY_SECRET** - Razorpay key secret
36. **RAZORPAY_WEBHOOK_SECRET** - Razorpay webhook secret

#### Commission Rates (All have defaults: 0.1 = 10%)
37. **DOCTOR_COMMISSION_RATE** - Doctor commission rate (default: 0.1)
38. **PHARMACY_COMMISSION_RATE** - Pharmacy commission rate (default: 0.1)
39. **LABORATORY_COMMISSION_RATE** - Laboratory commission rate (default: 0.1)

#### Alternative SMS Providers (Only if not using MSG91)

**Twilio Configuration:**
40. **TWILIO_ACCOUNT_SID** - Twilio account SID
41. **TWILIO_AUTH_TOKEN** - Twilio auth token
42. **TWILIO_PHONE_NUMBER** - Twilio phone number

**TextLocal Configuration:**
43. **TEXTLOCAL_API_KEY** - TextLocal API key
44. **TEXTLOCAL_SENDER_ID** - TextLocal sender ID (default: HEALIN)

**AWS SNS Configuration:**
45. **AWS_ACCESS_KEY_ID** - AWS access key ID
46. **AWS_SECRET_ACCESS_KEY** - AWS secret access key
47. **AWS_REGION** - AWS region (default: us-east-1)

#### Testing Configuration (Optional)
48. **SMOKE_TEST_BASE_URL** - Base URL for smoke tests (default: http://localhost:5000)
49. **SMOKE_TEST_MAX_ATTEMPTS** - Max retry attempts for smoke tests (default: 30)
50. **SMOKE_TEST_RETRY_DELAY_MS** - Retry delay for smoke tests (default: 1000ms)

#### File Upload Configuration (Optional - currently using defaults)
51. **MAX_FILE_SIZE** - Maximum file size in bytes (default: 10485760 = 10MB)
52. **ALLOWED_FILE_TYPES** - Comma-separated allowed file types

#### Notification Settings (Optional - currently not used in code)
53. **ENABLE_EMAIL_NOTIFICATIONS** - Enable email notifications (default: true)
54. **ENABLE_SMS_NOTIFICATIONS** - Enable SMS notifications (default: false)
55. **ENABLE_PUSH_NOTIFICATIONS** - Enable push notifications (default: true)

#### Platform Settings (Optional - currently not used in code)
56. **PLATFORM_NAME** - Platform name (default: Healiinn)
57. **PLATFORM_SUPPORT_EMAIL** - Support email
58. **PLATFORM_SUPPORT_PHONE** - Support phone number

## 📝 Notes

1. **Session Management**: The application uses JWT tokens for authentication. No separate session store (like Redis) is required. Session data is stored in JWT tokens.

2. **Socket.IO**: Socket.IO is configured and uses the same CORS origin as the frontend. No additional session configuration needed.

3. **File Storage**: Currently using local file storage in `backend/upload` directory. No external storage service (S3, etc.) configuration needed.

4. **Database**: Only MongoDB is used. No Redis or other databases required.

5. **Missing Variables**: The following variables are in env.example but not actively used in code (can be removed or kept for future use):
   - MAX_FILE_SIZE
   - ALLOWED_FILE_TYPES
   - ENABLE_EMAIL_NOTIFICATIONS
   - ENABLE_SMS_NOTIFICATIONS
   - ENABLE_PUSH_NOTIFICATIONS
   - PLATFORM_NAME
   - PLATFORM_SUPPORT_EMAIL
   - PLATFORM_SUPPORT_PHONE

## ✅ Verification Checklist

Before deploying, ensure:
- [ ] All CRITICAL variables are set
- [ ] JWT secrets are strong (minimum 32 characters)
- [ ] JWT_REFRESH_SECRET is different from JWT_SECRET
- [ ] Email credentials are configured (if using email features)
- [ ] SMS provider is configured (if using OTP login)
- [ ] Admin registration code is set
- [ ] MongoDB URI is correct
- [ ] FRONTEND_URL matches your frontend URL
- [ ] SOCKET_IO_CORS_ORIGIN matches FRONTEND_URL (or is set explicitly)

