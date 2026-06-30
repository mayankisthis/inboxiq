import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  fetchRecentEmails,
  logout,
} from "./api";
import EmailClient from "./components/EmailClient";
import LoginScreen from "./components/LoginScreen";
import { enrichEmails } from "./utils/enrichEmail";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        setEmails(enrichEmails(data.emails || []));
      } catch (err) {
        setEmailsError(err.message || "Failed to load recent emails.");
      } finally {
        setEmailsLoading(false);
      }
    }

    loadEmails();
  }, [user, refreshTrigger]);

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

  if (authLoading || !user?.authenticated) {
    return <LoginScreen loading={authLoading} error={authError} />;
  }

  return (
    <EmailClient
      emails={emails}
      loading={emailsLoading}
      error={emailsError}
      userEmail={user.email}
      onLogout={handleLogout}
      onRefreshEmails={() => setRefreshTrigger((prev) => prev + 1)}
    />
  );
}

export default App;
