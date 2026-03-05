import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { useStore } from "../store/useStore";

type Props = {
  sessionId: string;
  onClose: () => void;
};

export function SessionDetailModal({ sessionId, onClose }: Props) {
  const { workSessions, customers, removeWorkSession, updateWorkSession } = useStore();
  const session = workSessions.find((s) => s.id === sessionId);

  const [isEditing, setIsEditing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (session) {
      setCustomerId(session.isAdHoc ? null : session.customerId);
      setDate(session.date);
      setHours(String(session.hours));
      setNotes(session.notes);
    }
  }, [session]);

  if (!session) {
    onClose();
    return null;
  }

  const customerName = session.customerId
    ? customers.find((c) => c.id === session.customerId)?.name ?? null
    : null;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    if (!isNaN(h) && h > 0) {
      updateWorkSession(sessionId, {
        customerId,
        date,
        hours: h,
        notes: notes.trim(),
        isAdHoc: customerId === null,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this work session?")) {
      removeWorkSession(sessionId);
      onClose();
    }
  };

  const dateStr = format(parseISO(session.date), "EEEE, MMMM d, yyyy");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-session" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Work session</h2>

        {isEditing ? (
          <form onSubmit={handleSave}>
            <label>
              Client
              <select
                value={customerId ?? ""}
                onChange={(e) => setCustomerId(e.target.value || null)}
              >
                <option value="">Ad-hoc (no customer)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Hours
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </label>
            <label>
              Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="session-detail-list">
              <div className="session-detail-row">
                <dt>Date</dt>
                <dd>{dateStr}</dd>
              </div>
              <div className="session-detail-row">
                <dt>Hours</dt>
                <dd>{session.hours}h</dd>
              </div>
              <div className="session-detail-row">
                <dt>Client</dt>
                <dd>{session.isAdHoc ? "Ad-hoc" : customerName ?? "—"}</dd>
              </div>
              <div className="session-detail-row session-detail-notes">
                <dt>Notes</dt>
                <dd>{session.notes || "—"}</dd>
              </div>
            </dl>
            <div className="modal-actions modal-actions-spread">
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                title="Delete session"
              >
                Delete
              </button>
              <div>
                <button type="button" className="btn-ghost" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
