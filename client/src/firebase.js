import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyApFcspx1KS-97tMAi8i0w2Oub0vWdJpPA",
  authDomain: "countthebasket-28508.firebaseapp.com",
  projectId: "countthebasket-28508",
  storageBucket: "countthebasket-28508.firebasestorage.app",
  messagingSenderId: "42655718837",
  appId: "1:42655718837:web:517c3e271800aa6a7f0dfc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);