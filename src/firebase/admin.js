import admin from 'firebase-admin';
// import serviceAccount from '../../keys.json'
// if (!admin.apps.length) {

// var serviceAccount = require("path/to/serviceAccountKey.json");

// console.log(process.env.FIREBASE_PRIVATE_KEY)
try {
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount),
    //   databaseURL: "https://image-verification-process-default-rtdb.firebaseio.com"
    // });
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    // console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
// }

export default admin.firestore();
export const authAdmin = admin.auth();
export const Admin = admin;
