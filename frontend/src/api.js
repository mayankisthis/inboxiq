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
