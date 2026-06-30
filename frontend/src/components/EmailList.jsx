import EmailCard from "./EmailCard";
import "./EmailList.css";

const FOLDER_LABELS = {
  inbox: "Inbox",
  important: "Important",
  starred: "Starred",
  promotions: "Promotions",
  sent: "Sent",
  drafts: "Drafts",
};

export default function EmailList({
  emails,
  activeFolder,
  selectedEmailId,
  readEmailIds,
  loading,
  error,
  onSelectEmail,
  onOpenSidebar,
}) {
  const folderLabel = FOLDER_LABELS[activeFolder] || "Inbox";
  const isInbox = activeFolder === "inbox";

  return (
    <section className="email-list-panel">
      <header className="email-list-panel__header">
        <button
          type="button"
          className="email-list-panel__menu"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          ☰
        </button>
        <div>
          <h2 className="email-list-panel__title">{folderLabel}</h2>
          <p className="email-list-panel__subtitle">
            {isInbox ? "Latest messages from Gmail" : "Coming soon"}
          </p>
        </div>
      </header>

      {loading && (
        <div className="email-list-panel__state">
          <p>Loading emails…</p>
        </div>
      )}

      {error && (
        <div className="email-list-panel__state email-list-panel__state--error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !isInbox && (
        <div className="email-list-panel__state">
          <p>This folder will be available in a future update.</p>
        </div>
      )}

      {!loading && !error && isInbox && emails.length === 0 && (
        <div className="email-list-panel__state">
          <p>No emails found.</p>
        </div>
      )}

      {!loading && !error && isInbox && emails.length > 0 && (
        <div className="email-list-panel__scroll">
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              isSelected={selectedEmailId === email.id}
              isUnread={!readEmailIds.has(email.id)}
              onSelect={onSelectEmail}
            />
          ))}
        </div>
      )}
    </section>
  );
}
