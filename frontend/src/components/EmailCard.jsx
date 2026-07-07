import React from "react";
import { formatEmailTimestamp } from "../utils/formatDate";
import { getPriorityClass } from "../utils/priority";
import { getAvatarColor } from "../utils/avatar";
import "./EmailCard.css";

export default React.memo(function EmailCard({ email, isSelected, isUnread, onSelect, onToggleStar }) {
  const priorityClass = getPriorityClass(email.priority);

  return (
    <button
      type="button"
      className={`email-card ${isSelected ? "email-card--selected" : ""} ${
        isUnread ? "email-card--unread" : ""
      }`}
      onClick={() => onSelect(email.id)}
      aria-pressed={isSelected}
    >
      <div className="email-card__avatar-container">
        <div
          className="email-card__avatar"
          style={{ backgroundColor: getAvatarColor(email.sender) }}
        >
          {email.sender.charAt(0).toUpperCase()}
        </div>
        {isUnread && (
          <span className="email-card__unread-dot" aria-label="Unread" />
        )}
      </div>

      <div className="email-card__content">
        <div className="email-card__row">
          <span className="email-card__sender">{email.sender}</span>
          <span className="email-card__meta-right">
            <span className={`email-card__badge email-card__badge--${priorityClass}`}>
              {email.priority}
            </span>
            <time className="email-card__time" dateTime={email.receivedAt}>
              {formatEmailTimestamp(email.receivedAt)}
            </time>
          </span>
        </div>

        <div className="email-card__row email-card__row--meta">
          <span className="email-card__subject">{email.subject}</span>
          <button
            type="button"
            className={`email-card__star-btn ${email.isStarred ? "email-card__star-btn--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(email.id);
            }}
            aria-label={email.isStarred ? "Unstar email" : "Star email"}
          >
            {email.isStarred ? "★" : "☆"}
          </button>

          {email.category && (
            <span className="email-card__badge email-card__badge--category">
              {email.category}
            </span>
          )}
        </div>

        <p className="email-card__snippet">{email.snippet}</p>
      </div>
    </button>
  );
});
