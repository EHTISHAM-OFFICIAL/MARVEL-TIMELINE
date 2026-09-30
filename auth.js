import { useEffect, useState } from "htm/react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, authPersistenceReady, db } from "./firebase.js";

// This UID is the fixed bootstrap administrator. Firestore Rules enforce the
// same UID server-side; additional administrators use /admins/{uid} records.
export const ADMIN_UID = "KLAoecq9ZaZxtmTlBcsbTO1dMnD2";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!alive) return;
      setUser(nextUser);
      setLoading(false);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return { user, loading };
}

async function signIn(email, password) {
  await authPersistenceReady;
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export const login = (email, password) => signIn(email, password);

export async function adminLogin(email, password) {
  const credential = await signIn(email, password);

  // Admin login is a dedicated entry point. Verify the authenticated Firebase
  // UID before allowing the browser to enter the admin console.
  if (credential?.user?.uid !== ADMIN_UID) {
    await signOut(auth);
    const error = new Error("This Firebase account is not the configured administrator account.");
    error.code = "auth/not-admin";
    throw error;
  }

  // Stay inside the current React session. The app is already on /admin,
  // and useAuth() will receive this authenticated user immediately. A hard
  // navigation here can race Firebase Auth persistence restoration and send
  // the browser back through the login screen.
  return credential.user;
}

export async function signup(email, password, displayName) {
  await authPersistenceReady;
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }
  return credential.user;
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());
export const logout = () => signOut(auth);

export async function deleteAccount(password) {
  const user = auth.currentUser;
  if (!user) throw new Error("No signed-in account was found.");
  if (!user.email) throw new Error("This account cannot be deleted from this screen.");

  const credential = EmailAuthProvider.credential(user.email, password || "");
  await reauthenticateWithCredential(user, credential);
  await deleteDoc(doc(db, "users", user.uid));

  try {
    await deleteDoc(doc(db, "admins", user.uid));
  } catch {}

  await deleteUser(user);
}

export function authErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait a little and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase yet.",
    "auth/requires-recent-login": "For security, please sign in again before deleting your account.",
    "auth/not-admin": "This account is not authorized to access the administrator panel.",
    "auth/admin-account": "This administrator account must use the administrator sign-in at /admin.",
    "auth/admin-verification-failed": "We couldn’t verify administrator access. Please check the administrator record and make sure the latest Firestore rules are deployed.",
    "permission-denied": "You don’t have permission to access this account data. Please sign in again or contact the administrator.",
    "unauthenticated": "Your Firebase session expired. Please sign in again.",
  };
  return messages[error?.code] || error?.message || "Authentication failed. Please try again.";
}
