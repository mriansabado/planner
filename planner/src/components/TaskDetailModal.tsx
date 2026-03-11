import { format, parseISO } from "date-fns";
import { useStore } from "../store/useStore";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type Props = {
  taskId: string;
  date: string; // ISO "YYYY-MM-DD" - which occurrence we're viewing
  onClose: () => void;
};

export function TaskDetailModal({ taskId, date, onClose }: Props) {
  const { tasks, customers, setTaskCompletionForDate, isTaskDoneForDate, removeTask } = useStore();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    onClose();
    return null;
  }

  const customer = customers.find((c) => c.id === task.customerId);
  const dayLabel =
    task.dayOfWeek != null ? DAYS[task.dayOfWeek] : null;
  const isDoneForThisDate = isTaskDoneForDate(task, date);
  const dateLabel = format(parseISO(date), "EEEE, MMMM d, yyyy");

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-task-detail" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Task</h2>

        <dl className="session-detail-list">
          <div className="session-detail-row">
            <dt>Task</dt>
            <dd className={isDoneForThisDate ? "task-detail-done" : ""}>{task.text}</dd>
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
      </div>
    </div>
  );
}
