export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Auth check failed with status ${response.status}`);
  }

  return response.json();
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Logout failed with status ${response.status}`);
  }

  return response.json();
}

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/api/auth/google`;
}

export async function fetchRecentEmails() {
  const response = await fetch(`${API_BASE_URL}/api/emails/recent`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to fetch emails (${response.status})`);
  }

  return response.json();
}

export async function fetchRules() {
  const response = await fetch(`${API_BASE_URL}/api/rules`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to fetch rules (${response.status})`);
  }

  return response.json();
}

export async function saveRules(rules) {
  const response = await fetch(`${API_BASE_URL}/api/rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rules }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to save rules (${response.status})`);
  }

  return response.json();
}

export async function fetchDigest() {
  const tzOffset = new Date().getTimezoneOffset();
  const response = await fetch(`${API_BASE_URL}/api/emails/digest?tz_offset=${tzOffset}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to fetch daily digest (${response.status})`);
  }

  return response.json();
}

export async function parseSearchQuery(query) {
  const response = await fetch(`${API_BASE_URL}/api/emails/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to parse search query (${response.status})`);
  }

  return response.json();
}

export async function fetchEmailDetail(messageId) {
  const response = await fetch(`${API_BASE_URL}/api/emails/message/${messageId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to fetch email details (${response.status})`);
  }

  return response.json();
}

export async function searchEmails(query) {
  const response = await fetch(`${API_BASE_URL}/api/emails/search?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to search emails (${response.status})`);
  }

  return response.json();
}

export async function generateEmailReply(emailId, style) {
  const response = await fetch(`${API_BASE_URL}/api/emails/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ emailId, style }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to generate reply (${response.status})`);
  }

  return response.json();
}

export async function sendEmailReply(emailId, reply) {
  const response = await fetch(`${API_BASE_URL}/api/emails/send-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ emailId, reply }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to send reply (${response.status})`);
  }

  return response.json();
}

export async function toggleEmailStarred(emailId, starred) {
  const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/star`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ starred }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to update star state (${response.status})`);
  }

  return response.json();
}

export async function toggleEmailRead(emailId, read) {
  const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ read }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to update read state (${response.status})`);
  }

  return response.json();
}

export async function toggleEmailArchived(emailId, archived) {
  const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/archive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ archived }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to update archive state (${response.status})`);
  }

  return response.json();
}
