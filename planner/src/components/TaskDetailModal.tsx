import { useState } from "react";
import type { FormEvent } from "react";
import { format, parseISO } from "date-fns";
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
  taskId: string;
  date: string; // ISO "YYYY-MM-DD" - which occurrence we're viewing
  onClose: () => void;
};

export function TaskDetailModal({ taskId, date, onClose }: Props) {
  const {
    tasks,
    customers,
    setTaskCompletionForDate,
    isTaskDoneForDate,
    removeTask,
    updateTask,
  } = useStore();
  const task = tasks.find((t) => t.id === taskId);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task?.text ?? "");
  const [editCustomerId, setEditCustomerId] = useState(task?.customerId ?? "");
  const [editIsWeekly, setEditIsWeekly] = useState(task?.isWeekly ?? false);
  const [editDayOfWeek, setEditDayOfWeek] = useState(task?.dayOfWeek ?? 1);
  const [editEstimatedHours, setEditEstimatedHours] = useState(
    task?.estimatedHours != null ? String(task.estimatedHours) : ""
  );

  if (!task) {
    onClose();
    return null;
  }

  const customer = customers.find((c) => c.id === task.customerId);
  const dayLabel =
    task.dayOfWeek != null ? DAYS.find((d) => d.value === task.dayOfWeek)?.label : null;
  const isDoneForThisDate = isTaskDoneForDate(task, date);
  const dateLabel = format(parseISO(date), "EEEE, MMMM d, yyyy");

  const taskCustomers = customers.filter((c) => !c.isAdHoc);

  const handleToggleStatus = () => {
    setTaskCompletionForDate(taskId, date, !isDoneForThisDate);
  };

  const handleDelete = () => {
    const message = task.isWeekly
      ? "Delete this weekly task? This cannot be undone."
      : "Delete this task?";
    if (window.confirm(message)) {
      removeTask(taskId);
      onClose();
    }
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = editText.trim();
    if (!trimmed || !editCustomerId) return;

    const estimated =
      editEstimatedHours === ""
        ? undefined
        : parseFloat(editEstimatedHours);

    updateTask(taskId, {
      text: trimmed,
      customerId: editCustomerId,
      isWeekly: editIsWeekly,
      dayOfWeek: editIsWeekly ? editDayOfWeek : undefined,
      estimatedHours: estimated != null && !isNaN(estimated) && estimated > 0 ? estimated : undefined,
    });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditText(task.text);
    setEditCustomerId(task.customerId);
    setEditIsWeekly(task.isWeekly ?? false);
    setEditDayOfWeek(task.dayOfWeek ?? 1);
    setEditEstimatedHours(
      task.estimatedHours != null ? String(task.estimatedHours) : ""
    );
    setIsEditing(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-task-detail" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Task</h2>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="task-edit-form">
            <label>
              Task name
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Task description..."
                className="quick-tasks-input"
                autoComplete="off"
              />
            </label>
            <label>
              Client
              <select
                value={editCustomerId}
                onChange={(e) => setEditCustomerId(e.target.value)}
              >
                {taskCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Schedule
              <div className="task-edit-schedule">
                <select
                  value={editIsWeekly ? "weekly" : "once"}
                  onChange={(e) => setEditIsWeekly(e.target.value === "weekly")}
                >
                  <option value="once">One-time</option>
                  <option value="weekly">Weekly</option>
                </select>
                {editIsWeekly && (
                  <select
                    value={editDayOfWeek}
                    onChange={(e) => setEditDayOfWeek(Number(e.target.value))}
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>
            <label>
              Estimated hours <span className="label-optional">(optional)</span>
              <input
                type="number"
                min="0"
                step="0.25"
                value={editEstimatedHours}
                onChange={(e) => setEditEstimatedHours(e.target.value)}
                placeholder="e.g. 1.5"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setIsEditing(false)}
              >
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
                <dt>Task</dt>
                <dd className={isDoneForThisDate ? "task-detail-done" : ""}>
                  {task.text}
                </dd>
              </div>
              <div className="session-detail-row">
                <dt>Client</dt>
                <dd>{customer?.name ?? "—"}</dd>
              </div>
              {task.isWeekly && dayLabel && (
                <div className="session-detail-row">
                  <dt>Recurs</dt>
                  <dd>Every {dayLabel}</dd>
                </div>
              )}
              {task.estimatedHours != null && task.estimatedHours > 0 && (
                <div className="session-detail-row">
                  <dt>Estimated</dt>
                  <dd>{task.estimatedHours}h</dd>
                </div>
              )}
              <div className="session-detail-row">
                <dt>For this date</dt>
                <dd>{dateLabel}</dd>
              </div>
              <div className="session-detail-row">
                <dt>Status</dt>
                <dd>
                  <button
                    type="button"
                    className={`btn-status-toggle ${isDoneForThisDate ? "done" : "pending"}`}
                    onClick={handleToggleStatus}
                  >
                    {isDoneForThisDate ? "✓ Done" : "○ Not done"}
                  </button>
                </dd>
              </div>
            </dl>

            <div className="modal-actions modal-actions-spread">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleStartEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                title="Delete task"
              >
                Delete
              </button>
              <button type="button" className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
