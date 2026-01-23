import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcwrxTDmTnRfTdpJjc12LlJsEesfdWmaQ",
  authDomain: "split-c3869.firebaseapp.com",
  projectId: "split-c3869",
  storageBucket: "split-c3869.appspot.com", // 🔴 FIXED
  messagingSenderId: "817194520288",
  appId: "1:817194520288:web:d08160e020d7d1fc7f4a85",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
