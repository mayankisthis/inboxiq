/**
 * Dynamic hash-based sender avatar color mapper.
 * Maps any sender name to a consistent, modern, high-contrast color from a curated palette.
 */
export function getAvatarColor(sender = "") {
  const colors = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f43f5e", // Rose
    "#f59e0b", // Amber
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#14b8a6", // Teal
    "#ec4899", // Pink
    "#f97316", // Orange
    "#64748b", // Slate
  ];

  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
