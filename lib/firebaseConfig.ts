import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage"; 
import { doc, setDoc } from "firebase/firestore";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: 'AIzaSyDRNdF2bfIMLL11egHLvb-fOeNZrUFDi80',
  authDomain: 'nutrivision-37b5f.firebaseapp.com',
  projectId: 'nutrivision-37b5f',
  storageBucket: 'nutrivision-37b5f.appspot.com',
  messagingSenderId: '94959546917',
  appId: '1:94959546917:web:a8fa48e337e371d8f545cc',
};
console.log(firebaseConfig)
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Google Auth Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app)
const storage = getStorage(app); 


export { auth, googleProvider, db, storage};
