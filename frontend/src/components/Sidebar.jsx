import "./Sidebar.css";

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: "📥" },
  { id: "important", label: "Important", icon: "⚡" },
  { id: "starred", label: "Starred", icon: "★" },
  { id: "promotions", label: "Promotions", icon: "🏷" },
  { id: "sent", label: "Sent", icon: "↗" },
  { id: "drafts", label: "Drafts", icon: "📝" },
];

export default function Sidebar({
  activeFolder,
  onFolderChange,
  userEmail,
  onLogout,
  isOpen,
  onClose,
}) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo">IQ</span>
          <div>
            <p className="sidebar__title">InboxIQ</p>
            <p className="sidebar__tagline">Smart email assistant</p>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Mail folders">
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={`sidebar__item ${
                activeFolder === folder.id ? "sidebar__item--active" : ""
              }`}
              onClick={() => onFolderChange(folder.id)}
            >
              <span className="sidebar__item-icon" aria-hidden="true">
                {folder.icon}
              </span>
              <span className="sidebar__item-label">{folder.label}</span>
              {folder.id === "inbox" && (
                <span className="sidebar__badge sidebar__badge--future">Live</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__user" title={userEmail}>
            {userEmail}
          </p>
          <button type="button" className="sidebar__logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
