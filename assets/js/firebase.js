// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqG2aa43DHDesRZbaZhR0qrZB3Rc0zXYs",
  authDomain: "nabungnikah-2b1a6.firebaseapp.com",
  projectId: "nabungnikah-2b1a6",
  storageBucket: "nabungnikah-2b1a6.appspot.com",
  messagingSenderId: "415904443926",
  appId: "1:415904443926:web:5a5e4a93ff2c5e5d5da6a7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
