import { useState, useEffect, useRef } from "react";
import { formatEmailFullDate } from "../utils/formatDate";
import { getPriorityClass } from "../utils/priority";
import { getAvatarColor } from "../utils/avatar";
import { generateEmailReply, sendEmailReply } from "../api";
import "./EmailPreview.css";

function getActionIcon(action = "") {
  const act = action.toLowerCase();
  if (act.includes("security") || act.includes("permission") || act.includes("revoke")) return "🛡️";
  if (act.includes("assessment") || act.includes("test") || act.includes("complete")) return "📝";
  if (act.includes("calendar") || act.includes("deadline")) return "📅";
  if (act.includes("urgent")) return "⚡";
  if (act.includes("reply") || act.includes("follow-up")) return "✉️";
  if (act.includes("profile")) return "👤";
  if (act.includes("ignore") || act.includes("archive")) return "📥";
  if (act.includes("unsubscribe")) return "🔕";
  return "➡️";
}

export default function EmailPreview({
  email,
  cachedDetail,
  isLoading,
  error,
  actionPending,
  onToggleStar,
  onToggleRead,
  onArchive,
  onClose,
  setToast,
}) {
  const [replyStyle, setReplyStyle] = useState("Professional");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  
  const textareaRef = useRef(null);

  useEffect(() => {
    setReplyDraft("");
    setReplyLoading(false);
    setCopySuccess(false);
    setSendingReply(false);
  }, [email?.id]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [replyDraft]);

  const handleGenerateReply = async () => {
    setReplyLoading(true);
    setToast(null);
    try {
      const data = await generateEmailReply(email.id, replyStyle);
      setReplyDraft(data.reply || "");
    } catch (err) {
      setToast({
        message: "Unable to generate reply",
        type: "error",
        description: err.message || ""
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(replyDraft);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSendReply = async () => {
    setSendingReply(true);
    setToast(null);
    try {
      await sendEmailReply(email.id, replyDraft);
      setToast({
        message: "Reply sent successfully.",
        type: "success"
      });
      setReplyDraft("");
    } catch (err) {
      setToast({
        message: "Unable to send reply",
        type: "error",
        description: err.message || ""
      });
    } finally {
      setSendingReply(false);
    }
  };

  const renderBodyText = (text) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    
    return lines.map((line, lineIdx) => {
      if (line.trim() === "") {
        return <div key={lineIdx} className="email-body-line email-body-line--empty">&nbsp;</div>;
      }
      
      const parts = line.split(urlRegex);
      return (
        <div key={lineIdx} className="email-body-line">
          {parts.map((part, partIdx) => {
            if (part.match(urlRegex)) {
              let url = part;
              let trailing = "";
              const trailingMatch = url.match(/[.,;:?!)'"]+$/);
              if (trailingMatch) {
                const len = trailingMatch[0].length;
                url = url.substring(0, url.length - len);
                trailing = trailingMatch[0];
              }
              return (
                <span key={partIdx}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="email-body-link">
                    {url}
                  </a>
                  {trailing}
                </span>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  const renderSkeleton = () => (
    <div className="email-preview__skeleton" aria-label="Loading email content" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
      {/* Subject line shimmer */}
      <div className="shimmer" style={{ height: "2rem", width: "70%", borderRadius: "6px" }} />
      {/* Sender profile meta shimmer */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", margin: "0.5rem 0 1rem" }}>
        <div className="shimmer" style={{ height: "2.5rem", width: "2.5rem", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1 }}>
          <div className="shimmer" style={{ height: "0.875rem", width: "140px", borderRadius: "4px" }} />
          <div className="shimmer" style={{ height: "0.75rem", width: "80px", borderRadius: "4px" }} />
        </div>
      </div>
      {/* AI Summary Card shimmer */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <div className="shimmer" style={{ height: "1.25rem", width: "120px", borderRadius: "4px", marginBottom: "0.25rem" }} />
        <div className="shimmer" style={{ height: "0.875rem", width: "90%", borderRadius: "4px" }} />
        <div className="shimmer" style={{ height: "0.875rem", width: "95%", borderRadius: "4px" }} />
        <div className="shimmer" style={{ height: "0.875rem", width: "60%", borderRadius: "4px" }} />
      </div>
      {/* Body text shimmers */}
      <div className="shimmer" style={{ height: "1rem", width: "100%", borderRadius: "4px", marginTop: "1rem" }} />
      <div className="shimmer" style={{ height: "1rem", width: "95%", borderRadius: "4px" }} />
      <div className="shimmer" style={{ height: "1rem", width: "80%", borderRadius: "4px" }} />
      <div className="shimmer" style={{ height: "1rem", width: "90%", borderRadius: "4px" }} />
      <div className="shimmer" style={{ height: "1rem", width: "40%", borderRadius: "4px" }} />
    </div>
  );

  const renderError = (errMsg) => (
    <div className="email-preview__error">
      <div className="email-preview__error-header">
        <span className="email-preview__error-icon">⚠️</span>
        <span className="email-preview__error-text">{errMsg}</span>
      </div>
      <div className="email-preview__error-fallback-header">Showing preview snippet:</div>
      <div className="email-preview__error-snippet-box">
        {renderBodyText(email.snippet)}
      </div>
    </div>
  );

  if (!email) {
    return (
      <section className="email-preview email-preview--empty">
        <div className="email-preview__placeholder">
          <div className="email-preview__placeholder-icon-container" aria-hidden="true">
            <svg
              className="email-preview__placeholder-svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Main Tray Box Outline */}
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              {/* Sparkle representing AI intelligence */}
              <path d="M12 2v2M12 20v2M4 12H2M22 12h-2" opacity="0.4" />
              <path d="M17 6.5l-1 1M18 17.5l-1-1M7 6.5l1 1" opacity="0.6" />
            </svg>
          </div>
          <h2 className="email-preview__placeholder-title">Select an email to view its contents.</h2>
          <p className="email-preview__placeholder-subtitle">AI summaries and actions will appear here.</p>
        </div>
      </section>
    );
  }

  const summaryToDisplay = cachedDetail?.summary || email.aiSummary;
  const actionsToDisplay = cachedDetail?.suggestedActions || email.suggestedActions;

  return (
    <section className="email-preview">
      <header className="email-preview__header">
        <div className="email-preview__header-top">
          <div className="email-preview__subject-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
            <h2 className="email-preview__subject" style={{ margin: 0 }}>{email.subject}</h2>
            <button
              type="button"
              className={`email-preview__star-icon-btn ${email.isStarred ? "email-preview__star-icon-btn--active" : ""}`}
              onClick={() => onToggleStar(email.id)}
              disabled={actionPending}
              aria-label={email.isStarred ? "Unstar email" : "Star email"}
            >
              {email.isStarred ? "★" : "☆"}
            </button>
          </div>
          <button
            type="button"
            className="email-preview__close"
            aria-label="Close preview"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="email-preview__meta">
          <div
            className="email-preview__avatar"
            style={{ backgroundColor: getAvatarColor(email.sender), background: getAvatarColor(email.sender) }}
            aria-hidden="true"
          >
            {email.sender.charAt(0).toUpperCase()}
          </div>
          <div className="email-preview__sender-block">
            <p className="email-preview__sender">{email.sender}</p>
            <time className="email-preview__date" dateTime={email.receivedAt}>
              {formatEmailFullDate(email.receivedAt)}
            </time>
          </div>
        </div>

        <div className="email-preview__future">
          <span
            className={`email-preview__badge email-preview__badge--${getPriorityClass(email.priority)}`}
          >
            {email.priority}
          </span>

          {email.category ? (
            <span className="email-preview__badge email-preview__badge--category">
              {email.category}
            </span>
          ) : (
            <span className="email-preview__badge email-preview__badge--placeholder">
              Category
            </span>
          )}
        </div>

        {/* Toolbar layout */}
        <div className="email-preview__toolbar">
          <button
            type="button"
            className={`email-preview__toolbar-btn ${email.isStarred ? "email-preview__toolbar-btn--starred" : ""}`}
            onClick={() => onToggleStar(email.id)}
            disabled={actionPending}
          >
            {email.isStarred ? "★ Starred" : "☆ Star"}
          </button>
          <button
            type="button"
            className="email-preview__toolbar-btn"
            onClick={() => onToggleRead(email.id)}
            disabled={actionPending}
          >
            ✓ {email.isUnread ? "Mark as Read" : "Mark as Unread"}
          </button>
          <button
            type="button"
            className="email-preview__toolbar-btn email-preview__toolbar-btn--archive"
            onClick={() => onArchive(email.id)}
            disabled={actionPending}
          >
            📦 Archive
          </button>
        </div>
      </header>

      <div className="email-preview__ai-summary-card">
        <div className="email-preview__ai-summary-header">
          <svg
            className="email-preview__ai-icon"
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
          <span className="email-preview__ai-label">AI Summary</span>
        </div>
        {summaryToDisplay ? (
          Array.isArray(summaryToDisplay) ? (
            <ul className="email-preview__ai-bullets">
              {summaryToDisplay.map((bullet, idx) => (
                <li key={idx} className="email-preview__ai-bullet-item">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : (
            <p className="email-preview__ai-text">{summaryToDisplay}</p>
          )
        ) : (
          <p className="email-preview__ai-text email-preview__ai-text--placeholder">
            AI-generated summaries will appear here once classification is enabled.
          </p>
        )}
      </div>

      {actionsToDisplay && actionsToDisplay.length > 0 && (
        <div className="email-preview__actions-card">
          <div className="email-preview__actions-header">
            <svg
              className="email-preview__actions-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="email-preview__actions-label">Suggested Actions</span>
          </div>
          <div className="email-preview__actions-chips">
            {actionsToDisplay.map((action, idx) => (
              <button
                key={idx}
                type="button"
                className="email-preview__action-chip"
                onClick={() => {
                  if (setToast) {
                    setToast({ message: `Action triggered: "${action}"`, type: "success" });
                  }
                }}
              >
                <span className="email-preview__action-chip-icon" aria-hidden="true">
                  {getActionIcon(action)}
                </span>
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      <article className="email-preview__body">
        {isLoading && !cachedDetail ? (
          renderSkeleton()
        ) : error && !cachedDetail ? (
          renderError(error)
        ) : (
          <>
            {renderBodyText(cachedDetail?.body || email.snippet)}

            {/* AI Reply Generator Section */}
            <div className="email-preview__reply-section">
              <div className="email-preview__reply-header">
                <h3 className="email-preview__reply-title">AI Reply Draft</h3>
                <div className="email-preview__reply-styles">
                  {["Professional", "Friendly", "Formal", "Short"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`email-preview__reply-style-btn ${
                        replyStyle === style ? "email-preview__reply-style-btn--active" : ""
                      }`}
                      onClick={() => setReplyStyle(style)}
                      disabled={replyLoading || sendingReply}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {replyLoading ? (
                <div className="email-preview__reply-skeleton-container" aria-label="Generating AI reply" style={{ marginTop: "1rem" }}>
                  <div className="shimmer" style={{ height: "100px", borderRadius: "8px", width: "100%", marginBottom: "1rem" }} />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div className="shimmer" style={{ height: "36px", width: "80px", borderRadius: "6px" }} />
                    <div className="shimmer" style={{ height: "36px", width: "100px", borderRadius: "6px", marginLeft: "auto" }} />
                  </div>
                </div>
              ) : (
                <>
                  {replyDraft && (
                    <div className="email-preview__reply-draft-box">
                      <textarea
                        ref={textareaRef}
                        className="email-preview__reply-textarea"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Edit your reply here..."
                        disabled={sendingReply}
                        maxLength={2000}
                      />
                      <div className={`email-preview__char-count ${
                        replyDraft.length > 1950
                          ? "email-preview__char-count--red"
                          : replyDraft.length > 1800
                          ? "email-preview__char-count--orange"
                          : ""
                      }`}>
                        {replyDraft.length} / 2000
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Sticky Action Bar */}
              <div className="email-preview__reply-sticky-actions">
                <div className="email-preview__reply-sticky-actions-left">
                  <button
                    type="button"
                    className="email-preview__reply-action-btn email-preview__reply-action-btn--generate"
                    disabled={replyLoading || sendingReply}
                    onClick={handleGenerateReply}
                  >
                    {replyLoading ? (
                      <>
                        <div className="email-preview__reply-spinner" style={{ width: "0.875rem", height: "0.875rem", display: "inline-block", marginRight: "0.375rem" }}></div>
                        Generating...
                      </>
                    ) : "Generate Reply"}
                  </button>

                  {replyDraft && !replyLoading && (
                    <button
                      type="button"
                      className="email-preview__reply-action-btn email-preview__reply-action-btn--regenerate"
                      disabled={sendingReply}
                      onClick={handleGenerateReply}
                    >
                      ↻ Regenerate
                    </button>
                  )}
                </div>

                <div className="email-preview__reply-sticky-actions-right">
                  {replyDraft && !replyLoading && (
                    <>
                      <button
                        type="button"
                        className="email-preview__reply-action-btn email-preview__reply-action-btn--copy"
                        disabled={sendingReply}
                        onClick={handleCopyReply}
                      >
                        {copySuccess ? "✓ Copied" : "📋 Copy"}
                      </button>
                      <button
                        type="button"
                        className="email-preview__reply-action-btn email-preview__reply-action-btn--send"
                        disabled={sendingReply}
                        onClick={handleSendReply}
                      >
                        {sendingReply ? (
                          <>
                            <div className="email-preview__reply-spinner" style={{ width: "0.875rem", height: "0.875rem", display: "inline-block", marginRight: "0.375rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}></div>
                            Sending...
                          </>
                        ) : "Send Reply"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </article>

    </section>
  );
}

