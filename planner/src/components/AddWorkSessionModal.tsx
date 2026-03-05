import { useState } from "react";
import type { FormEvent } from "react";
import { format } from "date-fns";
import { useStore } from "../store/useStore";

type Props = {
  onClose: () => void;
  preselectedDate?: string; // YYYY-MM-DD
  preselectedCustomerId?: string | null;
};

export function AddWorkSessionModal({
  onClose,
  preselectedDate,
  preselectedCustomerId = null,
}: Props) {
  const { customers, addWorkSession } = useStore();

  const [customerId, setCustomerId] = useState<string | null>(
    preselectedCustomerId ?? (customers[0]?.id ?? null)
  );
  const isAdHoc = customerId === null;
  const [date, setDate] = useState(preselectedDate ?? format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("1");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    const canSubmit = !isNaN(h) && h > 0;
    if (canSubmit) {
      addWorkSession({
        customerId: isAdHoc ? null : customerId,
        date,
        hours: h,
        notes: notes.trim(),
        isAdHoc,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Log work session</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Customer
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
              placeholder="1.5"
            />
          </label>
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Log session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
