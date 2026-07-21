import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DrillState } from "../types";

let db: any = null;
let firestoreEnabled = false;

export function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  try {
    // If we have some config, let's initialize
    if (projectId && clientEmail && privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
      
      const app = getApps().length === 0 ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      }) : getApp();
      
      db = getFirestore(app);
      firestoreEnabled = true;
      console.log("🔥 [Firebase] Initialized with Service Account.");
    } else if (projectId) {
      const app = getApps().length === 0 ? initializeApp({
        projectId,
      }) : getApp();
      
      db = getFirestore(app);
      firestoreEnabled = true;
      console.log("🔥 [Firebase] Initialized with Project ID:", projectId);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const app = getApps().length === 0 ? initializeApp() : getApp();
      db = getFirestore(app);
      firestoreEnabled = true;
      console.log("🔥 [Firebase] Initialized via ADC (Application Default Credentials).");
    } else {
      console.log("ℹ️ [Firebase] No credentials found. Using local JSON database (db.json) for state storage.");
    }
  } catch (error) {
    console.error("❌ [Firebase] Failed to initialize Firebase Admin:", error);
  }
}

export function isFirebaseActive(): boolean {
  return firestoreEnabled && db !== null;
}

export async function getFirebaseState(): Promise<DrillState | null> {
  if (!isFirebaseActive()) return null;
  try {
    const docRef = db.collection("drills").doc("active_drill_state");
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data() as DrillState;
    }
  } catch (error) {
    console.error("❌ [Firebase] Error getting Firestore state:", error);
  }
  return null;
}

export async function saveFirebaseState(state: DrillState): Promise<boolean> {
  if (!isFirebaseActive()) return false;
  try {
    const docRef = db.collection("drills").doc("active_drill_state");
    await docRef.set(state);
    return true;
  } catch (error) {
    console.error("❌ [Firebase] Error saving Firestore state:", error);
    return false;
  }
}
