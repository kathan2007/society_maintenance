# Incident Response Runbook — Shree Hari Gift City Portal

This runbook describes immediate procedures to follow during security incidents, key compromises, or anomalous transactions.

---

## 1. Key Leak & Secret Rotation Runbook

If any secret (JWT secret, DB password, Razorpay/Stripe keys) is suspected to have leaked:

### A. JWT Secret Compromise
1. Generate new 64-byte random secrets:
   ```bash
   node -e "console.log('JWT_ACCESS_SECRET=' + crypto.randomBytes(32).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'))"
   ```
2. Update the environment variables in Render Dashboard and `.env`.
3. Invalidate all active sessions globally in MongoDB:
   ```javascript
   db.users.updateMany({}, { $inc: { refreshTokenVersion: 1 } });
   db.refreshtokens.updateMany({}, { $set: { revoked: true } });
   ```
4. Restart the backend service. All users will be forced to re-authenticate.

### B. MongoDB Atlas Database Credential Leak
1. Open **MongoDB Atlas Dashboard** &rarr; **Database Access**.
2. Create a new user with strong password and assign `readWrite` on `societyDB`.
3. Update `MONGO_URI` in Render Dashboard.
4. Redeploy the backend.
5. Delete the old user from Atlas Database Access.

### C. Payment Gateway Secret Leak (Razorpay / Stripe)
1. **Instantly Disable Payments via Kill-Switch**:
   - In Render Dashboard, set:
     ```env
     PAYMENTS_ENABLED=false
     ```
   - Save and trigger restart.
2. In Razorpay/Stripe Dashboard:
   - Roll/regenerate API Keys and Webhook Secrets.
3. Update backend environment variables (`RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, etc.).
4. Turn payments back on:
   ```env
   PAYMENTS_ENABLED=true
   ```

---

## 2. Emergency Payment Gateway Kill-Switches

To disable a single compromised gateway while keeping others operational:
```env
# Disable Razorpay, keep Stripe and UPI
ENABLED_GATEWAYS=stripe,upi
```

To shut down all payment processing:
```env
PAYMENTS_ENABLED=false
```

---

## 3. Account Takeover / Malicious Admin Compromise
1. Connect to MongoDB Atlas (via mongosh):
   ```javascript
   // Demote compromised user and lock account
   db.users.updateOne(
     { username: "compromised_username" },
     { $set: { role: "user", isActive: false, lockUntil: new Date(Date.now() + 864000000) } }
   );

   // Invalidate all tokens for that user
   db.refreshtokens.updateMany(
     { userId: ObjectId("USER_ID_HERE") },
     { $set: { revoked: true } }
   );
   ```
2. Review recent actions in the audit log:
   ```javascript
   db.auditlogs.find({ actorId: ObjectId("USER_ID_HERE") }).sort({ at: -1 }).limit(50);
   ```

---

## 4. Disaster Recovery & Backup Restoration
Refer to [backend/scripts/backup.md](file:///c:/Users/KATHAN/society_maintenance/backend/scripts/backup.md):
```bash
mongorestore \
  --uri="$MONGO_URI" \
  --dir=./backup/LATEST_BACKUP \
  --drop
```

---

## 5. Regulatory Notification Checklist (India DPDP Act & RBI)
In the event of a confirmed breach of personal or payment data:
1. **Determine scope**: Identify affected records via `AuditLog` queries.
2. **Notification timeline**: Under DPDP Act rules, notify Data Protection Board of India (DPBI) and affected data principals promptly.
3. **Payment anomalies**: If payment transactions or funds were affected, notify the merchant acquiring bank / Razorpay / Stripe partner within 24 hours.

---

## 6. Quarterly Security Checklist
- [ ] Review npm dependencies: `npm audit --omit=dev`.
- [ ] Rotate JWT and webhook signing secrets.
- [ ] Audit admin account list in MongoDB (`role: "admin"`).
- [ ] Verify Atlas IP allowlist and least-privilege credentials.
- [ ] Run test backup restoration into a staging database.
- [ ] Review CodeQL and Trivy security scanning reports in GitHub Actions.
