import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from 'process';

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PRODUCT_ID,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(
        /\\n/g,
        '\n',
      ),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${env.FIREBASE_PRODUCT_ID}.firebaseio.com`,
  });
}

export const FirebaseAuth =
  () => (target: unknown, propertyKey: string | symbol) => {
    target[propertyKey] = getAuth(getApp());
  };
