# Email Configuration Checklist for .env File

## ✅ REQUIRED EMAIL VARIABLES

Aapki `.env` file mein ye variables **zaroor** hone chahiye email notifications ke liye:

```env
# Email Configuration (REQUIRED for email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=Healiinn <your-email@gmail.com>
```

## 📋 DETAILED CHECKLIST

### 1. EMAIL_HOST ✅
```env
EMAIL_HOST=smtp.gmail.com
```
- **Gmail ke liye**: `smtp.gmail.com`
- **Outlook ke liye**: `smtp-mail.outlook.com`
- **Custom SMTP**: Apne provider ka SMTP server

### 2. EMAIL_PORT ✅
```env
EMAIL_PORT=587
```
- **587**: TLS/STARTTLS (Recommended)
- **465**: SSL (Alternative)
- **25**: Unsecured (Not recommended)

### 3. EMAIL_USER ✅
```env
EMAIL_USER=your-email@gmail.com
```
- **Must be**: Valid email address
- **Gmail**: Full email address (e.g., `yourname@gmail.com`)
- **No spaces**: Email ke aage-piche spaces nahi hone chahiye

### 4. EMAIL_PASS ✅
```env
EMAIL_PASS=your-gmail-app-password
```
- **Gmail ke liye**: App Password (16 characters)
- **NOT regular password**: Gmail App Password generate karna hoga
- **How to get**: 
  1. Gmail → Account Settings
  2. Security → 2-Step Verification (Enable karein)
  3. App Passwords → Generate
  4. 16-character password copy karein

### 5. EMAIL_FROM ✅ (Optional but Recommended)
```env
EMAIL_FROM=Healiinn <your-email@gmail.com>
```
- **Format**: `Display Name <email@domain.com>`
- **Default**: Agar nahi diya to `EMAIL_USER` use hoga
- **Example**: `Healiinn <noreply@healiinn.com>`

### 6. ADMIN_NOTIFICATION_EMAILS (Optional)
```env
ADMIN_NOTIFICATION_EMAILS=admin1@healiinn.com,admin2@healiinn.com
```
- **Format**: Comma-separated email addresses
- **Purpose**: Admin ko notifications bhejne ke liye
- **Optional**: Agar nahi diya to database se admin emails fetch hongi

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ WRONG:
```env
EMAIL_USER= your-email@gmail.com    # Space before email
EMAIL_PASS=my regular password       # Regular password (won't work with Gmail)
EMAIL_FROM=Healiinn                 # Missing email address
EMAIL_PORT=587                      # Correct
EMAIL_HOST=smtp.gmail.com           # Correct
```

### ✅ CORRECT:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop      # Gmail App Password (16 chars with spaces)
EMAIL_FROM=Healiinn <your-email@gmail.com>
EMAIL_PORT=587
EMAIL_HOST=smtp.gmail.com
```

---

## 🔍 VERIFICATION STEPS

### Step 1: Check Variables Exist
```bash
# Terminal mein check karein:
echo $EMAIL_HOST
echo $EMAIL_USER
```

### Step 2: Test Email Configuration
Server start karein aur check karein:
- ✅ Server start ho raha hai
- ✅ No email configuration warnings
- ✅ Email service initialized successfully

### Step 3: Test Email Send
Koi action perform karein jo email trigger kare:
- Appointment book karein
- Order place karein
- Support ticket create karein

---

## 📧 GMAIL APP PASSWORD SETUP

### Step-by-Step:

1. **Gmail Account Open Karein**
   - https://myaccount.google.com/

2. **Security Tab**
   - Left sidebar → Security

3. **2-Step Verification Enable Karein**
   - Agar already enabled hai, skip karein
   - Agar nahi hai, enable karein

4. **App Passwords Generate Karein**
   - Security page par scroll karein
   - "App passwords" section
   - "Select app" → "Mail"
   - "Select device" → "Other (Custom name)"
   - Name: "Healiinn Backend"
   - "Generate" button click karein

5. **16-Character Password Copy Karein**
   - Format: `abcd efgh ijkl mnop` (spaces ke saath)
   - Ya: `abcdefghijklmnop` (spaces ke bina)
   - Dono formats kaam karte hain

6. **`.env` File Mein Paste Karein**
   ```env
   EMAIL_PASS=abcdefghijklmnop
   ```

---

## 🧪 TEST EMAIL CONFIGURATION

### Quick Test Script:

```javascript
// test-email.js
require('dotenv').config();
const { sendEmail } = require('./services/emailService');

(async () => {
  try {
    const result = await sendEmail({
      to: process.env.EMAIL_USER, // Apne email par test email
      subject: 'Test Email from Healiinn',
      text: 'This is a test email to verify email configuration.',
      html: '<h1>Test Email</h1><p>Email configuration is working!</p>',
    });
    console.log('✅ Email sent successfully!', result);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
})();
```

Run karein:
```bash
node test-email.js
```

---

## 🔧 TROUBLESHOOTING

### Problem 1: "Email credentials not fully configured"
**Solution**: Check karein ki sabhi required variables `.env` mein hain:
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_USER
- ✅ EMAIL_PASS

### Problem 2: "Authentication failed"
**Solution**: 
- Gmail App Password use karein (regular password nahi)
- 2-Step Verification enable karein
- App Password correctly copy karein (no extra spaces)

### Problem 3: "Connection timeout"
**Solution**:
- Firewall check karein
- Port 587 blocked to nahi
- Internet connection verify karein

### Problem 4: "Rate limit exceeded"
**Solution**:
- Gmail daily limit: 500 emails/day (free account)
- Thoda wait karein aur phir try karein
- Code mein retry mechanism already hai

---

## 📝 COMPLETE EMAIL SECTION FOR .env

```env
# ============================================
# EMAIL CONFIGURATION
# ============================================
# Email Configuration (for notifications and password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password-16-chars
EMAIL_FROM=Healiinn <your-email@gmail.com>

# Admin Notification Emails (comma-separated, optional)
ADMIN_NOTIFICATION_EMAILS=admin1@healiinn.com,admin2@healiinn.com

# Password Reset Configuration
PASSWORD_RESET_OTP_EXPIRY_MINUTES=10
```

---

## ✅ FINAL CHECKLIST

Before running server, verify:

- [ ] `EMAIL_HOST` set hai aur correct hai
- [ ] `EMAIL_PORT` set hai (587 ya 465)
- [ ] `EMAIL_USER` valid email address hai
- [ ] `EMAIL_PASS` Gmail App Password hai (16 characters)
- [ ] `EMAIL_FROM` format correct hai (optional)
- [ ] `.env` file mein koi extra spaces nahi hain
- [ ] Server restart kiya hai after `.env` changes

---

**Note**: Agar aap Gmail use nahi kar rahe, to apne email provider ka SMTP configuration check karein.

