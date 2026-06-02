import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAzRzTk2osnh-3P1W9nDGYP90IwXByn59Y",
  authDomain: "od-honeysuckle-and-mint-shop.firebaseapp.com",
  projectId: "od-honeysuckle-and-mint-shop",
  storageBucket: "od-honeysuckle-and-mint-shop.firebasestorage.app",
  messagingSenderId: "963372448573",
  appId: "1:963372448573:web:bd8e06d07141b4dd36a354"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
