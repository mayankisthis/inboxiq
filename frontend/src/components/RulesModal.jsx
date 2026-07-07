import { useEffect, useState } from "react";
import { fetchRules, saveRules } from "../api";
import "./RulesModal.css";

export default function RulesModal({ isOpen, onClose, onRulesSaved }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRules();
        setRules(data.rules || []);
      } catch (err) {
        setError(err.message || "Failed to load rules.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  function handleAddRule() {
    setRules((prev) => [
      ...prev,
      { field: "sender", contains: "", priority: "Normal" },
    ]);
  }

  function handleDeleteRule(index) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRuleChange(index, key, value) {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, [key]: value } : rule))
    );
  }

  async function handleSave() {
    const validRules = rules.filter((r) => r.contains.trim() !== "");
    setSaving(true);
    setError(null);
    try {
      await saveRules(validRules);
      onRulesSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save rules.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <header className="rules-modal__header">
          <h2>Custom Priority Rules</h2>
          <button type="button" className="rules-modal__close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="rules-modal__content">
          {error && <p className="rules-modal__error">{error}</p>}

          {loading ? (
            <p className="rules-modal__loading">Loading custom rules...</p>
          ) : (
            <div className="rules-modal__list">
              {rules.length === 0 ? (
                <div className="rules-modal__empty" style={{ textAlign: "center", padding: "2.5rem 1rem", border: "2px dashed var(--color-border)", borderRadius: "8px", background: "var(--color-surface-muted)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.7 }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.25rem" }}>No custom rules</p>
                  <p className="rules-modal__empty-help" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
                    Add rules to override default email classifications based on sender, subject, or snippet.
                  </p>
                </div>
              ) : (
                rules.map((rule, idx) => (
                  <div key={idx} className="rules-modal__row">
                    <div className="rules-modal__col">
                      <label className="rules-modal__label">If</label>
                      <select
                        className="rules-modal__select"
                        value={rule.field}
                        onChange={(e) => handleRuleChange(idx, "field", e.target.value)}
                      >
                        <option value="sender">Sender</option>
                        <option value="subject">Subject</option>
                        <option value="snippet">Snippet</option>
                      </select>
                    </div>

                    <div className="rules-modal__col rules-modal__col--contains">
                      <label className="rules-modal__label">Contains</label>
                      <input
                        type="text"
                        className="rules-modal__input"
                        placeholder="Keyword or text to match..."
                        value={rule.contains}
                        onChange={(e) => handleRuleChange(idx, "contains", e.target.value)}
                      />
                    </div>

                    <div className="rules-modal__col">
                      <label className="rules-modal__label">Assign Priority</label>
                      <select
                        className="rules-modal__select"
                        value={rule.priority}
                        onChange={(e) => handleRuleChange(idx, "priority", e.target.value)}
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="Important">Important</option>
                        <option value="Normal">Normal</option>
                        <option value="Low Priority">Low Priority</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="rules-modal__delete"
                      onClick={() => handleDeleteRule(idx)}
                      aria-label="Delete rule"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <button
            type="button"
            className="rules-modal__add-btn"
            onClick={handleAddRule}
            disabled={loading || saving}
          >
            + Add New Rule
          </button>
        </div>

        <footer className="rules-modal__footer">
          <button
            type="button"
            className="rules-modal__btn rules-modal__btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rules-modal__btn rules-modal__btn--primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Rules"}
          </button>
        </footer>
      </div>
    </div>
  );
}
