import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  fetchRecentEmails,
  logout,
  fetchDigest,
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
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);

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
      setDigestLoading(true);
      setEmailsError(null);

      try {
        const [emailsData, digestData] = await Promise.all([
          fetchRecentEmails(),
          fetchDigest(),
        ]);
        setEmails(enrichEmails(emailsData.emails || []));
        setDigest(digestData);
      } catch (err) {
        setEmailsError(err.message || "Failed to load recent emails.");
      } finally {
        setEmailsLoading(false);
        setDigestLoading(false);
      }
    }

    loadEmails();
  }, [user, refreshTrigger]);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setEmails([]);
      setDigest(null);
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
      digest={digest}
      digestLoading={digestLoading}
    />
  );
}

export default App;
