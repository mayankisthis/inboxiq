/**
 * Maps API email objects to a UI-friendly shape with placeholders
 * for future ML features (priority, categories, AI summaries).
 */
export function enrichEmails(emails = []) {
  return emails.map((email, index) => ({
    id: `${email.received_at}-${index}`,
    sender: email.sender,
    subject: email.subject,
    snippet: email.snippet,
    receivedAt: email.received_at,
    // Future: populated by backend / ML pipeline
    priority: null,
    category: null,
    aiSummary: null,
  }));
}
