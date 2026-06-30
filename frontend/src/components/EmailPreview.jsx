import { formatEmailFullDate } from "../utils/formatDate";
import { getPriorityClass } from "../utils/priority";
import { getAvatarColor } from "../utils/avatar";
import "./EmailPreview.css";

export default function EmailPreview({ email, onClose }) {
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
        {email.aiSummary ? (
          Array.isArray(email.aiSummary) ? (
            <ul className="email-preview__ai-bullets">
              {email.aiSummary.map((bullet, idx) => (
                <li key={idx} className="email-preview__ai-bullet-item">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : (
            <p className="email-preview__ai-text">{email.aiSummary}</p>
          )
        ) : (
          <p className="email-preview__ai-text email-preview__ai-text--placeholder">
            AI-generated summaries will appear here once classification is enabled.
          </p>
        )}
      </div>

      <article className="email-preview__body">
        <p>{email.snippet}</p>
        <p className="email-preview__body-note">
          Full message body will be available in a future update.
        </p>
      </article>
    </section>
  );
}
