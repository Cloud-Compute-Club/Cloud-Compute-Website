import { atom } from 'nanostores';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as updateAuthProfile,
    sendEmailVerification as sendEmailVerificationAuth,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { auth, db, uploadFile } from '../api/api';

export const $currentUser = atom(null);
export const $authLoading = atom(true);

let unsubscribeAuth = null;

export const initAuth = () => {
    if (unsubscribeAuth) return; // Prevent multiple listeners

    const authInstance = getAuth();
    unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data() || {};

                $currentUser.set({
                    ...userData,
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    photoURL: user.photoURL,
                    role: userData.role || 'user',
                    metadata: {
                        creationTime: user.metadata?.creationTime,
                        lastSignInTime: user.metadata?.lastSignInTime
                    }
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                $currentUser.set({
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName || user.email,
                    photoURL: user.photoURL || null,
                    role: 'user'
                });
            }
        } else {
            $currentUser.set(null);
        }
        $authLoading.set(false);
    });
};

export const sendEmailVerification = async (user) => {
    try {
        await sendEmailVerificationAuth(user);
        return { success: true };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};

export const updateUserProfile = async (updates) => {
    const currentUser = $currentUser.get();
    if (!currentUser) {
        const error = new Error('No user logged in');
        error.code = 'auth/not-authenticated';
        throw error;
    }

    try {
        let photoURL = currentUser.photoURL;

        if (updates.photoFile) {
            // ... (File upload logic similar to AuthContext)
            // Ignoring full validation logic for brevity in this snippet, assumes helper handles it if possible or inline here
            // Replicating logic:
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024;

            if (!validTypes.includes(updates.photoFile.type)) {
                throw new Error('Invalid file type.');
            }
            if (updates.photoFile.size > maxSize) {
                throw new Error('File too large.');
            }

            const fileExt = updates.photoFile.name.split('.').pop();
            const fileName = `profile-${Date.now()}.${fileExt}`;

            photoURL = await uploadFile(
                updates.photoFile,
                `profile-pictures/${currentUser.uid}/${fileName}`
            );
        }

        const authUpdates = {};
        if (updates.displayName) authUpdates.displayName = updates.displayName;
        if (photoURL !== currentUser.photoURL) authUpdates.photoURL = photoURL;

        if (updates.email && updates.email !== currentUser.email) {
            await updateEmail(auth.currentUser, updates.email);
        }

        if (updates.password && updates.currentPassword) {
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                updates.currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, updates.password);
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const firestoreUpdates = {
            updatedAt: serverTimestamp(),
        };
        if (updates.displayName) firestoreUpdates.displayName = updates.displayName.trim();
        if (photoURL !== currentUser.photoURL) firestoreUpdates.photoURL = photoURL;

        if (Object.keys(authUpdates).length > 0) {
            await updateAuthProfile(auth.currentUser, authUpdates);
        }
        if (Object.keys(firestoreUpdates).length > 1) { // 1 because updatedAt is always there
            await updateDoc(userRef, firestoreUpdates);
        }

        await auth.currentUser.reload();
        // The listener will pick up changes, but we can optimistically update or re-fetch
        // Wait for listener or manual fetch
        // Actually AuthStateChanged might not fire for profile updates immediately unless token refreshes
        // Manually updating store helps responsiveness

        // Fetch fresh data
        const updatedUserDoc = await getDoc(userRef);
        const updatedAuthUser = auth.currentUser;
        const finalUser = {
            ...updatedUserDoc.data(),
            uid: updatedAuthUser.uid,
            email: updatedAuthUser.email,
            emailVerified: updatedAuthUser.emailVerified,
            displayName: updatedAuthUser.displayName,
            photoURL: updatedAuthUser.photoURL,
        };
        $currentUser.set(finalUser);

        return { success: true, user: finalUser };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
};

export const updateUserBanner = async (file) => {
    const currentUser = $currentUser.get();
    try {
        if (!currentUser) throw new Error('No user is signed in');

        const path = `banners/${currentUser.uid}/${file.name}`;
        const bannerURL = await uploadFile(file, path);

        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { bannerURL });

        $currentUser.set({ ...currentUser, bannerURL });
        return { success: true, bannerURL };
    } catch (error) {
        console.error('Error updating banner:', error);
        return { success: false, error: error.message };
    }
};

export const signup = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await updateAuthProfile(userCredential.user, {
            displayName: username
        });

        await sendEmailVerification(userCredential.user);

        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email,
            displayName: username,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Account created successfully! Please check your email to verify your account.'
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create account. Please try again.'
        };
    }
};

export const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const loginWithGoogle = async () => {
    try {
        const { signInWithGoogle: apiSignInWithGoogle } = await import('../api/api');
        await apiSignInWithGoogle();
        return { success: true };
    } catch (error) {
        console.error('Google login error:', error);
        return { success: false, error: error.message };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        $currentUser.set(null);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
