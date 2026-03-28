import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC_LGsP7tappArI4aXFov46htpXLMdLGGM',
  authDomain: 'colohacks-6eae3.firebaseapp.com',
  projectId: 'colohacks-6eae3',
  storageBucket: 'colohacks-6eae3.firebasestorage.app',
  messagingSenderId: '892293799919',
  appId: '1:892293799919:web:0dd3e1edef074aab31e01a',
  measurementId: 'G-ZB3EV7S64X'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;