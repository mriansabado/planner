import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useStore } from "../store/useStore";

type Props = {
  customerId: string;
  customerName: string;
  year: number;
  month: number;
  onClose: () => void;
};

export function CustomerNotesModal({
  customerId,
  customerName,
  year,
  month,
  onClose,
}: Props) {
  const { getSessionsForMonth } = useStore();
  const allSessions = getSessionsForMonth(year, month);
  const sessions = allSessions.filter(
    (s) => s.customerId === customerId && !s.isAdHoc
  );

  const [copied, setCopied] = useState(false);
  const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
  const monthName = format(new Date(year, month - 1), "MMMM yyyy");

  const formatReport = () => {
    const lines = [
      `Work Summary – ${customerName}`,
      `Period: ${monthName}`,
      `Total: ${totalHours.toFixed(1)} hours`,
      "",
      "Sessions:",
      ...sessions.map((s) => {
        const dateStr = format(parseISO(s.date), "EEE, MMM d, yyyy");
        const notePart = s.notes ? ` – ${s.notes}` : "";
        return `• ${dateStr}: ${s.hours}h${notePart}`;
      }),
    ];
    return lines.join("\n");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = formatReport();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-notes" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          Notes summary – {customerName}
        </h2>
        <p className="notes-period">{monthName} · {totalHours.toFixed(1)}h total</p>

        <div className="notes-list">
          {sessions.length === 0 ? (
            <p className="notes-empty">No sessions logged this month.</p>
          ) : (
            sessions
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((s) => (
                <div key={s.id} className="notes-session">
                  <div className="notes-session-header">
                    <span className="notes-date">
                      {format(parseISO(s.date), "EEE, MMM d")}
                    </span>
                    <span className="notes-hours">{s.hours}h</span>
                  </div>
                  {s.notes && (
                    <p className="notes-text">{s.notes}</p>
                  )}
                </div>
              ))
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
          {sessions.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={copyToClipboard}
            >
              {copied ? "Copied!" : "Copy report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
