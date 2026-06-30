const PRIORITY_CLASS_MAP = {
  Urgent: "urgent",
  Important: "important",
  Normal: "normal",
  "Low Priority": "low-priority",
};

export function getPriorityClass(priority) {
  return PRIORITY_CLASS_MAP[priority] || "normal";
}
