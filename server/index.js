import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fetch from 'node-fetch'; // Standard in Node 18+, but adding for compatibility

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health Check / Root Route
app.get('/', (req, res) => {
  res.send('Queen Eatery Palace API Server is Running!');
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Initialize Firebase Admin
// Note: In production, use SERVICE_ACCOUNT_JSON or individual env vars
let serviceAccount = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
} catch (e) {
  console.error("❌ Invalid JSON in FIREBASE_SERVICE_ACCOUNT. Make sure you pasted the ENTIRE JSON content.");
}

if (serviceAccount && serviceAccount.project_id) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin initialized with Service Account");
} else {
  // Fallback for local dev
  admin.initializeApp({
    projectId: "restaurant-management-sy-afdd2"
  });
  console.log("⚠️ Firebase Admin initialized with Fallback (No Service Account)");
}

const db = admin.firestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Sequential Order ID Generator (Server-side & Secure)
 */
async function getNextOrderId() {
  const counterRef = db.collection('metadata').doc('counters');
  
  return await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextCount = 1;
    
    if (counterDoc.exists) {
      nextCount = (counterDoc.data().orderCount || 0) + 1;
    }
    
    transaction.set(counterRef, { orderCount: nextCount }, { merge: true });
    
    // QEP-XXXXX Format
    return `QEP-${String(nextCount).padStart(5, '0')}`;
  });
}

app.post('/api/verify-payment', async (req, res) => {
  const { reference, orderData, userId } = req.body;

  if (!reference || !orderData || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // 1. Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 2. Validate Amount (Safe-guard against tampering)
    const paidAmount = data.data.amount / 100; // Paystack is in kobo
    if (Math.abs(paidAmount - orderData.total) > 0.01) {
      return res.status(400).json({ success: false, message: "Amount mismatch detected" });
    }

    // 3. Check for Duplicate (Idempotency)
    const orderRef = db.collection('orders').doc(reference);
    const existingOrder = await orderRef.get();
    
    if (existingOrder.exists) {
      return res.status(200).json({ 
        success: true, 
        message: "Order already exists", 
        orderId: existingOrder.data().orderId 
      });
    }

    // 4. Generate Sequential Order ID
    const serviceOrderId = await getNextOrderId();

    // 5. Final Order Object
    const finalOrder = {
      ...orderData,
      orderId: serviceOrderId,
      paymentStatus: "paid",
      paymentReference: reference,
      transactionId: data.data.id,
      status: "pending",
      source: "customer",
      userId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 6. Save to Firestore
    await orderRef.set(finalOrder);

    res.status(200).json({ 
      success: true, 
      orderId: serviceOrderId,
      order: finalOrder
    });

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Internal server error during verification" });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
