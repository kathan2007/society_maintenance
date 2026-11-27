# Security Policy — Shree Hari Gift City Portal

## Supported Versions

| Version | Supported          | Security Maintenance Status |
| ------- | ------------------ | --------------------------- |
| 1.0.x   | :white_check_mark: | Active                      |

---

## Reporting a Vulnerability

We take the security of residential data and payment processing seriously. If you discover a vulnerability, please disclose it responsibly:

1. **Email**: security@shreeharigiftcity.internal (or open a Private Vulnerability Advisory on GitHub)
2. **Do Not**: Disclose the issue publicly until a remediation has been validated and deployed.
3. **Information to Include**:
   - Vulnerability class (OWASP Top 10 / OWASP API Security Top 10)
   - Step-by-step reproduction guide / PoC
   - Impact assessment
   - Potential mitigation suggestion

We will acknowledge receipt within 24 hours and aim to patch critical security issues within 72 hours.

---

## Security Architecture & Defense in Depth

The portal adheres to **OWASP ASVS Level 2**, **OWASP Top 10 (2021)**, and **OWASP API Security Top 10 (2023)**:

### 1. Edge & Transport Security (Layer 1 & 2)
- **HTTPS & HSTS**: Strict HSTS header (`max-age=63072000; includeSubDomains; preload`).
- **Content Security Policy (CSP)**: Scoped script, frame, and connect directives allowing only essential gateway CDNs (Razorpay, Stripe) and Vercel frontends.
- **Strict Hostname CORS**: Regular expression `/^https:\/\/[a-z0-9-]+\.vercel\.app$/` and explicit allowlist matching. Disallows wildcard `*`.
- **DDoS & Rate Limiting**: Global, auth-specific (15 attempts/15m), and payment-specific rate limiters.
- **Payload Limits**: Strict 10 KB limit on general JSON bodies; 1 MB raw limit for signed payment webhooks.
- **Injection Defense**: `mongoSanitize` strips `$` and `.` to neutralize NoSQL injection; `hpp` prevents parameter pollution.

### 2. Authentication & Session Management (Layer 3)
- **Passwords**: Bcrypt cost factor 12 with mandatory length & common password blocklist validation.
- **Access Tokens**: Short-lived (15 minutes) signed with `HS256`, verifying `iss`, `aud`, and `exp`.
- **Refresh Tokens**: 7-day tokens stored in encrypted `httpOnly`, `Secure`, `SameSite=None` cookies with **Token Family Rotation and Reuse Detection**. Any re-use of an already rotated token immediately invalidates the entire family.
- **Brute Force Defense**: Account lockout after 5 consecutive failed attempts; constant-time credential comparison.
- **Admin Hardening**: Mandatory TOTP 2FA support (`otplib`), `ADMIN_INVITE_CODE` required for administrative registration.

### 3. Authorization & IDOR / BOLA Prevention (Layer 4)
- **Central RBAC**: Strict `requireRole("admin")` and `requireOwnership` middleware.
- **Scoped Database Queries**: All resident queries explicitly filter by `userId: req.user.id`. Users cannot query, modify, or pay other residents' bills.
- **Mass Assignment Protection**: Zod schemas configured with `.strict()` reject unexpected parameters.

### 4. Multi-Gateway Payment Security (Layer 6)
- **Client Zero-Trust**: Payment amounts and currencies are retrieved exclusively from `Maintenance.totalAmount` in the database. Client-supplied amounts are discarded.
- **PCI DSS SAQ-A Compliance**: Cardholder data is never stored, processed, or logged. Hosted checkout frames are used.
- **Webhook Cryptographic Verification**:
  - Razorpay: HMAC SHA-256 with `crypto.timingSafeEqual`.
  - Stripe: `stripe.webhooks.constructEvent` with timestamp replay tolerance.
- **Idempotency & Replay Defense**: Webhook event IDs are recorded in `ProcessedEvent` with a 7-day TTL index.
- **Atomic State Transitions**: `Maintenance.findOneAndUpdate({ _id, status: "Pending" })` prevents double-marking and race conditions.
- **Kill-Switches**: `PAYMENTS_ENABLED` and `ENABLED_GATEWAYS` allow instant shutdown of vulnerable channels.

### 5. Data Privacy & Compliance (Layer 7 & 8)
- **DPDP Act (India) 2023 Compliance**: Data minimization, user data export (`/api/user/me/export`), and account deletion (`/api/user/me`).
- **Visitor Log Retention**: MongoDB TTL index automatically purges visitor logs after 180 days.
- **Append-Only Audit Trail**: `AuditLog` captures logins, security events, payment attempts, and admin modifications.
