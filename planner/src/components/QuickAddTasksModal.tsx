import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";

type Props = {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onViewAll?: () => void;
};

export function QuickAddTasksModal({
  customerId,
  customerName,
  onClose,
  onViewAll,
}: Props) {
  const DAYS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const { addTask, getTasksForCustomer, updateTask, removeTask } = useStore();
  const [input, setInput] = useState("");
  const [taskType, setTaskType] = useState<"once" | "weekly">("once");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Default Monday
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = getTasksForCustomer(customerId);
  const pendingCount = tasks.filter((t) => !t.done).length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Read current values from form to avoid race with state updates
    const form = e.currentTarget;
    const typeSelect = form.querySelector<HTMLSelectElement>('[name="taskType"]');
    const daySelect = form.querySelector<HTMLSelectElement>('[name="dayOfWeek"]');
    const isWeekly = typeSelect?.value === "weekly";
    const dayOfWeekValue = daySelect ? Number(daySelect.value) : 1;

    const items = trimmed.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    for (const text of items) {
      addTask({
        customerId,
        text,
        done: false,
        isWeekly,
        dayOfWeek: isWeekly ? dayOfWeekValue : undefined,
      });
    }
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape to close
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-quick-tasks"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="modal-title">
          Quick add tasks – {customerName}
          {onViewAll && (
            <button
              type="button"
              className="quick-tasks-view-all"
              onClick={onViewAll}
            >
              View all
            </button>
          )}
        </h2>
        <p className="quick-tasks-hint">
          Type and press Enter. Paste a list (one per line) to add many at once.
        </p>

        <form id="quick-add-task-form" onSubmit={handleSubmit}>
          <div className="quick-tasks-input-row">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Fix login bug, Add export feature..."
              className="quick-tasks-input"
              autoComplete="off"
            />
          </div>
          <div className="quick-tasks-schedule-row">
            <select
              name="taskType"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as "once" | "weekly")}
              className="quick-tasks-type-select"
            >
              <option value="once">One-time</option>
              <option value="weekly">Weekly</option>
            </select>
            {taskType === "weekly" && (
              <select
                name="dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="quick-tasks-day-select"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </form>

        <div className="quick-tasks-list">
          {tasks.length === 0 ? (
            <p className="quick-tasks-empty">No tasks yet. Start typing above.</p>
          ) : (
            tasks.map((t) => {
              const isOneTime = !t.isWeekly;
              return (
              <div key={t.id} className={`quick-task-item ${isOneTime && t.done ? "done" : ""}`}>
                {isOneTime ? (
                  <button
                    type="button"
                    className="quick-task-check"
                    onClick={() => updateTask(t.id, { done: !t.done })}
                    title={t.done ? "Mark incomplete" : "Mark done"}
                  >
                    {t.done ? "✓" : "○"}
                  </button>
                ) : (
                  <span className="quick-task-weekly-count" title="Mark dates on calendar">
                    {t.completedDates?.length ?? 0}✓
                  </span>
                )}
                <span className="quick-task-text">{t.text}</span>
                {t.isWeekly && (
                  <span
                    className="quick-task-weekly-badge"
                    onClick={() => updateTask(t.id, { isWeekly: false, dayOfWeek: undefined })}
                    title="Click to remove from calendar"
                  >
                    {t.dayOfWeek != null
                      ? DAYS.find((d) => d.value === t.dayOfWeek)?.label ?? "Weekly"
                      : "Weekly"}
                  </span>
                )}
                {!t.isWeekly && !t.done && (
                  <span
                    className="quick-task-weekly-add"
                    onClick={() => updateTask(t.id, { isWeekly: true, dayOfWeek: 1 })}
                    title="Add to calendar (Mondays)"
                  >
                    +Calendar
                  </span>
                )}
                <button
                  type="button"
                  className="quick-task-delete btn-icon delete"
                  onClick={() => removeTask(t.id)}
                  title="Remove task"
                >
                  ×
                </button>
              </div>
            );
            })
          )}
        </div>

        <div className="modal-actions">
          {pendingCount > 0 && (
            <span className="quick-tasks-pending">{pendingCount} pending</span>
          )}
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="quick-add-task-form" className="btn-primary">
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}
