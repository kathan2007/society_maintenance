# UPI QR Payment System Setup Guide (Modular Version)

This guide helps you set up the modular, production-ready UPI QR Payment system.

## 1. Backend Setup

### Prerequisites
- Node.js & MongoDB
- Razorpay Account (Test Mode)

### Folder Structure
- `config/`: Configuration for DB and Razorpay
- `controllers/`: Logic for processing payments and webhooks
- `routes/`: Express routes for the payment module
- `services/`: Gateway-specific logic (Razorpay)
- `models/`: Mongoose Order schema
- `utils/`: Socket.io manager

### Configuration (.env)
```env
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEB_SECRET=webhook_secret_here
VPA_ID=your_upi_id@bank
```

### Install Dependencies
```bash
cd backend
npm install razorpay socket.io qrcode
```

### Run Server
```bash
npm run dev
```

## 2. Frontend Setup

### Install Dependencies
```bash
cd frontend
npm install socket.io-client qrcode.react
```

### Flow
Residents can now initiate payments from the **Maintenance** page, which redirects them to a dedicated **Checkout** page with a 5-minute countdown and real-time status detection.

## 3. Webhook Testing with Ngrok
1. Start ngrok: `ngrok http 5000`
2. Copy the `https` URL (e.g., `https://random-id.ngrok-free.app`)
3. Go to Razorpay Dashboard > Settings > Webhooks
4. Add URL: `https://random-id.ngrok-free.app/api/payment/webhook`
5. Select events: `payment.captured`, `payment.failed`
6. Set Secret to match your `.env`

## 4. Testing
- Click "Pay Dues" on Maintenance page.
- Scan QR on Checkout page.
- Once captured by Razorpay, the webhook will trigger.
- The backend will emit `paymentSuccess` to the socket room.
- The Checkout page will instantly redirect to the Success page.
