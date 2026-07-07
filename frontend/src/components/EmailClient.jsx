import { useMemo, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import EmailList from "./EmailList";
import EmailPreview from "./EmailPreview";
import RulesModal from "./RulesModal";
import { fetchEmailDetail } from "../api";
import "./EmailClient.css";

export default function EmailClient({
  emails,
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
  const [readEmailIds, setReadEmailIds] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const [cachedDetails, setCachedDetails] = useState({});
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

  function handleSelectEmail(emailId) {
    setSelectedEmailId(emailId);
    setReadEmailIds((prev) => new Set(prev).add(emailId));
  }

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
          readEmailIds={readEmailIds}
          loading={loading}
          error={error}
          onSelectEmail={handleSelectEmail}
          onOpenSidebar={() => setSidebarOpen(true)}
          digest={digest}
          digestLoading={digestLoading}
        />

        <EmailPreview
          email={selectedEmail}
          cachedDetail={cachedDetails[selectedEmailId]}
          isLoading={previewLoading}
          error={previewError}
          onClose={handleClosePreview}
        />
      </div>

      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        onRulesSaved={onRefreshEmails}
      />
    </div>
  );
}
