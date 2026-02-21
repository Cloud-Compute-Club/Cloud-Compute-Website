import { createContext, useContext, useEffect, useState } from 'react';
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
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage, uploadFile } from '../api/api';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Send email verification
  const sendEmailVerification = async (user) => {
    try {
      await sendEmailVerificationAuth(user);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) {
      const error = new Error('No user logged in');
      error.code = 'auth/not-authenticated';
      throw error;
    }

    try {
      let photoURL = currentUser.photoURL; // Start with the current URL

      // If a new photo file is provided, upload it and get the URL
      if (updates.photoFile) {
        try {
          // Validate file type and size
          const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
          const maxSize = 5 * 1024 * 1024; // 5MB

          if (!validTypes.includes(updates.photoFile.type)) {
            const error = new Error('Invalid file type. Please upload a JPG, PNG, or GIF image.');
            error.code = 'storage/invalid-file-type';
            throw error;
          }

          if (updates.photoFile.size > maxSize) {
            const error = new Error('File is too large. Maximum size is 5MB.');
            error.code = 'storage/file-too-large';
            throw error;
          }

          // Add a unique identifier to the filename
          const fileExt = updates.photoFile.name.split('.').pop();
          const fileName = `profile-${Date.now()}.${fileExt}`;

          photoURL = await uploadFile(
            updates.photoFile,
            `profile-pictures/${currentUser.uid}/${fileName}`
          );
        } catch (error) {
          console.error('Error uploading photo:', error);
          // Enhance error message for CORS issues
          if (error.code === 'storage/unauthorized' ||
            error.message.includes('CORS') ||
            error.message.includes('Network Error')) {
            const corsError = new Error(
              'Unable to upload image. Please check your internet connection or try again later.'
            );
            corsError.code = 'storage/cors-error';
            throw corsError;
          }
          // Re-throw with enhanced error handling
          const uploadError = new Error(
            error.message || 'Failed to upload photo. Please try again.'
          );
          uploadError.code = error.code || 'storage/upload-failed';
          throw uploadError;
        }
      }

      // Update Firebase Auth profile
      const authUpdates = {};
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      // Always include photoURL in auth updates if it has changed.
      if (photoURL !== currentUser.photoURL) {
        authUpdates.photoURL = photoURL;
      }


      // Update email if provided
      if (updates.email && updates.email !== currentUser.email) {
        await updateEmail(auth.currentUser, updates.email);
      }

      // Update password if provided
      if (updates.password && updates.currentPassword) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          updates.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, updates.password);
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      const firestoreUpdates = {
        updatedAt: serverTimestamp(), // Use server timestamp for consistency
      };
      if (updates.displayName) firestoreUpdates.displayName = updates.displayName.trim();
      if (photoURL !== currentUser.photoURL) {
        firestoreUpdates.photoURL = photoURL;
      }

      // Only proceed with updates if there are actual changes
      if (Object.keys(authUpdates).length > 0 || Object.keys(firestoreUpdates).length > 1) {
        if (Object.keys(authUpdates).length > 0) {
          await updateAuthProfile(auth.currentUser, authUpdates);
        }
        if (Object.keys(firestoreUpdates).length > 1) {
          await updateDoc(userRef, firestoreUpdates);
        }
      }

      // Refresh user data by fetching the latest from Firestore
      await auth.currentUser.reload(); // Get latest data from auth
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
      setCurrentUser(finalUser);

      return { success: true, user: finalUser };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user banner
  const updateUserBanner = async (file) => {
    try {
      if (!currentUser) throw new Error('No user is signed in');

      const path = `banners/${currentUser.uid}/${file.name}`;
      const bannerURL = await uploadFile(file, path);

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { bannerURL });

      setCurrentUser(prevUser => ({ ...prevUser, bannerURL }));

      return { success: true, bannerURL };
    } catch (error) {
      console.error('Error updating banner:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign up with email and password
  const signup = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update user profile with display name
      await updateAuthProfile(userCredential.user, {
        displayName: username
      });

      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Create a user document in Firestore
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

  // Login with email and password
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data() || {};

          // Merge auth user data with Firestore data, ensuring auth data takes precedence for core fields
          setCurrentUser({
            ...userData, // Firestore data first
            uid: user.uid, // Core auth data takes precedence
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic auth data if Firestore fails
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL || null
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Periodically check for email verification status
  useEffect(() => {
    let intervalId;
    if (currentUser && !currentUser.emailVerified) {
      intervalId = setInterval(async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          // The onAuthStateChanged listener above will fire with the updated user, refreshing the state.
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentUser, auth]);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    updateUserProfile,
    updateUserBanner,
    sendEmailVerification: (user) => sendEmailVerification(user || currentUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

