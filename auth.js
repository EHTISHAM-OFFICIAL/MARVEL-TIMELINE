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
import { auth, db } from "./firebase.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setLoading(false);
  }), []);
  return { user, loading };
}

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export async function signup(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
  return credential.user;
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());
export const logout = () => signOut(auth);

export async function deleteAccount(password) {
  const user = auth.currentUser;
  if (!user) throw new Error("No signed-in account was found.");
  if (!user.email) throw new Error("This account cannot be deleted from this screen.");

  // Re-authenticate immediately before the destructive operation.
  const credential = EmailAuthProvider.credential(user.email, password || "");
  await reauthenticateWithCredential(user, credential);

  // Delete private tracker data while the account is still authenticated.
  await deleteDoc(doc(db, "users", user.uid));

  // Remove admin membership too, if this account is an administrator.
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
  };
  return messages[error?.code] || error?.message || "Authentication failed. Please try again.";
}
