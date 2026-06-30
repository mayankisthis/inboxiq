/**
 * Maps API email objects to a UI-friendly shape.
 * Priority comes from the backend classification service.
 */
export function enrichEmails(emails = []) {
  return emails.map((email, index) => ({
    id: `${email.received_at}-${index}`,
    sender: email.sender,
    subject: email.subject,
    snippet: email.snippet,
    receivedAt: email.received_at,
    priority: email.priority || "Normal",
    category: email.category || null,
    aiSummary: email.aiSummary || null,
  }));
}
