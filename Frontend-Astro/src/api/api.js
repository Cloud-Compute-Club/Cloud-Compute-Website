import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  orderBy,
  increment,
  runTransaction,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase safely to prevent "duplicate-app" errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Exports ---
export { auth, db, storage };

export const initFirebase = async () => {
  try {
    // Already initialized above
    return { app, auth, db };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
};

// --- Authentication ---
// Initialize Google auth provider
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// Helper function to handle Firebase Auth errors
const handleAuthError = (error) => {
  console.error('Auth error:', error);

  // Default error message
  let message = 'Authentication failed';
  let code = error.code || 'auth/unknown';

  // Map Firebase Auth error codes to user-friendly messages
  const errorMap = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email is already in use',
    'auth/weak-password': 'Password is too weak',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/requires-recent-login': 'Please log in again to perform this action',
    'auth/network-request-failed': 'Network error. Please check your connection',
  };

  return new ApiError(
    errorMap[code] || error.message || message,
    code,
    { originalError: error }
  );
};

// Helper function to handle Firestore errors
const handleFirestoreError = (error) => {
  console.error('Firestore error:', error);

  let message = 'Database operation failed';
  let code = error.code || 'firestore/unknown';

  const errorMap = {
    'permission-denied': 'You do not have permission to perform this action',
    'not-found': 'The requested document was not found',
    'already-exists': 'A document with this ID already exists',
    'unavailable': 'Service is currently unavailable. Please try again later.',
  };

  return new ApiError(
    errorMap[code] || error.message || message,
    code,
    { originalError: error }
  );
};

// Helper function to handle Storage errors
const handleStorageError = (error) => {
  console.error('Storage error:', error);

  let message = 'File operation failed';
  let code = error.code || 'storage/unknown';

  const errorMap = {
    'storage/unauthorized': 'You do not have permission to access this file',
    'storage/canceled': 'The operation was canceled',
    'storage/unknown': 'An unknown error occurred during file operation',
    'storage/object-not-found': 'The requested file does not exist',
    'storage/quota-exceeded': 'Storage quota exceeded',
  };

  return new ApiError(
    errorMap[code] || error.message || message,
    code,
    { originalError: error }
  );
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper to retry Firestore operations if the client is temporarily "offline" during auth state transitions
const getDocWithRetry = async (docRef, retries = 2, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await getDoc(docRef);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('[Auth] Starting Google Sign-In...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Auth] Popup successful, user:', result.user.email);

    // Give Firestore a moment to recognize the new auth state if needed
    try {
      const userRef = doc(db, 'users', result.user.uid);
      console.log('[Auth] Checking user document in Firestore:', userRef.path);

      const userDoc = await getDocWithRetry(userRef);
      console.log('[Auth] User document exists:', userDoc.exists());

      if (!userDoc.exists()) {
        console.log('[Auth] Creating new Firestore user document...');
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        });
        console.log('[Auth] New user document created.');
      }
      return { success: true };
    } catch (firestoreError) {
      console.error('[Auth] Firestore sync failed:', firestoreError);
      // We don't necessarily want to sign out if the auth succeeded but only firestore failed
      // but to keep it consistent with the "user document must exist" rule:
      await signOut(auth);
      throw handleFirestoreError(firestoreError);
    }
  } catch (error) {
    console.error('[Auth] Google Sign-In Error:', error.code, error.message);
    if (error instanceof ApiError) throw error;
    throw handleAuthError(error);
  }
};

export const signup = async (email, password, username) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: username,
        role: 'user', // Default role
        createdAt: new Date().toISOString(),
      });
    } catch (firestoreError) {
      // If Firestore fails, delete the auth user to prevent orphaned accounts
      try {
        await user.delete();
      } catch (deleteError) {
        console.error('Failed to clean up auth user after Firestore error:', deleteError);
      }
      throw handleFirestoreError(firestoreError);
    }

    return { success: true, user };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handleAuthError(error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Fetch posts in real time.
 * @param {function} callback - Called with array of posts whenever updated
 * @returns {function} - Unsubscribe function
 */
export const getPosts = (callback, onError) => {
  try {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() });
        });
        callback(posts);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        if (onError) {
          onError(handleFirestoreError(error));
        } else {
          throw handleFirestoreError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up posts listener:", error);
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch a single post by its ID.
 * @param {string} postId - The ID of the post to fetch.
 * @returns {Promise<object>} - The post data.
 * @throws {ApiError} - If the post is not found or an error occurs.
 */
export const getPost = async (postId) => {
  console.log('[API] Fetching post with ID:', postId);
  try {
    if (!postId) {
      console.error('[API] Error: No post ID provided');
      throw new ApiError('Post ID is required', 'validation/missing-post-id');
    }

    const postRef = doc(db, "posts", postId);
    console.log('[API] Post reference created:', postRef.path);

    const postSnap = await getDoc(postRef);
    console.log('[API] Post document snapshot:', postSnap.exists() ? 'exists' : 'does not exist');

    if (!postSnap.exists()) {
      console.error(`[API] Error: No post found with ID: ${postId}`);
      throw new ApiError('Post not found', 'firestore/not-found');
    }

    const postData = { id: postSnap.id, ...postSnap.data() };
    console.log('[API] Retrieved post data:', postData);
    return postData;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Add a new post.
 * @param {string} title - The title of the post.
 * @param {string} content - The content of the post.
 * @returns {Promise<object>} - The newly created post data.
 * @throws {ApiError} - If the post creation fails.
 */
export const addPost = async (title, content) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }

    if (!title || !content) {
      throw new ApiError('Title and content are required', 'validation/missing-fields');
    }

    const postsRef = collection(db, "posts");
    const docRef = await addDoc(postsRef, {
      title: title.trim(),
      content: content.trim(),
      userId: auth.currentUser.uid,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Anonymous',
      authorPhotoURL: auth.currentUser.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      votes: 0,
      commentCount: 0
    });

    // Return the newly created post with its ID
    return {
      id: docRef.id,
      title,
      content,
      userId: auth.currentUser.uid,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Anonymous',
      authorPhotoURL: auth.currentUser.photoURL || null,
      votes: 0,
      commentCount: 0
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Delete a post by its ID.
 * @param {string} postId - The ID of the post to delete.
 * @returns {Promise<void>}
 * @throws {ApiError} - If the deletion fails.
 */
export const deletePost = async (postId) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }
    if (!postId) {
      throw new ApiError('Post ID is required', 'validation/missing-post-id');
    }

    const postRef = doc(db, "posts", postId);
    await deleteDoc(postRef);

  } catch (error) {
    console.error("Error deleting post:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch comments for a specific post in real time.
 * @param {string} postId - The ID of the post.
 * @param {function} callback - Function to call with the comments array.
 * @returns {function} - Unsubscribe function.
 * @throws {ApiError} - If postId is invalid or an error occurs.
 */
export const getComments = (postId, callback) => {
  try {
    if (!postId) {
      throw new ApiError('Post ID is required', 'validation/missing-post-id');
    }

    const commentsRef = collection(db, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const comments = [];
        snapshot.forEach((doc) => {
          comments.push({ id: doc.id, ...doc.data() });
        });
        callback(comments);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        throw handleFirestoreError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up comments listener:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Add a comment to a specific post.
 * @param {string} postId - The ID of the post to comment on.
 * @param {string} content - The comment content.
 * @returns {Promise<object>} - The newly created comment data.
 * @throws {ApiError} - If the comment creation fails.
 */
export const updateComment = async (postId, commentId, newContent) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }
    if (!postId || !commentId || !newContent) {
      throw new ApiError('Post ID, Comment ID, and new content are required', 'validation/missing-fields');
    }

    const commentRef = doc(db, "posts", postId, "comments", commentId);

    await updateDoc(commentRef, {
      content: newContent.trim(),
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error("Error updating comment:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Deletes a specific comment.
 * @param {string} postId - The ID of the post containing the comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<void>}
 * @throws {ApiError} - If the deletion fails.
 */
export const deleteComment = async (postId, commentId) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }
    if (!postId || !commentId) {
      throw new ApiError('Post ID and Comment ID are required', 'validation/missing-ids');
    }

    const commentRef = doc(db, "posts", postId, "comments", commentId);
    const postRef = doc(db, "posts", postId);

    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists()) {
        throw new ApiError('Comment not found', 'firestore/not-found');
      }

      // Ensure the user is the author before deleting
      if (commentDoc.data().authorId !== auth.currentUser.uid) {
        throw new ApiError('You do not have permission to delete this comment', 'permission-denied');
      }

      transaction.delete(commentRef);
      transaction.update(postRef, {
        commentCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

export const addComment = async (postId, content, parentId = null) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }

    if (!postId || !content) {
      throw new ApiError('Post ID and content are required', 'validation/missing-fields');
    }

    const commentsRef = collection(db, "posts", postId, "comments");
    const commentData = {
      content: content.trim(),
      userId: auth.currentUser.uid,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Anonymous',
      authorPhotoURL: auth.currentUser.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      votes: 0,
      parentId: parentId,
    };

    // Start a transaction to update both the comment and the post's comment count
    await runTransaction(db, async (transaction) => {
      // Add the comment
      const commentRef = await addDoc(commentsRef, commentData);

      // Update the post's comment count
      const postRef = doc(db, "posts", postId);
      transaction.update(postRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp()
      });

      return { id: commentRef.id, ...commentData };
    });

    return { ...commentData };
  } catch (error) {
    console.error("Error adding comment:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Vote on a post
 * @param {string} postId - The ID of the post to vote on.
 * @param {'up'|'down'} direction - The direction of the vote ('up' or 'down').
 * @returns {Promise<void>}
 * @throws {ApiError} - If the voting operation fails.
 */
export const voteOnPost = async (postId, direction) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }

    if (!postId) {
      throw new ApiError('Post ID is required', 'validation/missing-post-id');
    }

    if (direction !== 'up' && direction !== 'down') {
      throw new ApiError('Invalid vote direction', 'validation/invalid-direction');
    }

    const incrementValue = direction === 'up' ? 1 : -1;
    const postRef = doc(db, "posts", postId);
    const userId = auth.currentUser.uid;
    const voteId = `post_${postId}_user_${userId}`;
    const userVoteRef = doc(db, "userVotes", voteId);

    await runTransaction(db, async (transaction) => {
      // Check if post exists
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw new ApiError('Post not found', 'firestore/not-found');
      }

      // Check if user already voted
      const voteDoc = await transaction.get(userVoteRef);
      const existingVote = voteDoc.data();

      if (existingVote) {
        // If same vote direction, remove the vote (toggle off)
        if (existingVote.direction === direction) {
          transaction.update(postRef, { votes: increment(-incrementValue) });
          transaction.delete(userVoteRef);
          return;
        }
        // If opposite direction, update the vote (change from up to down or vice versa)
        else {
          transaction.update(postRef, { votes: increment(direction === 'up' ? 2 : -2) });
        }
      }
      // New vote
      else {
        transaction.update(postRef, { votes: increment(incrementValue) });
      }

      // Update or create the user's vote record
      transaction.set(userVoteRef, {
        userId,
        postId,
        direction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error voting on post:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Vote on a comment
 * @param {string} postId - The ID of the post containing the comment.
 * @param {string} commentId - The ID of the comment to vote on.
 * @param {'up'|'down'} direction - The direction of the vote ('up' or 'down').
 * @returns {Promise<void>}
 * @throws {ApiError} - If the voting operation fails.
 */
export const voteOnComment = async (postId, commentId, direction) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }

    if (!postId || !commentId) {
      throw new ApiError('Post ID and Comment ID are required', 'validation/missing-ids');
    }

    if (direction !== 'up' && direction !== 'down') {
      throw new ApiError('Invalid vote direction', 'validation/invalid-direction');
    }

    const incrementValue = direction === 'up' ? 1 : -1;
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    const userId = auth.currentUser.uid;
    const voteId = `comment_${commentId}_user_${userId}`;
    const userVoteRef = doc(db, "userCommentVotes", voteId);

    await runTransaction(db, async (transaction) => {
      // Check if comment exists
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists()) {
        throw new ApiError('Comment not found', 'firestore/not-found');
      }

      // Check if user already voted
      const voteDoc = await transaction.get(userVoteRef);
      const existingVote = voteDoc.data();

      if (existingVote) {
        // If same vote direction, remove the vote (toggle off)
        if (existingVote.direction === direction) {
          transaction.update(commentRef, { votes: increment(-incrementValue) });
          transaction.delete(userVoteRef);
          return;
        }
        // If opposite direction, update the vote (change from up to down or vice versa)
        else {
          transaction.update(commentRef, { votes: increment(direction === 'up' ? 2 : -2) });
        }
      }
      // New vote
      else {
        transaction.update(commentRef, { votes: increment(incrementValue) });
      }

      // Update or create the user's vote record
      transaction.set(userVoteRef, {
        userId,
        postId,
        commentId,
        direction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Upload a file to a specified path in Firebase Storage.
 * @param {File} file - The file to upload.
 * @param {string} path - The storage path (e.g., 'banners/user-id').
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export const uploadFile = async (file, path) => {
  try {
    // Validate file
    if (!file) {
      throw new ApiError('No file provided', 'storage/no-file');
    }

    // Check file size (e.g., 5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new ApiError('File size exceeds the 5MB limit', 'storage/file-too-large');
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new ApiError('Invalid file type. Only images are allowed', 'storage/invalid-type');
    }

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handleStorageError(error);
  }
};

// Export error types for consistent error handling
export const ERROR_TYPES = {
  AUTH: 'auth',
  FIRESTORE: 'firestore',
  STORAGE: 'storage',
  VALIDATION: 'validation',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
};

// Utility function to check error types
export const isErrorOfType = (error, type) => {
  if (!error || !error.code) return false;
  return error.code.startsWith(type);
};
