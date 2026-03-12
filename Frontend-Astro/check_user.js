import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUser(displayName) {
    console.log(`Checking user: ${displayName}`);
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', displayName));
        const snap = await getDocs(q);

        if (snap.empty) {
            console.log('No user found with that display name.');
            return;
        }

        snap.forEach(doc => {
            console.log('User Data:', JSON.stringify(doc.data(), null, 2));
        });
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

checkUser('Taufeeq Ali');
