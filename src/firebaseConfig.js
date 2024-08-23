import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCzZAWCBKP83pl8Ay9j9aoIgKV8TBv6d9Y",
    authDomain: "chatting-40f48.firebaseapp.com",
    databaseURL: "https://chatting-40f48-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chatting-40f48",
    storageBucket: "chatting-40f48.appspot.com",
    messagingSenderId: "1006944070195",
    appId: "1:1006944070195:web:1c5117b7d1595006ac1146",
    measurementId: "G-Z2MGH4WEBC"
  };

  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };