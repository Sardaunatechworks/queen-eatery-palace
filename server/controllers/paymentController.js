import fetch from 'node-fetch';
import { db, admin } from '../config/firebase.js';
import { getNextOrderId } from '../services/orderService.js';

export const verifyPayment = async (req, res) => {
  const { reference, orderData, userId } = req.body;
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!reference || !orderData || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
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
