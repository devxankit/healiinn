# Email Notification Requirements

## 📧 Email Notification Scenarios

### 1. Authentication & Registration

#### Patient
- ✅ **Signup** → Patient: Welcome email with OTP instructions
- ✅ **Login OTP** → Patient: OTP sent via SMS (not email)
- ✅ **Account Created** → Patient: Account created confirmation

#### Doctor
- ✅ **Signup** → Doctor: Registration received, pending approval
- ✅ **Signup** → Admin: New doctor registration notification
- ✅ **Approved** → Doctor: Account approved, can login
- ✅ **Rejected** → Doctor: Registration rejected with reason
- ✅ **Login OTP** → Doctor: OTP sent via SMS (not email)

#### Pharmacy
- ✅ **Signup** → Pharmacy: Registration received, pending approval
- ✅ **Signup** → Admin: New pharmacy registration notification
- ✅ **Approved** → Pharmacy: Account approved, can login
- ✅ **Rejected** → Pharmacy: Registration rejected with reason
- ✅ **Login OTP** → Pharmacy: OTP sent via SMS (not email)

#### Laboratory
- ✅ **Signup** → Laboratory: Registration received, pending approval
- ✅ **Signup** → Admin: New laboratory registration notification
- ✅ **Approved** → Laboratory: Account approved, can login
- ✅ **Rejected** → Laboratory: Registration rejected with reason
- ✅ **Login OTP** → Laboratory: OTP sent via SMS (not email)

#### Admin
- ✅ **Signup** → Admin: Welcome email
- ✅ **Forgot Password** → Admin: Password reset OTP
- ✅ **Password Changed** → Admin: Password changed confirmation

---

### 2. Appointments

#### Patient Actions
- ✅ **Appointment Booked** → Patient: Appointment confirmation with details
- ✅ **Appointment Booked** → Doctor: New appointment notification
- ✅ **Appointment Cancelled** → Patient: Cancellation confirmation
- ✅ **Appointment Cancelled** → Doctor: Patient cancelled appointment
- ✅ **Appointment Rescheduled** → Patient: Rescheduled confirmation
- ✅ **Appointment Rescheduled** → Doctor: Appointment rescheduled notification
- ✅ **Appointment Reminder** → Patient: Reminder 24 hours before
- ✅ **Appointment Reminder** → Patient: Reminder 2 hours before

#### Doctor Actions
- ✅ **Appointment Confirmed** → Patient: Doctor confirmed appointment
- ✅ **Appointment Cancelled by Doctor** → Patient: Doctor cancelled appointment
- ✅ **Appointment Rescheduled by Doctor** → Patient: Doctor rescheduled appointment

---

### 3. Consultations & Prescriptions

#### Doctor Actions
- ✅ **Consultation Created** → Patient: Consultation started notification
- ✅ **Prescription Generated** → Patient: Prescription ready with PDF attachment
- ✅ **Prescription Updated** → Patient: Prescription updated notification

---

### 4. Orders (Pharmacy)

#### Patient Actions
- ✅ **Order Placed** → Patient: Order confirmation
- ✅ **Order Placed** → Pharmacy: New order notification
- ✅ **Order Cancelled** → Patient: Order cancellation confirmation
- ✅ **Order Cancelled** → Pharmacy: Order cancelled notification

#### Pharmacy Actions
- ✅ **Order Accepted** → Patient: Order accepted, processing started
- ✅ **Order Status Updated** → Patient: Order status update (processing, ready, out for delivery)
- ✅ **Order Ready** → Patient: Order ready for pickup/delivery
- ✅ **Order Delivered** → Patient: Order delivered confirmation
- ✅ **Order Cancelled by Pharmacy** → Patient: Pharmacy cancelled order

---

### 5. Lab Orders & Reports

#### Patient Actions
- ✅ **Test Booked** → Patient: Test booking confirmation
- ✅ **Test Booked** → Laboratory: New test order notification
- ✅ **Test Cancelled** → Patient: Test cancellation confirmation
- ✅ **Test Cancelled** → Laboratory: Test cancelled notification

#### Laboratory Actions
- ✅ **Test Accepted** → Patient: Test accepted, sample collection scheduled
- ✅ **Test Status Updated** → Patient: Test status update (processing, completed)
- ✅ **Report Generated** → Patient: Lab report ready with PDF attachment
- ✅ **Report Updated** → Patient: Lab report updated notification
- ✅ **Test Cancelled by Lab** → Patient: Lab cancelled test

---

### 6. Requests (Medicine/Test Orders)

#### Patient Actions
- ✅ **Request Created** → Patient: Request submitted confirmation
- ✅ **Request Created** → Admin: New request notification
- ✅ **Request Cancelled** → Patient: Request cancellation confirmation
- ✅ **Request Cancelled** → Admin: Request cancelled notification

#### Admin Actions
- ✅ **Request Accepted** → Patient: Request accepted, medicines/tests added
- ✅ **Request Responded** → Patient: Request response with pharmacy/lab details
- ✅ **Request Cancelled by Admin** → Patient: Request cancelled by admin

#### Pharmacy/Lab Actions
- ✅ **Request Assigned** → Pharmacy: New request assigned
- ✅ **Request Assigned** → Laboratory: New request assigned
- ✅ **Request Confirmed** → Patient: Pharmacy/Lab confirmed request
- ✅ **Request Confirmed** → Admin: Request confirmed by provider

---

### 7. Payments & Transactions

#### Patient Actions
- ✅ **Payment Successful** → Patient: Payment receipt
- ✅ **Payment Failed** → Patient: Payment failed notification
- ✅ **Refund Processed** → Patient: Refund confirmation

#### Provider Actions (Doctor/Pharmacy/Lab)
- ✅ **Withdrawal Requested** → Provider: Withdrawal request confirmation
- ✅ **Withdrawal Requested** → Admin: New withdrawal request
- ✅ **Withdrawal Approved** → Provider: Withdrawal approved, processing
- ✅ **Withdrawal Rejected** → Provider: Withdrawal rejected with reason
- ✅ **Withdrawal Processed** → Provider: Withdrawal processed, amount transferred

---

### 8. Support & Help

#### All Users
- ✅ **Support Ticket Created** → User: Ticket created confirmation
- ✅ **Support Ticket Created** → Admin: New support ticket notification
- ✅ **Support Ticket Responded** → User: Admin responded to ticket
- ✅ **Support Ticket Resolved** → User: Ticket resolved notification
- ✅ **Support Ticket Closed** → User: Ticket closed notification

---

### 9. Profile & Account

#### All Users
- ✅ **Profile Updated** → User: Profile updated confirmation
- ✅ **Password Changed** → User: Password changed confirmation (Admin only)
- ✅ **Account Deactivated** → User: Account deactivated notification
- ✅ **Account Reactivated** → User: Account reactivated notification

---

## 📋 Implementation Plan

1. **Create Comprehensive Notification Service**
   - Centralized notification service
   - Template-based emails
   - Support for all scenarios

2. **Integrate into Controllers**
   - Authentication controllers
   - Appointment controllers
   - Order controllers
   - Request controllers
   - Support controllers
   - Wallet controllers

3. **Email Templates**
   - HTML templates for all notifications
   - Plain text fallbacks
   - Branding consistency

4. **Settings Integration**
   - Respect user email notification preferences
   - Admin settings for notification control

---

## ✅ Priority Implementation Order

1. **High Priority** (Critical for user experience):
   - Appointment confirmations & reminders
   - Order confirmations & status updates
   - Prescription & report ready notifications
   - Payment confirmations

2. **Medium Priority** (Important for operations):
   - Registration approvals/rejections
   - Request assignments & confirmations
   - Withdrawal notifications
   - Support ticket notifications

3. **Low Priority** (Nice to have):
   - Profile update confirmations
   - Account status changes

