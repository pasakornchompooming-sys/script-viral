import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";

const firebaseConfig = {
  // ✅ แก้ไข: โหลดคีย์จากตัวแปรสภาพแวดล้อม VITE_FIREBASE_API_KEY
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: "shorts-script-promptsfactory.firebaseapp.com",
  projectId: "shorts-script-promptsfactory",
  storageBucket: "shorts-script-promptsfactory.firebasestorage.app",
  messagingSenderId: "828835339790",
  appId: "1:828835339790:web:8d849b0297ffc7d48c265f"
};


// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Gemini
// ✅ แก้ไข: โหลดคีย์ Gemini จากตัวแปรสภาพแวดล้อม VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

// AI wrapper
export const generateContent = async ({ prompt, responseMimeType, responseSchema }) => {
  const MAX_API_RETRIES = 3;

  for (let i = 0; i < MAX_API_RETRIES; i++) {
    try {
      const model = ai.getGenerativeModel({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType,
          responseSchema,
        }
      });

      const response = await model.generateContent({
        contents: prompt
      });

      const part = response.response.candidates[0]?.content?.parts[0];
      if (part?.text) return part;

      throw new Error("AI response was empty or malformed.");
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);

      const msg = error.message || String(error);

      if (msg.includes("429") || msg.includes("Resource exhausted") || i === MAX_API_RETRIES - 1) {
        throw new Error("API Final Failure: " + msg);
      }

      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};

// Correct sign-in / sign-out
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);

export { auth, db, googleProvider };