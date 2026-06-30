import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import EmailList from "./EmailList";
import EmailPreview from "./EmailPreview";
import RulesModal from "./RulesModal";
import "./EmailClient.css";

export default function EmailClient({ emails, loading, error, userEmail, onLogout, onRefreshEmails }) {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [readEmailIds, setReadEmailIds] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const selectedEmail = useMemo(
    () => emails.find((email) => email.id === selectedEmailId) ?? null,
    [emails, selectedEmailId]
  );

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
        />

        <EmailPreview email={selectedEmail} onClose={handleClosePreview} />
      </div>

      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        onRulesSaved={onRefreshEmails}
      />
    </div>
  );
}
