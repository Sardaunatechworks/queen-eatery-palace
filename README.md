# Queen Eatery Palace

A scalable, full-stack restaurant management and CMS platform built with React, Vite, Tailwind CSS, Express, and Firebase.

## 🏗 Architecture

The repository is structured into two main independently running packages:

- **/client**: The React/Vite frontend application.
- **/server**: The Express Node.js backend API (handles Paystack verifications and Admin generation).

## 🚀 Setup & Installation

### 1. Install Dependencies
You need to install dependencies in **both** the client and server directories:
```bash
cd client
npm install
cd ../server
npm install
```

### 2. Environment Variables
You must configure the `.env` files locally before running.

**Client (`/client/.env`)**
```env
VITE_API_URL="http://localhost:5050"
VITE_PAYSTACK_PUBLIC_KEY="your_public_key"
```

**Server (`/server/.env`)**
```env
PAYSTACK_SECRET_KEY="your_secret_key"
FIREBASE_SERVICE_ACCOUNT='{ "your": "json" }'
```

## 💻 Running Locally

You will need two terminal windows to run the application locally.

**Terminal 1: Start Backend**
```bash
cd server
npm run dev
```

**Terminal 2: Start Frontend**
```bash
cd client
npm run dev
```

## 🌍 Deployment

### Frontend (Firebase Hosting)
The frontend is configured to deploy to Firebase Hosting automatically using the root `firebase.json` configuration.
```bash
cd client
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

### Backend (Render / Heroku / GCP)
The backend is a standard Node.js Express application. It is ready to be deployed to Render, Heroku, or Google Cloud Run. Ensure you set your `.env` variables in your production environment settings!
