import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  fetchHealth,
  fetchRecentEmails,
  getGoogleLoginUrl,
  logout,
} from "./api";
import "./App.css";

function formatReceivedDate(isoDate) {
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await fetchHealth();
        setHealthStatus(data.status);
      } catch (err) {
        setHealthError(err.message || "Failed to reach the backend.");
      } finally {
        setHealthLoading(false);
      }
    }

    loadHealth();
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const params = new URLSearchParams(window.location.search);
        const authResult = params.get("auth");

        if (authResult === "error") {
          setAuthError(params.get("message") || "Google sign-in failed.");
        }

        if (authResult) {
          window.history.replaceState({}, "", window.location.pathname);
        }

        const data = await fetchCurrentUser();
        setUser(data.authenticated ? data : null);
      } catch (err) {
        setAuthError(err.message || "Failed to verify authentication.");
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!user?.authenticated) {
      setEmails([]);
      setEmailsError(null);
      return;
    }

    async function loadEmails() {
      setEmailsLoading(true);
      setEmailsError(null);

      try {
        const data = await fetchRecentEmails();
        setEmails(data.emails || []);
      } catch (err) {
        setEmailsError(err.message || "Failed to load recent emails.");
      } finally {
        setEmailsLoading(false);
      }
    }

    loadEmails();
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setEmails([]);
      setAuthError(null);
      setEmailsError(null);
    } catch (err) {
      setAuthError(err.message || "Failed to log out.");
    }
  }

  return (
    <main className="app">
      <h1>Welcome to InboxIQ - AI Powered Smart Email Assistant</h1>

      <div className="health-status" aria-live="polite">
        {healthLoading && (
          <p className="health-status__loading">Checking backend connection…</p>
        )}
        {healthError && <p className="health-status__error">Error: {healthError}</p>}
        {!healthLoading && !healthError && healthStatus && (
          <p className="health-status__ok">Backend status: {healthStatus}</p>
        )}
      </div>

      <section className="auth-panel" aria-live="polite">
        {authLoading && <p className="auth-panel__loading">Checking sign-in status…</p>}

        {!authLoading && authError && (
          <p className="auth-panel__error">Error: {authError}</p>
        )}

        {!authLoading && !user?.authenticated && (
          <a href={getGoogleLoginUrl()} className="btn-google">
            <svg className="btn-google__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </a>
        )}
      </section>

      {!authLoading && user?.authenticated && (
        <section className="inbox">
          <header className="inbox__header">
            <div>
              <h2 className="inbox__title">Recent emails</h2>
              <p className="inbox__subtitle">Signed in as {user.email}</p>
            </div>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Sign out
            </button>
          </header>

          {emailsLoading && <p className="inbox__loading">Loading recent emails…</p>}
          {emailsError && <p className="inbox__error">Error: {emailsError}</p>}

          {!emailsLoading && !emailsError && emails.length === 0 && (
            <p className="inbox__empty">No recent emails found.</p>
          )}

          {!emailsLoading && !emailsError && emails.length > 0 && (
            <ul className="email-list">
              {emails.map((email, index) => (
                <li key={`${email.received_at}-${index}`} className="email-card">
                  <div className="email-card__header">
                    <span className="email-card__sender">{email.sender}</span>
                    <time className="email-card__date" dateTime={email.received_at}>
                      {formatReceivedDate(email.received_at)}
                    </time>
                  </div>
                  <h3 className="email-card__subject">{email.subject}</h3>
                  <p className="email-card__snippet">{email.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
