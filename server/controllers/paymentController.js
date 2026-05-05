import fetch from 'node-fetch';
import { db, admin } from '../config/firebase.js';
import { getNextOrderId } from '../services/orderService.js';

export const verifyPayment = async (req, res) => {
  const { reference, orderData, userId } = req.body;
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  console.log("--- Payment Verification Start ---");
  console.log("Reference:", reference);
  console.log("Key Prefix:", PAYSTACK_SECRET_KEY?.substring(0, 8));

  if (!reference || !orderData || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      const errText = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Paystack API Error:", response.status, errText);
      return res.status(response.status).json({ 
        success: false, 
        message: `Paystack API Error: ${errText.message || 'Unauthorized or Server Error'}` 
      });
    }

    const data = await response.json();
    console.log("Paystack Verification Response:", JSON.stringify(data, null, 2));

    if (!data.status || data.data.status !== 'success') {
      console.error("Verification failed for reference:", reference, "Reason:", data.message);
      return res.status(400).json({ 
        success: false, 
        message: `Payment verification failed: ${data.message || 'Transaction not successful'}` 
      });
    }

    const paidAmount = data.data.amount / 100;
    if (Math.abs(paidAmount - orderData.total) > 0.01) {
      return res.status(400).json({ success: false, message: "Amount mismatch detected" });
    }

    const orderRef = db.collection('orders').doc(reference);
    const existingOrder = await orderRef.get();
    
    if (existingOrder.exists) {
      return res.status(200).json({ 
        success: true, 
        message: "Order already exists", 
        orderId: existingOrder.data().orderId 
      });
    }

    const serviceOrderId = await getNextOrderId();

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
};
