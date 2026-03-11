import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useStore } from "../store/useStore";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type Props = {
  customerId: string;
  customerName: string;
  onClose: () => void;
};

type ViewFilter = "open" | "closed" | "all";

export function CustomerTasksModal({
  customerId,
  customerName,
  onClose,
}: Props) {
  const { addTask, getTasksForCustomer, updateTask, removeTask } = useStore();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("open");
  const [showAdd, setShowAdd] = useState(false);
  const [input, setInput] = useState("");
  const [taskType, setTaskType] = useState<"once" | "weekly">("once");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const allTasks = getTasksForCustomer(customerId);
  const openTasks = allTasks.filter((t) =>
    t.isWeekly ? true : !t.done
  );
  const closedTasks = allTasks.filter((t) => !t.isWeekly && t.done);

  const filteredTasks =
    viewFilter === "open"
      ? openTasks
      : viewFilter === "closed"
        ? closedTasks
        : allTasks;

  useEffect(() => {
    if (showAdd) inputRef.current?.focus();
  }, [showAdd]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

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
    setShowAdd(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-customer-tasks"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="modal-title">Tasks – {customerName}</h2>

        <div className="tasks-view-tabs">
          <button
            type="button"
            className={viewFilter === "open" ? "active" : ""}
            onClick={() => setViewFilter("open")}
          >
            Open ({openTasks.length})
          </button>
          <button
            type="button"
            className={viewFilter === "closed" ? "active" : ""}
            onClick={() => setViewFilter("closed")}
          >
            Closed ({closedTasks.length})
          </button>
          <button
            type="button"
            className={viewFilter === "all" ? "active" : ""}
            onClick={() => setViewFilter("all")}
          >
            All ({allTasks.length})
          </button>
        </div>

        <div className="tasks-add-section">
          {showAdd ? (
            <form onSubmit={handleAddTask} className="tasks-add-form">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Task description..."
                className="quick-tasks-input"
                autoComplete="off"
              />
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
              <div className="tasks-add-actions">
                <button type="submit" className="btn-primary">
                  Add
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setShowAdd(false);
                    setInput("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn-secondary tasks-add-trigger"
              onClick={() => setShowAdd(true)}
            >
              + Add task
            </button>
          )}
        </div>

        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <p className="tasks-empty">
              {viewFilter === "open" && "No open tasks."}
              {viewFilter === "closed" && "No closed tasks yet."}
              {viewFilter === "all" && "No tasks yet."}
            </p>
          ) : (
            filteredTasks.map((t) => {
              const isOneTime = !t.isWeekly;
              return (
              <div
                key={t.id}
                className={`tasks-list-item ${isOneTime && t.done ? "done" : ""}`}
              >
                {isOneTime ? (
                  <button
                    type="button"
                    className="tasks-item-check"
                    onClick={() => updateTask(t.id, { done: !t.done })}
                  >
                    {t.done ? "✓" : "○"}
                  </button>
                ) : (
                  <span className="tasks-item-weekly-count" title="Mark dates on calendar">
                    {t.completedDates?.length ?? 0}✓
                  </span>
                )}
                <div className="tasks-item-content">
                  <span className="tasks-item-text">{t.text}</span>
                  <span className="tasks-item-meta">
                    {t.createdAt &&
                      formatDistanceToNow(new Date(t.createdAt), {
                        addSuffix: true,
                      })}
                    {t.isWeekly &&
                      t.dayOfWeek != null &&
                      ` · ${DAYS.find((d) => d.value === t.dayOfWeek)?.label ?? ""}`}
                  </span>
                </div>
                {t.isWeekly && (
                  <span
                    className="tasks-item-weekly-badge"
                    onClick={() => {
                      if (window.confirm("Remove this task from the calendar? It will become a one-time task.")) {
                        updateTask(t.id, { isWeekly: false, dayOfWeek: undefined });
                      }
                    }}
                    title="Remove from calendar"
                  >
                    {t.dayOfWeek != null
                      ? DAYS.find((d) => d.value === t.dayOfWeek)?.label ?? ""
                      : "Weekly"}
                  </span>
                )}
                {!t.isWeekly && !t.done && (
                  <span
                    className="tasks-item-add-weekly"
                    onClick={() =>
                      updateTask(t.id, { isWeekly: true, dayOfWeek: 1 })
                    }
                  >
                    +Calendar
                  </span>
                )}
                <button
                  type="button"
                  className="tasks-item-delete"
                  onClick={() => {
                    if (t.isWeekly
                      ? window.confirm("Delete this weekly task? This cannot be undone.")
                      : window.confirm("Delete this task?")) {
                      removeTask(t.id);
                    }
                  }}
                  title="Delete task"
                >
                  ×
                </button>
              </div>
            );
            })
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
