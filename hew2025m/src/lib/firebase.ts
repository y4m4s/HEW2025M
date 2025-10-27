import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCMhquOCNW35XmCALVX7hzmhGpaoIOV8h0",
  authDomain: "hew2025-2d8cd.firebaseapp.com",
  projectId: "hew2025-2d8cd",
  storageBucket: "hew2025-2d8cd.appspot.com",
  messagingSenderId: "821572261475",
  appId: "1:821572261475:web:bd78bd02aefb28c4af8a56",
  measurementId: "G-58LMF3YFHL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { auth, provider, analytics };
