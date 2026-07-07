import { formatEmailFullDate } from "../utils/formatDate";
import { getPriorityClass } from "../utils/priority";
import { getAvatarColor } from "../utils/avatar";
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

export default function EmailPreview({ email, cachedDetail, isLoading, error, onClose }) {
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
    <div className="email-preview__skeleton" aria-label="Loading email content">
      <div className="email-preview__skeleton-line" />
      <div className="email-preview__skeleton-line email-preview__skeleton-line--medium" />
      <div className="email-preview__skeleton-line" />
      <div className="email-preview__skeleton-line email-preview__skeleton-line--short" />
      <div className="email-preview__skeleton-line" />
      <div className="email-preview__skeleton-line email-preview__skeleton-line--medium" />
      <div className="email-preview__skeleton-line email-preview__skeleton-line--short" />
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
          <h2 className="email-preview__subject">{email.subject}</h2>
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
                onClick={() => alert(`Triggered action: "${action}"`)}
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
          renderBodyText(cachedDetail?.body || email.snippet)
        )}
      </article>
    </section>
  );
}

