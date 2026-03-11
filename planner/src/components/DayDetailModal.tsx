import { format, parseISO } from "date-fns";
import { useStore } from "../store/useStore";
import { SessionDetailModal } from "./SessionDetailModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { useState } from "react";

type Props = {
  date: string; // ISO "YYYY-MM-DD"
  onClose: () => void;
};

export function DayDetailModal({ date, onClose }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { workSessions, customers, getTasksForDay, isTaskDoneForDate } = useStore();

  const d = parseISO(date);
  const sessions = workSessions.filter((s) => s.date === date);
  const tasks = getTasksForDay(d);
  const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const dateLabel = format(d, "EEEE, MMMM d, yyyy");
  const isEmpty = sessions.length === 0 && tasks.length === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-day-detail" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{dateLabel}</h2>

        {isEmpty ? (
          <p className="day-detail-empty">No sessions or tasks for this day.</p>
        ) : (
          <div className="day-detail-content">
            {sessions.length > 0 && (
              <section className="day-detail-section">
                <h3 className="day-detail-section-title">Work sessions</h3>
                <ul className="day-detail-list">
                  {sessions.map((s) => {
                    const customer = s.customerId
                      ? customerMap.get(s.customerId)
                      : null;
                    return (
                      <li
                        key={s.id}
                        className="day-detail-item day-detail-session clickable"
                        onClick={() => setSelectedSessionId(s.id)}
                      >
                        <span
                          className="day-detail-dot"
                          style={{
                            backgroundColor: s.isAdHoc
                              ? "var(--coral)"
                              : customer?.color ?? "var(--accent)",
                          }}
                        />
                        <span className="day-detail-item-text">
                          {s.isAdHoc ? "Ad-hoc" : customer?.name ?? "—"} · {s.hours}h
                          {s.notes && ` · ${s.notes}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {tasks.length > 0 && (
              <section className="day-detail-section">
                <h3 className="day-detail-section-title">Tasks</h3>
                <ul className="day-detail-list">
                  {tasks.map((t) => {
                    const isDone = isTaskDoneForDate(t, date);
                    const customer = customerMap.get(t.customerId);
                    return (
                      <li
                        key={`${t.id}-${date}`}
                        className={`day-detail-item day-detail-task clickable ${isDone ? "done" : ""}`}
                        onClick={() => setSelectedTaskId(t.id)}
                      >
                        <span className="day-detail-dot" style={{ backgroundColor: customer?.color ?? "var(--accent)" }} />
                        <span className="day-detail-item-text">
                          {isDone ? "✓" : "☐"} {customer?.name ?? "—"} · {t.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {totalHours > 0 && (
              <p className="day-detail-total">Total: {totalHours.toFixed(1)}h</p>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          date={date}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
