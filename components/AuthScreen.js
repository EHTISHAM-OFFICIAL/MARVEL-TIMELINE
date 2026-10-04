import { html, useState } from "htm/react";
import {
  adminLogin,
  authErrorMessage,
  login,
  resetPassword,
  signup,
} from "../services/auth.js";

export function AuthScreen({ adminMode = false }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setMessage("");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!adminMode && mode === "signup") {
      if (displayName.trim().length < 2) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "login") {
        if (adminMode) {
          await adminLogin(email, password);
          return;
        } else {
          await login(email, password);
        }
      } else {
        await signup(email, password, displayName);
      }
    } catch (err) {
      const friendly = authErrorMessage(err);
      setError(friendly);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setMessage("");
    setError("");
    if (!email.trim()) {
      setError("Enter your email first, then choose Forgot password.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return html`
    <main className=${adminMode ? "auth-page admin-auth-page" : "auth-page"}>
      <div className="auth-atmosphere"></div>
      <section className="auth-shell">
        <div className="auth-brand">
          <div className="auth-logo">
            ${adminMode ? "MARVEL ADMIN" : "MARVEL"}<span
              >${adminMode ? "Control Center" : "Timeline Tracker"}</span
            >
          </div>
          <p>
            ${adminMode
              ? "AUTHORIZED ADMINISTRATOR ACCESS ONLY."
              : "YOUR MARVEL JOURNEY. SAVED TO YOUR ACCOUNT."}
          </p>
        </div>
        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-kicker"
              >${adminMode
                ? "ADMIN PANEL ACCESS"
                : mode === "login"
                  ? "WELCOME BACK"
                  : "CREATE YOUR ARCHIVE"}</span
            >
            <h1>
              ${adminMode
                ? "Administrator Sign In"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </h1>
            <p>
              ${adminMode
                ? "Sign in with an authorized administrator account to access the MARVEL Timeline control panel."
                : mode === "login"
                  ? "Continue your personal Marvel timeline from any device."
                  : "Create your own account and keep your progress synced."}
            </p>
          </div>
          <form onSubmit=${submit}>
            ${!adminMode && mode === "signup"
              ? html`
                  <label className="auth-label">Name</label>
                  <input
                    className="auth-input"
                    type="text"
                    value=${displayName}
                    autocomplete="name"
                    placeholder="Your name"
                    onInput=${(e) => setDisplayName(e.target.value)}
                  />
                `
              : null}
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value=${email}
              autocomplete="email"
              placeholder="you@example.com"
              onInput=${(e) => setEmail(e.target.value)}
            />
            <div className="auth-password-row">
              <label className="auth-label">Password</label>
              ${mode === "login"
                ? html`<button
                    type="button"
                    className="auth-link auth-forgot"
                    onClick=${forgot}
                  >
                    Forgot password?
                  </button>`
                : null}
            </div>
            <div className="auth-input-wrap">
              <input
                className="auth-input auth-input-has-toggle"
                type=${showPassword ? "text" : "password"}
                value=${password}
                autocomplete=${mode === "login"
                  ? "current-password"
                  : "new-password"}
                placeholder="••••••••"
                onInput=${(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-eye"
                aria-label=${showPassword ? "Hide password" : "Show password"}
                aria-pressed=${showPassword}
                title=${showPassword ? "Hide password" : "Show password"}
                onClick=${() => setShowPassword((v) => !v)}
              >
                ${showPassword
                  ? html`<svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path
                        d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"
                      />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>`
                  : html`<svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>`}
              </button>
            </div>
            ${!adminMode && mode === "signup"
              ? html`
                  <label className="auth-label">Confirm password</label>
                  <div className="auth-input-wrap">
                    <input
                      className="auth-input auth-input-has-toggle"
                      type=${showPassword ? "text" : "password"}
                      value=${confirm}
                      autocomplete="new-password"
                      placeholder="••••••••"
                      onInput=${(e) => setConfirm(e.target.value)}
                    />
                  </div>
                `
              : null}
            ${error
              ? html`<div className="auth-message error">${error}</div>`
              : null}
            ${message
              ? html`<div className="auth-message success">${message}</div>`
              : null}
            <button className="auth-submit" type="submit" disabled=${busy}>
              ${busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
          ${adminMode
            ? html`<div className="auth-admin-note">
                <span>⌁</span>
                <p>
                  This area is restricted to authorized administrators.
                  Unauthorized accounts will not receive access to the admin
                  console.
                </p>
              </div>`
            : html`<div className="auth-switch">
                  <span
                    >${mode === "login"
                      ? "New to the archive?"
                      : "Already have an account?"}</span
                  >
                  <button
                    type="button"
                    className="auth-link"
                    onClick=${() =>
                      switchMode(mode === "login" ? "signup" : "login")}
                  >
                    ${mode === "login" ? "Create account" : "Sign in"}
                  </button>
                </div>
                <div className="auth-note">
                  <span>☁</span>
                  <p>
                    Your tracking data is tied to your Firebase account, so
                    different users get separate progress.
                  </p>
                </div>`}
        </div>
      </section>
    </main>
  `;
}
