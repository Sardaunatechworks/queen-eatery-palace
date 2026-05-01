import { db } from '../config/firebase.js';

export const getNextOrderId = async () => {
  const counterRef = db.collection('metadata').doc('counters');
  
  return await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextCount = 1;
    
    if (counterDoc.exists) {
      nextCount = (counterDoc.data().orderCount || 0) + 1;
    }
    
    transaction.set(counterRef, { orderCount: nextCount }, { merge: true });
    
    return `QEP-${String(nextCount).padStart(5, '0')}`;
  });
};
