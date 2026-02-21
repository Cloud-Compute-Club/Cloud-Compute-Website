import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';

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

async function testGetUserActivity(uid) {
    console.log(`Testing getUserActivity for UID: ${uid}`);
    try {
        const postsRef = collection(db, 'posts');

        // First try authorId
        console.log('Querying by authorId...');
        let postsQuery = query(postsRef, where('authorId', '==', uid), limit(20));
        let postsSnap = await getDocs(postsQuery);
        console.log(`Found ${postsSnap.docs.length} docs by authorId`);

        if (postsSnap.empty) {
            console.log('Querying by userId...');
            postsQuery = query(postsRef, where('userId', '==', uid), limit(20));
            postsSnap = await getDocs(postsQuery);
            console.log(`Found ${postsSnap.docs.length} docs by userId`);
        }

        const createdPosts = postsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'post'
        }));

        console.log('Results:');
        createdPosts.forEach(p => console.log(`- ${p.title} (ID: ${p.id})`));

    } catch (e) {
        console.error('Error during test:', e);
    }
    process.exit(0);
}

testGetUserActivity('xKTR9ZVtCSZ36RF94TqUgroXbYL2');
