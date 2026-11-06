# Society Maintenance Management System

A full-stack web application designed for residential societies to manage maintenance payments, complaints, notices, expenses, and visitors.

---

## 🛠 Tech Stack

- **Backend**: Node.js (ES Modules), Express.js, MongoDB (Mongoose), Socket.io, Razorpay SDK
- **Frontend**: React 19, TypeScript, Bootstrap, Chart.js, Lucide Icons, Framer Motion
- **Containerization**: Docker, Docker Compose, Nginx (Alpine)
- **CI/CD**: GitHub Actions (CI & CD), GitLab CI

---

## 🐳 Docker Setup

### Prerequisites
- Install and launch **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (ensure the Linux Engine is running).

### Quick Start with Docker Compose

1. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Razorpay keys and secrets as needed.

2. **Build and Run All Services**:
   ```bash
   docker compose up --build -d
   ```

3. **Verify Container Status**:
   ```bash
   docker compose ps
   ```

4. **Access the Applications**:
   - **Frontend (Web UI)**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Healthcheck Endpoint**: [http://localhost:5000/health](http://localhost:5000/health)
   - **MongoDB Database**: `mongodb://localhost:27017/societyDB`

5. **Stop Containers**:
   ```bash
   docker compose down
   ```
   *(To wipe database volumes as well, run `docker compose down -v`)*

---

## 🚀 CI/CD Pipeline

The project includes pre-configured, production-ready CI/CD workflows:

### 1. Continuous Integration (GitHub Actions: `.github/workflows/ci.yml`)
Triggers automatically on every `push` to `main`, `master`, `develop` or on `pull_request`:
- **Backend CI**: Boots a real MongoDB service container, performs dependency caching, installs clean packages (`npm ci`), and validates backend syntax & server health (`npm test`).
- **Frontend CI**: Caches dependencies, installs packages, and compiles the production bundle with TypeScript and React scripts.
- **Docker Validation**: Tests `docker compose config` syntax and compiles test Docker images to prevent broken builds from merging.

### 2. Continuous Deployment (GitHub Actions: `.github/workflows/cd.yml`)
Triggers on merge/push to `main` or via **Manual Workflow Dispatch**:
- Builds multi-layer production Docker images for both **Backend** and **Frontend**.
- Automatically logs in and pushes images to **GitHub Container Registry (GHCR)**:
  - `ghcr.io/<owner>/society_maintenance/backend:latest`
  - `ghcr.io/<owner>/society_maintenance/frontend:latest`
- Includes ready-to-use remote deployment hook via SSH.

### 3. GitLab CI (`.gitlab-ci.yml`)
Includes a 3-stage pipeline (`test`, `build`, `deploy`) compatible with GitLab runners and Docker-in-Docker (dind).

---

## 💻 Local Development (Without Docker)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

