import { useMemo, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import EmailList from "./EmailList";
import EmailPreview from "./EmailPreview";
import RulesModal from "./RulesModal";
import { fetchEmailDetail, toggleEmailStarred, toggleEmailRead, toggleEmailArchived } from "../api";
import "./EmailClient.css";

export default function EmailClient({
  emails,
  setEmails,
  loading,
  error,
  userEmail,
  onLogout,
  onRefreshEmails,
  digest,
  digestLoading,
}) {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const [cachedDetails, setCachedDetails] = useState({});
  const [toast, setToast] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (toast) {
      const timeout = toast.action ? 6000 : 4000;
      const timer = setTimeout(() => {
        setToast(null);
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const selectedEmail = useMemo(
    () => emails.find((email) => email.id === selectedEmailId) ?? null,
    [emails, selectedEmailId]
  );

  useEffect(() => {
    if (!selectedEmailId) {
      setPreviewError(null);
      return;
    }

    if (cachedDetails[selectedEmailId]) {
      return; // already cached
    }

    let isMounted = true;
    async function loadDetail() {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const detail = await fetchEmailDetail(selectedEmailId);
        if (isMounted) {
          setCachedDetails((prev) => ({
            ...prev,
            [selectedEmailId]: detail,
          }));
        }
      } catch (err) {
        if (isMounted) {
          setPreviewError(err.message || "Failed to load email body.");
        }
      } finally {
        if (isMounted) {
          setPreviewLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedEmailId, cachedDetails]);

  const handleSelectEmail = async (emailId) => {
    setSelectedEmailId(emailId);
    const email = emails.find((e) => e.id === emailId);
    if (email && email.isUnread) {
      // Optimistic update: mark as read
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isUnread: false } : e))
      );
      try {
        await toggleEmailRead(emailId, true);
      } catch (err) {
        // Rollback
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isUnread: true } : e))
        );
        setToast({
          message: "Couldn't update read status",
          type: "error",
          description: err.message,
        });
      }
    }
  };

  const handleToggleStar = async (emailId) => {
    const email = emails.find((e) => e.id === emailId);
    if (!email) return;
    const nextStarred = !email.isStarred;

    setActionPending(true);
    // Optimistic update
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isStarred: nextStarred } : e))
    );

    try {
      await toggleEmailStarred(emailId, nextStarred);
      setToast({
        message: nextStarred ? "★ Added to Starred" : "☆ Removed from Starred",
        type: "success",
      });
    } catch (err) {
      // Rollback
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isStarred: !nextStarred } : e))
      );
      setToast({
        message: "Couldn't update email",
        type: "error",
        description: err.message,
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleToggleRead = async (emailId) => {
    const email = emails.find((e) => e.id === emailId);
    if (!email) return;
    const nextUnread = !email.isUnread;

    setActionPending(true);
    // Optimistic update
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isUnread: nextUnread } : e))
    );

    try {
      await toggleEmailRead(emailId, !nextUnread);
      setToast({
        message: nextUnread ? "Marked as Unread" : "Marked as Read",
        type: "success",
      });
    } catch (err) {
      // Rollback
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isUnread: !nextUnread } : e))
      );
      setToast({
        message: "Couldn't update email",
        type: "error",
        description: err.message,
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleUndoArchive = async (email, originalIndex) => {
    setToast(null);
    setActionPending(true);
    // Optimistic restore
    setEmails((prev) => {
      const copy = [...prev];
      copy.splice(originalIndex, 0, email);
      return copy;
    });
    setSelectedEmailId(email.id);

    try {
      await toggleEmailArchived(email.id, false);
      setToast({
        message: "Action undone.",
        type: "success",
      });
    } catch (err) {
      // Rollback undo (remove it again)
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setSelectedEmailId(null);
      setToast({
        message: "Couldn't update email",
        type: "error",
        description: err.message,
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleArchive = async (emailId) => {
    const email = emails.find((e) => e.id === emailId);
    if (!email) return;
    const originalIndex = emails.findIndex((e) => e.id === emailId);

    setActionPending(true);
    // Optimistic remove
    setEmails((prev) => prev.filter((e) => e.id !== emailId));
    if (selectedEmailId === emailId) {
      setSelectedEmailId(null);
    }

    setToast({
      message: "Email archived",
      type: "success",
      action: {
        label: "Undo",
        onClick: () => handleUndoArchive(email, originalIndex),
      },
    });

    try {
      await toggleEmailArchived(emailId, true);
    } catch (err) {
      // Rollback archive (restore to list)
      setEmails((prev) => {
        const copy = [...prev];
        copy.splice(originalIndex, 0, email);
        return copy;
      });
      setSelectedEmailId(emailId);
      setToast({
        message: "Couldn't update email",
        type: "error",
        description: err.message,
      });
    } finally {
      setActionPending(false);
    }
  };

  function handleFolderChange(folderId) {
    setActiveFolder(folderId);
    setSelectedEmailId(null);
    setSidebarOpen(false);
  }

  function handleClosePreview() {
    setSelectedEmailId(null);
  }

  return (
    <div className="email-client">
      <Sidebar
        emails={emails}
        activeFolder={activeFolder}
        onFolderChange={handleFolderChange}
        userEmail={userEmail}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenRulesModal={() => setRulesModalOpen(true)}
      />

      <div
        className={`email-client__main ${
          selectedEmail ? "email-client__main--preview-open" : ""
        }`}
      >
        <EmailList
          emails={emails}
          activeFolder={activeFolder}
          selectedEmailId={selectedEmailId}
          loading={loading}
          error={error}
          onSelectEmail={handleSelectEmail}
          onToggleStar={handleToggleStar}
          onOpenSidebar={() => setSidebarOpen(true)}
          digest={digest}
          digestLoading={digestLoading}
        />

        <EmailPreview
          email={selectedEmail}
          cachedDetail={cachedDetails[selectedEmailId]}
          isLoading={previewLoading}
          error={previewError}
          actionPending={actionPending}
          onToggleStar={handleToggleStar}
          onToggleRead={handleToggleRead}
          onArchive={handleArchive}
          onClose={handleClosePreview}
        />
      </div>

      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        onRulesSaved={onRefreshEmails}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className={`email-preview__toast email-preview__toast--${toast.type}`}>
          <div className="email-preview__toast-content">
            <div className="email-preview__toast-header">
              <span className="email-preview__toast-icon">
                {toast.type === "success" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </span>
              <span className="email-preview__toast-message">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  className="email-client__toast-action-btn"
                  onClick={toast.action.onClick}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            {toast.description && (
              <p className="email-preview__toast-description">{toast.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
