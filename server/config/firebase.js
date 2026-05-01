import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

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
export { db, admin };
