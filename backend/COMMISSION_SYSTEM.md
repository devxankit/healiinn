# Commission System Documentation

## Overview
The commission system automatically deducts platform commission from provider earnings and credits the remaining amount to their wallet.

## Commission Rates (Configurable via .env)

### Default Rates:
- **Doctor**: 10% commission (90% to doctor)
- **Pharmacy**: 10% commission (90% to pharmacy)
- **Laboratory**: 20% commission (80% to laboratory)

### Environment Variables:
```env
DOCTOR_COMMISSION_RATE=0.1      # 10% commission
PHARMACY_COMMISSION_RATE=0.1    # 10% commission
LABORATORY_COMMISSION_RATE=0.2  # 20% commission
```

## Implementation

### 1. Commission Config Utility
**File**: `backend/utils/commissionConfig.js`

Provides:
- `getCommissionRate(providerType)` - Get commission rate for provider
- `calculateProviderEarning(totalAmount, providerType)` - Calculate earning after commission

### 2. Doctor Commission
**File**: `backend/controllers/patient-controllers/patientAppointmentController.js`
- **Trigger**: When appointment payment is verified
- **Calculation**: `earning = appointment.fee * (1 - commissionRate)`
- **Wallet Transaction**: 
  - Type: `earning` - Doctor's earning amount
  - Type: `commission_deduction` - Platform commission amount

### 3. Pharmacy Commission
**File**: `backend/controllers/patient-controllers/patientRequestController.js`
- **Trigger**: When request payment is confirmed (medicine orders)
- **Calculation**: `earning = pharmacyTotal * (1 - commissionRate)`
- **Wallet Transaction**:
  - Type: `earning` - Pharmacy's earning amount
  - Type: `commission_deduction` - Platform commission amount

### 4. Laboratory Commission
**File**: `backend/controllers/patient-controllers/patientRequestController.js`
- **Trigger**: When request payment is confirmed (test bookings)
- **Calculation**: `earning = labTotal * (1 - commissionRate)`
- **Wallet Transaction**:
  - Type: `earning` - Laboratory's earning amount
  - Type: `commission_deduction` - Platform commission amount

## Wallet Transaction Structure

Each earning transaction includes metadata:
```javascript
{
  totalAmount: 1000,        // Original amount
  commission: 100,          // Commission deducted
  commissionRate: 0.1,      // Commission rate (10%)
  earning: 900              // Amount credited to wallet
}
```

## Real-time Events

When wallet is credited, Socket.IO emits:
```javascript
io.to(`provider-${providerId}`).emit('wallet:credited', {
  amount: earning,          // Amount credited
  balance: newBalance,      // New wallet balance
  commission: commission,    // Commission deducted
  commissionRate: commissionRate  // Commission rate
});
```

## Frontend Integration

Frontend can access commission rates via:
- Wallet transaction metadata
- Real-time Socket.IO events
- Wallet balance API responses

## Testing

To test commission system:
1. Set commission rates in `.env` file
2. Create appointment/request and complete payment
3. Check wallet transactions in database
4. Verify commission deduction records
5. Verify provider earning amount

## Notes

- Commission rates are read from `.env` at runtime
- Default rates apply if `.env` values are not set
- Commission is calculated and stored in transaction metadata
- Both earning and commission_deduction transactions are created for tracking

