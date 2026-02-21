import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function listUsers() {
    console.log('Listing users...');
    try {
        const snap = await getDocs(collection(db, 'users'));
        console.log(`Found ${snap.docs.length} users`);
        snap.docs.forEach(doc => {
            console.log(`- [${doc.id}] ${doc.data().displayName} (Role: ${doc.data().role})`);
        });
    } catch (e) {
        console.error('Error (might be expected due to rules):', e.message);
    }
    process.exit(0);
}

listUsers();
