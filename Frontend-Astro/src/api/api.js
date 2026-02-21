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
  deleteDoc,
  where,
  limit,
  getDocs
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

const generateUserKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
          userKey: generateUserKey(),
          bio: '',
          tags: [],
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
        userKey: generateUserKey(),
        bio: '',
        tags: [],
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
 * Fetch a full user profile from Firestore.
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new ApiError('User profile not found', 'firestore/not-found');
    }
    const data = userDoc.data();
    // Ensure userKey exists for older accounts
    if (!data.userKey) {
      const userKey = generateUserKey();
      await updateDoc(userRef, { userKey });
      data.userKey = userKey;
    }
    return { uid, ...data };
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Update user profile information.
 */
export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch activity history for a specific user.
 */
export const getUserActivity = async (uid) => {
  const cleanUid = String(uid || '').trim();
  console.log('[DEBUG] getUserActivity called with clean UID:', cleanUid);

  if (!cleanUid) {
    console.warn('[DEBUG] No UID provided to getUserActivity');
    return { posts: [], voted: [] };
  }

  try {
    const postsRef = collection(db, 'posts');

    // Fetch posts where user is author OR user identifier (resilience)
    const [authorSnap, userSnap] = await Promise.all([
      getDocs(query(postsRef, where('authorId', '==', cleanUid), limit(30))),
      getDocs(query(postsRef, where('userId', '==', cleanUid), limit(30)))
    ]);

    // Use a Map to deduplicate by ID
    const postsMap = new Map();

    authorSnap.docs.forEach(doc => postsMap.set(doc.id, { id: doc.id, ...doc.data(), type: 'post' }));
    userSnap.docs.forEach(doc => postsMap.set(doc.id, { id: doc.id, ...doc.data(), type: 'post' }));

    const createdPosts = Array.from(postsMap.values());
    console.log(`[DEBUG] Found ${createdPosts.length} unique posts for UID: ${cleanUid}`);

    // Sort in memory to avoid needing composite indices
    createdPosts.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    console.log(`[DEBUG] api.js: Found ${createdPosts.length} posts for UID: ${uid}`);
    if (createdPosts.length > 0) {
      console.log('[DEBUG] api.js: First post authorId:', createdPosts[0].authorId, 'userId:', createdPosts[0].userId);
    }

    // 2. Get posts voted on by user
    const votesRef = collection(db, 'userVotes');
    const votesQuery = query(votesRef, where('userId', '==', uid), limit(20));
    const votesSnap = await getDocs(votesQuery);

    // Fetch post details for those votes
    const votedPosts = await Promise.all(votesSnap.docs.map(async (vDoc) => {
      const pDoc = await getDoc(doc(db, 'posts', vDoc.data().postId));
      if (pDoc.exists()) {
        const vData = vDoc.data();
        return {
          id: pDoc.id,
          ...pDoc.data(),
          type: 'voted',
          voteDirection: vData.direction,
          votedAt: vData.createdAt
        };
      }
      return null;
    }));

    const finalVoted = votedPosts.filter(p => p !== null);

    // Sort interactions in memory
    finalVoted.sort((a, b) => {
      const timeA = a.votedAt?.seconds || 0;
      const timeB = b.votedAt?.seconds || 0;
      return timeB - timeA;
    });

    return {
      posts: createdPosts,
      voted: finalVoted
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return { posts: [], voted: [] };
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
    // Simplified query to avoid index requirement for now
    const q = query(
      postsRef,
      orderBy("createdAt", "desc")
    );

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
 * Fetch posts by a specific user.
 * @param {string} userId - The ID of the user whose posts to fetch.
 * @param {number} limitCount - Maximum number of posts to fetch (default: 5).
 * @returns {Promise<Array>} - Array of posts.
 */
export const getPostsByUser = async (userId, limitCount = 5) => {
  try {
    const postsRef = collection(db, "posts");
    const q = query(
      postsRef,
      where("authorId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
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
export const addPost = async (title, content, images = [], isPinned = false, manualRole = null, files = []) => {
  const postsRef = collection(db, "posts");
  console.log('[DEBUG] addPost called with:', { title, isPinned, manualRole, fileCount: files.length });
  try {
    if (!auth.currentUser) {
      console.error('[DEBUG] addPost: No authenticated user!');
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }
    console.log('[DEBUG] addPost: Current User UID:', auth.currentUser.uid);

    if (!title || !content) {
      throw new ApiError('Title and content are required', 'validation/missing-fields');
    }

    // Fetch latest user data from Firestore
    let userData = {};
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) userData = userSnap.data();
    } catch (e) {
      console.warn('[API] Could not fetch user data for post, using auth defaults:', e);
    }

    // Handle image uploads
    const uploadedImages = [];
    for (const img of images) {
      if (img.file) {
        const path = `posts/${auth.currentUser.uid}/images/${Date.now()}-${img.file.name}`;
        const url = await uploadFile(img.file, path);
        uploadedImages.push({
          url,
          caption: img.caption || ''
        });
      }
    }

    // Handle file attachments
    const uploadedFiles = [];
    for (const fileObj of files) {
      if (fileObj.file) {
        const path = `posts/${auth.currentUser.uid}/files/${Date.now()}-${fileObj.file.name}`;
        const url = await uploadFile(fileObj.file, path);
        uploadedFiles.push({
          url,
          name: fileObj.file.name,
          size: fileObj.file.size,
          type: fileObj.file.type,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    const postData = {
      title: title.trim(),
      content: content,
      images: uploadedImages,
      files: uploadedFiles,
      pinned: isPinned,
      userId: auth.currentUser.uid,
      authorId: auth.currentUser.uid,
      authorName: userData.displayName || auth.currentUser.displayName || 'Anonymous',
      authorPhotoURL: userData.photoURL || auth.currentUser.photoURL || null,
      authorRole: manualRole || userData.role || 'Member',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      votes: 0,
      commentCount: 0
    };

    try {
      const docRef = await addDoc(postsRef, postData);
      return {
        id: docRef.id,
        ...postData,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };
    } catch (writeError) {
      console.error('[API] Firestore write failed:', writeError);
      throw writeError;
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

export const updatePost = async (postId, updates) => {
  const postRef = doc(db, "posts", postId);
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }

    // Process new images if any
    let finalImages = updates.images || [];
    if (updates.newImages && updates.newImages.length > 0) {
      for (const img of updates.newImages) {
        if (img.file) {
          const path = `posts/${auth.currentUser.uid}/images/${Date.now()}-${img.file.name}`;
          const url = await uploadFile(img.file, path);
          finalImages.push({
            url,
            caption: img.caption || ''
          });
        }
      }
    }

    // Process new files if any
    let finalFiles = updates.files || [];
    if (updates.newFiles && updates.newFiles.length > 0) {
      for (const fileObj of updates.newFiles) {
        if (fileObj.file) {
          const path = `posts/${auth.currentUser.uid}/files/${Date.now()}-${fileObj.file.name}`;
          const url = await uploadFile(fileObj.file, path);
          finalFiles.push({
            url,
            name: fileObj.file.name,
            size: fileObj.file.size,
            type: fileObj.file.type,
            uploadedAt: new Date().toISOString()
          });
        }
      }
    }

    const dataToUpdate = {
      title: updates.title,
      content: updates.content,
      authorRole: updates.authorRole,
      pinned: updates.pinned,
      images: finalImages,
      files: finalFiles,
      updatedAt: serverTimestamp()
    };

    await updateDoc(postRef, dataToUpdate);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handleFirestoreError(error);
  }
};

/**
 * Toggle the pinned status of a post.
 * @param {string} postId - The ID of the post.
 * @param {boolean} currentPinnedStatus - The current pinned status.
 * @returns {Promise<void>}
 */
export const togglePinPost = async (postId, currentPinnedStatus) => {
  try {
    if (!auth.currentUser) {
      throw new ApiError('User not authenticated', 'auth/not-authenticated');
    }

    // Check if user is admin (this would normally be enforced by security rules, 
    // but we can check here for better UI experience)
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.data()?.role !== 'admin') {
      throw new ApiError('Only admins can pin posts', 'permission-denied');
    }

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      pinned: !currentPinnedStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error toggling pin status:", error);
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

    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists()) {
        throw new ApiError('Comment not found', 'firestore/not-found');
      }

      // Ensure the user is the author before updating
      if (commentDoc.data().authorId !== auth.currentUser.uid) {
        throw new ApiError('You do not have permission to edit this comment', 'permission-denied');
      }

      transaction.update(commentRef, {
        content: newContent.trim(),
        updatedAt: serverTimestamp(),
      });
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

    // Fetch latest user data from Firestore to ensure we have displayName/photoURL
    let userData = {};
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) userData = userSnap.data();
    } catch (e) {
      console.warn('[API] Could not fetch user data for comment:', e);
    }

    const commentsRef = collection(db, "posts", postId, "comments");
    const commentData = {
      content: content.trim(),
      userId: auth.currentUser.uid,
      authorId: auth.currentUser.uid,
      authorName: userData.displayName || auth.currentUser.displayName || 'Anonymous',
      authorPhotoURL: userData.photoURL || auth.currentUser.photoURL || null,
      authorRole: userData.role || 'Member',
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
 * Fetch a user's vote for a specific post.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<'up'|'down'|null>} - The vote direction or null.
 */
export const getUserVote = async (postId) => {
  try {
    if (!auth.currentUser || !postId) return null;
    const voteId = `post_${postId}_user_${auth.currentUser.uid}`;
    const voteSnap = await getDoc(doc(db, "userVotes", voteId));
    return voteSnap.exists() ? voteSnap.data().direction : null;
  } catch (error) {
    console.error("Error fetching user vote:", error);
    return null;
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
    if (!file) {
      throw new ApiError('No file provided', 'storage/no-file');
    }

    // Increased limit for resource files (25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ApiError('File size exceeds the 25MB limit', 'storage/file-too-large');
    }

    // Allow all file types but keep a warning or specific check if needed
    // For cloud computing platform, we need to allow zips, json, yaml, etc.
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
