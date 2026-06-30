import { formatEmailFullDate } from "../utils/formatDate";
import "./EmailPreview.css";

export default function EmailPreview({ email, onClose }) {
  if (!email) {
    return (
      <section className="email-preview email-preview--empty">
        <div className="email-preview__placeholder">
          <span className="email-preview__placeholder-icon" aria-hidden="true">
            ✉
          </span>
          <h2>Select an email</h2>
          <p>Choose a message from your inbox to preview it here.</p>
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
          <div className="email-preview__avatar" aria-hidden="true">
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
          {email.priority ? (
            <span className={`email-preview__badge email-preview__badge--${email.priority}`}>
              {email.priority} priority
            </span>
          ) : (
            <span className="email-preview__badge email-preview__badge--placeholder">
              Priority badge
            </span>
          )}

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

      <div className="email-preview__ai-summary">
        <p className="email-preview__ai-label">AI Summary</p>
        {email.aiSummary ? (
          <p className="email-preview__ai-text">{email.aiSummary}</p>
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
