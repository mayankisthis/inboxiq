import { formatEmailTimestamp } from "../utils/formatDate";
import "./EmailCard.css";

export default function EmailCard({ email, isSelected, isUnread, onSelect }) {
  return (
    <button
      type="button"
      className={`email-card ${isSelected ? "email-card--selected" : ""} ${
        isUnread ? "email-card--unread" : ""
      }`}
      onClick={() => onSelect(email.id)}
      aria-pressed={isSelected}
    >
      <span
        className={`email-card__indicator ${isUnread ? "email-card__indicator--unread" : ""}`}
        aria-hidden="true"
      />

      <div className="email-card__content">
        <div className="email-card__row">
          <span className="email-card__sender">{email.sender}</span>
          <time className="email-card__time" dateTime={email.receivedAt}>
            {formatEmailTimestamp(email.receivedAt)}
          </time>
        </div>

        <div className="email-card__row email-card__row--meta">
          <span className="email-card__subject">{email.subject}</span>

          <span className="email-card__badges">
            {email.priority && (
              <span className={`email-card__badge email-card__badge--${email.priority}`}>
                {email.priority}
              </span>
            )}
            {email.category && (
              <span className="email-card__badge email-card__badge--category">
                {email.category}
              </span>
            )}
          </span>
        </div>

        <p className="email-card__snippet">{email.snippet}</p>
      </div>
    </button>
  );
}
