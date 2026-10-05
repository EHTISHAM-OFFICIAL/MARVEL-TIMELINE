import { useEffect, useState } from "htm/react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "../firebase.js";
import { DEFAULT_SITE_CONFIG, setRuntimeConfig } from "./siteConfig.js";

// Fixed bootstrap administrator. Firestore Rules enforce the same UID.
export const BOOTSTRAP_ADMIN_UID = "KLAoecq9ZaZxtmTlBcsbTO1dMnD2";

export function useAdminAccess(user) {
  const uid = user?.uid || null;
  const isBootstrap = uid === BOOTSTRAP_ADMIN_UID;
  // `uid` records which account this result belongs to. Without it the hook
  // briefly reports the PREVIOUS account's result (not-admin, not-loading) on
  // the very render where a login completes, and app.js signs the user out.
  const [state, setState] = useState({ uid: null, isAdmin: false, error: "" });
  useEffect(() => {
    if (!uid || isBootstrap) return;
    let alive = true;
    getDoc(doc(db, "admins", uid))
      .then((s) => {
        if (!alive) return;
        if (s.exists() && s.data()?.enabled === true) {
          setState({ uid, isAdmin: true, error: "" });
        } else {
          setState({
            uid,
            isAdmin: false,
            error:
              "This account is not authorized to open the administrator panel.",
          });
        }
      })
      .catch((error) => {
        if (!alive) return;
        setState({
          uid,
          isAdmin: false,
          error:
            error?.code === "permission-denied"
              ? "We couldn’t verify administrator access. Please make sure the administrator record exists and the latest Firestore rules are deployed."
              : "We couldn’t verify administrator access right now. Please try again.",
        });
      });
    return () => {
      alive = false;
    };
  }, [uid]);
  // Derived synchronously during render, so there is never a stale frame.
  if (!uid) return { loading: false, isAdmin: false, error: "" };
  if (isBootstrap) return { loading: false, isAdmin: true, error: "" };
  if (state.uid !== uid) return { loading: true, isAdmin: false, error: "" };
  return { loading: false, isAdmin: state.isAdmin, error: state.error };
}
export async function loadAdminUsers() {
  const [usersSnap, adminsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "admins")),
  ]);
  const adminIds = new Set(adminsSnap.docs.map((d) => d.id));
  return usersSnap.docs
    .filter((d) => !adminIds.has(d.id))
    .map((d) => ({ uid: d.id, ...d.data() }));
}
export async function loadAdminConfig() {
  const pub = await getDoc(doc(db, "siteConfig", "public"));
  const priv = await getDoc(doc(db, "siteConfig", "private"));
  const publicConfig = pub.exists() ? pub.data() : DEFAULT_SITE_CONFIG;
  return {
    public: {
      ...DEFAULT_SITE_CONFIG,
      ...publicConfig,
      site: { ...DEFAULT_SITE_CONFIG.site, ...(publicConfig.site || {}) },
      themes: { ...DEFAULT_SITE_CONFIG.themes, ...(publicConfig.themes || {}) },
    },
    private: priv.exists() ? priv.data() : {},
  };
}
export async function savePrivateConfig(patch) {
  await setDoc(
    doc(db, "siteConfig", "private"),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
export async function saveAdminThemeConfig(config) {
  await setDoc(
    doc(db, "siteConfig", "public"),
    { ...config, updatedAt: serverTimestamp() },
    { merge: true },
  );
  setRuntimeConfig(config);
}
export async function setAdminUser(
  uid,
  enabled = true,
  label = "Administrator",
) {
  if (!uid) throw new Error("A user UID is required.");
  await setDoc(
    doc(db, "admins", uid),
    { enabled, role: "admin", label, updatedAt: serverTimestamp() },
    { merge: true },
  );
  if (enabled) await deleteDoc(doc(db, "users", uid));
}
export async function removeAdminUser(uid) {
  await deleteDoc(doc(db, "admins", uid));
}
