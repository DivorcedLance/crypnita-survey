import "server-only";
import admin from "firebase-admin";

interface FirebaseAdmin {
  projectId: string;
  clientEmail: string;
  storageBucket: string;
  privateKey: string;
}

function formatPrivateKey(privateKey: string) {
  if (!privateKey) {
    throw new Error("Firebase Admin Private Key is not provided");
  }
  return privateKey.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(params: FirebaseAdmin) {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = formatPrivateKey(params.privateKey);

  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey,
  });

  return admin.initializeApp({
    credential: cert,
    projectId: params.projectId,
    storageBucket: params.storageBucket,
  });
}

export async function initAdmin() {
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase Admin credentials are not provided");
  }

  const params = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY as string,
  };

  return createFirebaseAdminApp(params);
}

export async function getAdminAuth() {
  const app = await initAdmin();
  return app.auth();
}

export async function getAdminFirestore() {
  const app = await initAdmin();
  return app.firestore();
}
