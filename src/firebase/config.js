
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWGGMzadhJki8ElxEUMuOOcxyG5_jAtgY",
  authDomain: "image-verification-process.firebaseapp.com",
  projectId: "image-verification-process",
  storageBucket: "image-verification-process.firebasestorage.app",
  messagingSenderId: "523280034033",
  appId: "1:523280034033:web:5aff23f6aaa79ad9cf6150",
  measurementId: "G-2D2599X7CX"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
