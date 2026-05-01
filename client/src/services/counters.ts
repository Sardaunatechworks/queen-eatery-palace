import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { formatOrderId } from "../utils/format";

/**
 * Gets the next sequential order ID from Firestore and increments the counter
 * @returns A formatted order ID (e.g., QEP-0001)
 */
export const getNextOrderId = async (): Promise<string> => {
  const counterRef = doc(db, "metadata", "counters");
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let nextCount = 1;
    if (counterDoc.exists()) {
      nextCount = (counterDoc.data().orderCount || 0) + 1;
    }
    
    transaction.set(counterRef, { orderCount: nextCount }, { merge: true });
    
    return formatOrderId(nextCount);
  });
};
