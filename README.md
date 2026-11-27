# Shree Hari Gift City Portal

> 🏙️ Residential Society Management System — Production-Ready  
> **Private & Confidential** — Internal use only

---

## Live Deployments

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://society-maintenance-phi.vercel.app |
| Backend (Render) | https://society-maintenance-ut07.onrender.com |
| Health Check | https://society-maintenance-ut07.onrender.com/health |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (CDN Edge)                                       │
│  React 19 + Vite + TypeScript                           │
│  Luxury Glassmorphism UI                                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS + WebSocket
┌─────────────────────▼───────────────────────────────────┐
│  Render (Docker)                                         │
│  Node 20 + Express + Socket.io + Mongoose               │
│  Rate-limiting + Helmet + CORS                          │
└─────────────────────┬───────────────────────────────────┘
                      │ TLS
┌─────────────────────▼───────────────────────────────────┐
│  MongoDB Atlas                                           │
│  societydata.fw00kxp.mongodb.net / societyDB            │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript strict**
- **Vite 6** (output: `build/` — Vercel compatible)
- **Bootstrap 5** + Custom CSS tokens (glassmorphism)
- **Framer Motion** — page transitions
- **Chart.js** + react-chartjs-2 — analytics
- **Socket.io-client** — real-time payment updates
- **react-hot-toast** — notifications
- **jsPDF** + jspdf-autotable — receipt generation
- **Zod** — form validation
- **Vitest** + React Testing Library

### Backend
- **Node.js 20** (ES Modules)
- **Express 4** + Helmet + express-rate-limit
- **Mongoose 8** — MongoDB ODM
- **Socket.io 4** — WebSocket server
- **bcryptjs** + **jsonwebtoken** — auth
- **node-cron** — monthly billing automation
- **Razorpay** — UPI payment gateway

---

## Environment Variables

### Frontend (Vercel Dashboard)

| Key | Value | Note |
|-----|-------|------|
| `REACT_APP_API_URL` | `https://society-maintenance-ut07.onrender.com` | No trailing slash |

### Backend (Render Dashboard / `.env`)

| Key | Required | Description |
|-----|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Strong random secret (32+ chars) |
| `PORT` | ✅ | `5000` |
| `NODE_ENV` | ✅ | `production` |
| `FRONTEND_URL` | ✅ | Vercel frontend URL |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret |
| `ADMIN_USERNAME` | Optional | Override default admin username |
| `ADMIN_PASSWORD` | Optional | Override default admin password |

> **GitHub Secrets** needed for CI/CD:
> - `RENDER_DEPLOY_HOOK_URL` — Render deploy hook URL
> - `BACKEND_URL` — Backend health check URL

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/kathan2007/society_maintenance
cd society_maintenance

# 2. Backend
cp .env.example backend/.env   # fill in values
cd backend && npm install && npm run dev

# 3. Frontend (new tab)
cd frontend && npm install && npm run dev
# → http://localhost:3000

# 4. Full stack with Docker
docker compose up --build
```

---

## Seed Database (dev only)

```bash
cd backend
NODE_ENV=development node scripts/seed.js
# Creates: 1 admin + 10 residents + billing + notices + expenses
# admin / admin | resident_a101 / password123
```

---

## Keep Backend Alive (Render Free Tier)

Render free tier spins down after 15 minutes of inactivity.

**UptimeRobot setup:**
1. Go to [uptimerobot.com](https://uptimerobot.com) → Add Monitor
2. Type: HTTP(s)
3. URL: `https://society-maintenance-ut07.onrender.com/health`
4. Interval: 10 minutes
5. Alert when DOWN

---

## Payment Webhook

Razorpay webhook URL:
```
https://society-maintenance-ut07.onrender.com/api/payment/webhook
```

Events to subscribe: `payment.captured`

---

## Deployment

### Frontend — Vercel (auto-deploys on push to `main`)
- Root directory: `frontend`
- Build command: `npm run build:ci`
- Output directory: `build`
- Framework: Vite

### Backend — Render (via GitHub Actions deploy hook)
- Blueprint: `render.yaml`
- Runtime: Docker
- Health check: `/health`

---

## Default Admin Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin` |

> **Production:** Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars on Render.

---

*© 2026 Shree Hari Gift City Portal — Private & Confidential*
