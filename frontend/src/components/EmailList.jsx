import { useState, useEffect, useMemo } from "react";
import { parseSearchQuery, searchEmails } from "../api";
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
  digest,
  digestLoading,
  onToggleStar,
}) {
  const folderLabel = FOLDER_LABELS[activeFolder] || "Inbox";
  const isInbox = activeFolder === "inbox";
  const [digestCollapsed, setDigestCollapsed] = useState(false);
  const [checkedActions, setCheckedActions] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResultEmails, setSearchResultEmails] = useState(null);
  const [searchCache, setSearchCache] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    sender: null,
    priority: null,
    category: null,
    keywords: [],
    requires_action: false,
    unread: false,
    today: false,
  });

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResultEmails(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q === "") {
      setSearchResultEmails(null);
      return;
    }

    if (searchCache[q]) {
      setSearchResultEmails(searchCache[q]);
      return;
    }

    let isMounted = true;
    async function executeSearch() {
      setSearchLoading(true);
      try {
        const data = await searchEmails(q);
        const fetched = data.emails || [];
        if (isMounted) {
          const mapped = fetched.map((email) => ({
            id: email.id,
            sender: email.sender,
            subject: email.subject,
            snippet: email.snippet,
            receivedAt: email.date || email.received_at,
            priority: email.priority || "Normal",
            category: email.category || null,
            aiSummary: email.summary || email.aiSummary || null,
            suggestedActions: email.suggestedActions || [],
          }));
          setSearchCache((prev) => ({ ...prev, [q]: mapped }));
          setSearchResultEmails(mapped);
        }
      } catch (err) {
        console.error("Failed to execute semantic search:", err);
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    }

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const handleToggleAction = (action) => {
    setCheckedActions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const parsed = await parseSearchQuery(searchQuery);
      setActiveFilters((prev) => ({
        sender: parsed.sender || prev.sender,
        priority: parsed.priority || prev.priority,
        category: parsed.category || prev.category,
        keywords: Array.from(new Set([...prev.keywords, ...(parsed.keywords || [])])),
        requires_action: parsed.requires_action || prev.requires_action,
        unread: parsed.unread || prev.unread,
        today: parsed.today || prev.today,
      }));
      setSearchQuery("");
    } catch (err) {
      console.error("Failed to parse search query", err);
    }
  };

  const hasAnyFilter = (filters) => {
    return (
      filters.sender ||
      filters.priority ||
      filters.category ||
      filters.requires_action ||
      filters.unread ||
      filters.today ||
      (filters.keywords && filters.keywords.length > 0)
    );
  };

  const removeFilter = (key) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: key === "requires_action" || key === "unread" || key === "today" ? false : null,
    }));
  };

  const removeKeyword = (kw) => {
    setActiveFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kw),
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      sender: null,
      priority: null,
      category: null,
      keywords: [],
      requires_action: false,
      unread: false,
      today: false,
    });
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResultEmails(null);
  };

  const filteredEmails = useMemo(() => {
    let sourceEmails = (searchResultEmails !== null) ? searchResultEmails : emails;

    // Filter by Folder first
    if (activeFolder === "starred") {
      sourceEmails = sourceEmails.filter((email) => email.isStarred);
    } else if (activeFolder === "important") {
      sourceEmails = sourceEmails.filter((email) => email.priority === "Urgent" || email.priority === "Important" || email.labels?.includes("IMPORTANT"));
    } else if (activeFolder === "promotions") {
      sourceEmails = sourceEmails.filter((email) => email.category === "Promotions" || email.labels?.includes("CATEGORY_PROMOTIONS"));
    } else if (activeFolder === "sent") {
      sourceEmails = sourceEmails.filter((email) => email.labels?.includes("SENT"));
    } else if (activeFolder === "drafts") {
      sourceEmails = sourceEmails.filter((email) => email.labels?.includes("DRAFT"));
    } else if (activeFolder === "inbox") {
      // Default to inbox: only show emails that have INBOX label (if labels exist)
      sourceEmails = sourceEmails.filter((email) => !email.labels || email.labels.includes("INBOX"));
    }

    return sourceEmails.filter((email) => {
      // 1. Live text search / local filtering while typing
      if (searchQuery.trim() !== "" && searchResultEmails === null) {
        const q = searchQuery.toLowerCase();
        
        if (q.includes("github") && !email.sender.toLowerCase().includes("github")) return false;
        if (q.includes("linkedin") && !email.sender.toLowerCase().includes("linkedin")) return false;
        if (q.includes("urgent") && email.priority.toLowerCase() !== "urgent") return false;
        if (q.includes("important") && email.priority.toLowerCase() !== "important") return false;
        if (q.includes("promotion") && email.priority.toLowerCase() !== "low priority" && email.category !== "Promotions") return false;
        if (q.includes("today")) {
          const date = new Date(email.receivedAt);
          const now = new Date();
          const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        }
        if (q.includes("yesterday")) {
          const date = new Date(email.receivedAt);
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday =
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
          if (!isYesterday) return false;
        }

        if (!q.includes("github") && !q.includes("linkedin") && !q.includes("urgent") && !q.includes("important") && !q.includes("promotion") && !q.includes("today") && !q.includes("yesterday")) {
          const summaryText = Array.isArray(email.aiSummary) ? email.aiSummary.join(" ") : (email.aiSummary || "");
          const matchText = `${email.sender} ${email.subject} ${email.snippet} ${email.priority} ${summaryText}`.toLowerCase();
          const queryWords = q.split(/\s+/);
          const matchesAll = queryWords.every((word) => matchText.includes(word));
          if (!matchesAll) return false;
        }
      }

      // 2. Active filters
      if (activeFilters.sender && !email.sender.toLowerCase().includes(activeFilters.sender.toLowerCase())) {
        return false;
      }
      if (activeFilters.priority && email.priority !== activeFilters.priority) {
        return false;
      }
      if (activeFilters.category && email.category !== activeFilters.category) {
        return false;
      }
      if (activeFilters.requires_action) {
        const hasActions = email.suggestedActions && email.suggestedActions.length > 0;
        if (!hasActions) return false;
      }
      if (activeFilters.unread && !email.isUnread) {
        return false;
      }
      if (activeFilters.today) {
        const date = new Date(email.receivedAt);
        const now = new Date();
        const isToday =
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      }
      if (activeFilters.keywords && activeFilters.keywords.length > 0) {
        const summaryText = Array.isArray(email.aiSummary) ? email.aiSummary.join(" ") : (email.aiSummary || "");
        const matchText = `${email.sender} ${email.subject} ${email.snippet} ${summaryText}`.toLowerCase();
        const hasAllKeywords = activeFilters.keywords.every((kw) => matchText.includes(kw.toLowerCase()));
        if (!hasAllKeywords) return false;
      }

      return true;
    });
  }, [emails, searchResultEmails, searchQuery, activeFilters, activeFolder]);

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
            {activeFolder === "inbox" ? "Latest messages from Gmail" : `Messages in ${folderLabel}`}
          </p>
        </div>
      </header>

      {true && (
        <div className="email-list-panel__search-wrapper">
          <form className="email-list-panel__search-form" onSubmit={handleSearchSubmit}>
            <div className="email-list-panel__search-container">
              <svg
                className="email-list-panel__search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="email-list-panel__search-input"
                placeholder="Search mail or ask AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="email-list-panel__search-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear query text"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {hasAnyFilter(activeFilters) && (
            <div className="email-list-panel__filter-chips">
              {activeFilters.sender && (
                <span className="email-list-panel__chip">
                  From: {activeFilters.sender}
                  <button type="button" onClick={() => removeFilter("sender")}>✕</button>
                </span>
              )}
              {activeFilters.priority && (
                <span className="email-list-panel__chip">
                  Priority: {activeFilters.priority}
                  <button type="button" onClick={() => removeFilter("priority")}>✕</button>
                </span>
              )}
              {activeFilters.category && (
                <span className="email-list-panel__chip">
                  Category: {activeFilters.category}
                  <button type="button" onClick={() => removeFilter("category")}>✕</button>
                </span>
              )}
              {activeFilters.requires_action && (
                <span className="email-list-panel__chip">
                  Requires Action
                  <button type="button" onClick={() => removeFilter("requires_action")}>✕</button>
                </span>
              )}
              {activeFilters.unread && (
                <span className="email-list-panel__chip">
                  Unread
                  <button type="button" onClick={() => removeFilter("unread")}>✕</button>
                </span>
              )}
              {activeFilters.today && (
                <span className="email-list-panel__chip">
                  Today
                  <button type="button" onClick={() => removeFilter("today")}>✕</button>
                </span>
              )}
              {activeFilters.keywords.map((kw) => (
                <span key={kw} className="email-list-panel__chip">
                  Keyword: {kw}
                  <button type="button" onClick={() => removeKeyword(kw)}>✕</button>
                </span>
              ))}
              <button
                type="button"
                className="email-list-panel__clear-filters"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="email-list-skeleton" aria-label="Loading emails">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="email-list-skeleton__item" style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid var(--color-border)" }}>
              <div className="email-list-skeleton__avatar shimmer" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", flexShrink: 0 }} />
              <div className="email-list-skeleton__content" style={{ flex: 1, minWidth: 0 }}>
                <div className="email-list-skeleton__row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div className="email-list-skeleton__sender shimmer" style={{ height: "1rem", width: "100px", borderRadius: "4px" }} />
                  <div className="email-list-skeleton__date shimmer" style={{ height: "0.75rem", width: "50px", borderRadius: "4px" }} />
                </div>
                <div className="email-list-skeleton__subject shimmer" style={{ height: "1rem", width: "180px", borderRadius: "4px", marginBottom: "0.5rem" }} />
                <div className="email-list-skeleton__snippet shimmer" style={{ height: "0.75rem", width: "100%", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="email-list-panel__state email-list-panel__state--error" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ fontWeight: 600, fontSize: "1rem", margin: "0 0 0.25rem", color: "#ef4444" }}>Failed to load emails</p>
          <p className="email-list-panel__empty-subtitle" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && !isInbox && filteredEmails.length === 0 && (
        <div className="email-list-panel__state" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.6 }}>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <p className="email-list-panel__empty-title" style={{ fontWeight: 600, fontSize: "1.0625rem", margin: "0 0 0.25rem" }}>Empty Folder</p>
          <p className="email-list-panel__empty-subtitle" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>There are no messages in this folder.</p>
        </div>
      )}

      {!loading && !error && isInbox && emails.length === 0 && (
        <div className="email-list-panel__state" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.6 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="email-list-panel__empty-title" style={{ fontWeight: 600, fontSize: "1.0625rem", margin: "0 0 0.25rem" }}>Inbox is empty</p>
          <p className="email-list-panel__empty-subtitle" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>You're all caught up! Enjoy your clean inbox.</p>
        </div>
      )}

      {!loading && !error && isInbox && emails.length > 0 && filteredEmails.length === 0 && (
        <div className="email-list-panel__state" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.7 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="email-list-panel__empty-title" style={{ fontWeight: 600, fontSize: "1rem", margin: "0 0 0.25rem" }}>No search results</p>
          <p className="email-list-panel__empty-subtitle" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>We couldn't find any emails matching that search query.</p>
        </div>
      )}

      {!loading && !error && isInbox && filteredEmails.length > 0 && (
        <div className="email-list-panel__scroll">
          {digestLoading && (
            <div className="daily-digest-skeleton" aria-label="Loading daily digest" style={{ padding: "1.25rem", borderBottom: "1px solid var(--color-border)" }}>
              <div className="daily-digest-skeleton__header shimmer" style={{ height: "1.25rem", width: "120px", borderRadius: "4px", marginBottom: "0.875rem" }} />
              <div className="daily-digest-skeleton__grid" style={{ display: "flex", gap: "0.75rem" }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="daily-digest-skeleton__card shimmer" style={{ flex: 1, height: "60px", borderRadius: "8px" }} />
                ))}
              </div>
            </div>
          )}

          {digest && !digestLoading && (
            <div className="daily-digest">
              <header
                className="daily-digest__header"
                onClick={() => setDigestCollapsed(!digestCollapsed)}
              >
                <div className="daily-digest__title-row">
                  <svg
                    className="daily-digest__icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2" />
                    <path d="M17 6.5l-1.5 1.5M18.5 18.5l-1.5-1.5M5.5 5.5l1.5 1.5M5.5 18.5l1.5-1.5" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
                  </svg>
                  <div className="daily-digest__titles">
                    <h3>Daily Digest</h3>
                    <p className="daily-digest__subtitle">{digest.subtitle}</p>
                  </div>
                  <span className="daily-digest__meta">
                    {digest.reading_time} read • {digest.total} emails
                  </span>
                </div>
                <button
                  type="button"
                  className={`daily-digest__toggle-btn ${
                    digestCollapsed ? "daily-digest__toggle-btn--collapsed" : ""
                  }`}
                  aria-label="Toggle digest details"
                >
                  ▼
                </button>
              </header>

              {!digestCollapsed && (
                <div className="daily-digest__body">
                  {digest.total === 0 ? (
                    <p className="daily-digest__empty-today">No new emails today.</p>
                  ) : (
                    <>
                      <div className="daily-digest__grid">
                        <div className="daily-digest__metric-card daily-digest__metric-card--urgent">
                          <span className="daily-digest__metric-indicator" />
                          <div className="daily-digest__metric-val">{digest.urgent}</div>
                          <div className="daily-digest__metric-label">Urgent</div>
                        </div>
                        <div className="daily-digest__metric-card daily-digest__metric-card--important">
                          <span className="daily-digest__metric-indicator" />
                          <div className="daily-digest__metric-val">{digest.important}</div>
                          <div className="daily-digest__metric-label">Important</div>
                        </div>
                        <div className="daily-digest__metric-card daily-digest__metric-card--normal">
                          <span className="daily-digest__metric-indicator" />
                          <div className="daily-digest__metric-val">{digest.normal}</div>
                          <div className="daily-digest__metric-label">Normal</div>
                        </div>
                        <div className="daily-digest__metric-card daily-digest__metric-card--low">
                          <span className="daily-digest__metric-indicator" />
                          <div className="daily-digest__metric-val">{digest.low_priority}</div>
                          <div className="daily-digest__metric-label">Low</div>
                        </div>
                        <div className="daily-digest__metric-card daily-digest__metric-card--promotions">
                          <div className="daily-digest__metric-val">{digest.promotions_filtered}</div>
                          <div className="daily-digest__metric-label">Promos</div>
                        </div>
                      </div>

                      {digest.actions && digest.actions.length > 0 && (
                        <div className="daily-digest__actions">
                          <h4>Action Items Checklist</h4>
                          <ul className="daily-digest__actions-list">
                            {digest.actions.map((action, idx) => {
                              const isChecked = checkedActions.has(action);
                              return (
                                <li key={idx} className="daily-digest__action-item">
                                  <label
                                    className={`daily-digest__action-label ${
                                      isChecked ? "daily-digest__action-label--checked" : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="daily-digest__checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleAction(action)}
                                    />
                                    <span className="daily-digest__action-text">{action}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="email-list-panel__emails-container">
            {filteredEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                isUnread={email.isUnread}
                onSelect={onSelectEmail}
                onToggleStar={onToggleStar}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
