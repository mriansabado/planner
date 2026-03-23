import { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import { useStore } from "../store/useStore";
import { ClientCalendarPreview } from "../components/ClientCalendarPreview";
import { AddWorkSessionModal } from "../components/AddWorkSessionModal";
import { TaskDetailModal } from "../components/TaskDetailModal";
import { CustomerNotesModal } from "../components/CustomerNotesModal";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type ViewFilter = "open" | "closed" | "all";

export function ClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const {
    customers,
    workSessions,
    getTasksForCustomer,
    getSessionsForMonth,
    addTask,
    updateTask,
    removeTask,
  } = useStore();

  const [viewFilter, setViewFilter] = useState<ViewFilter>("open");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [input, setInput] = useState("");
  const [taskType, setTaskType] = useState<"once" | "weekly">("once");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDate, setSelectedTaskDate] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const customer = customers.find((c) => c.id === clientId);
  const allTasks = customer ? getTasksForCustomer(customer.id) : [];
  const openTasks = allTasks.filter((t) => (t.isWeekly ? true : !t.done));
  const closedTasks = allTasks.filter((t) => !t.isWeekly && t.done);

  const filteredTasks =
    viewFilter === "open" ? openTasks : viewFilter === "closed" ? closedTasks : allTasks;

  const totalHours = workSessions
    .filter((s) => s.customerId === clientId && !s.isAdHoc)
    .reduce((sum, s) => sum + s.hours, 0);

  const monthSessions = customer
    ? getSessionsForMonth(currentYear, currentMonth).filter(
        (s) => s.customerId === customer.id && !s.isAdHoc
      )
  : [];

  useEffect(() => {
    if (showAdd) inputRef.current?.focus();
  }, [showAdd]);

  if (!clientId) {
    navigate("/clients");
    return null;
  }

  if (!customer) {
    return (
      <div className="page client-page">
        <p className="client-page-error">Client not found.</p>
        <Link to="/clients" className="btn-secondary">
          ← Back to clients
        </Link>
      </div>
    );
  }

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
        customerId: customer.id,
        text,
        done: false,
        isWeekly,
        dayOfWeek: isWeekly ? dayOfWeekValue : undefined,
      });
    }
    setInput("");
    setShowAdd(false);
  };

  return (
    <div className="page client-page">
      <Link to="/clients" className="client-page-back">
        ← Back to clients
      </Link>

      <div className="client-page-grid">
        <div className="client-page-left">
          <section className="client-info-section">
            <div
              className="client-info-color"
              style={{ backgroundColor: customer.color }}
            />
            <div className="client-info-body">
              <h1 className="client-info-name">{customer.name}</h1>
              <p className="client-info-stats">
                {customer.isAdHoc
                  ? "Ad-hoc"
                  : `${customer.monthlyHours}h/mo`}{" "}
                · {totalHours.toFixed(1)}h logged
              </p>
              <button
                type="button"
                className="btn-primary client-info-log"
                onClick={() => setShowAddSession(true)}
              >
                + Log work
              </button>
            </div>
          </section>

          <section className="client-tasks-section">
            <h2 className="client-section-title">Tasks</h2>

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
              <div className="tasks-add-triggers">
                <button
                  type="button"
                  className="btn-secondary tasks-add-trigger"
                  onClick={() => setShowAdd(true)}
                >
                  + Add task
                </button>
                <button
                  type="button"
                  className="btn-secondary tasks-add-trigger"
                  onClick={() => {
                    setTaskType("weekly");
                    setDayOfWeek(1);
                    setShowAdd(true);
                  }}
                >
                  + Add weekly task
                </button>
              </div>
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
                      <span
                        className="tasks-item-weekly-count"
                        title="Mark dates on calendar"
                      >
                        {t.completedDates?.length ?? 0}✓
                      </span>
                    )}
                    <div
                      className="tasks-item-content clickable"
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setSelectedTaskDate(format(new Date(), "yyyy-MM-dd"));
                      }}
                      title="View or edit task"
                    >
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
                          if (
                            window.confirm(
                              "Remove from calendar? Becomes one-time task."
                            )
                          ) {
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
                        if (
                          t.isWeekly
                            ? window.confirm(
                                "Delete this weekly task? This cannot be undone."
                              )
                            : window.confirm("Delete this task?")
                        ) {
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
          </section>

          <section className="client-notes-section">
            <div className="client-notes-header">
              <h2 className="client-section-title">Notes</h2>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setShowNotesModal(true)}
              >
                Full report
              </button>
            </div>
            <div className="client-notes-list">
              {monthSessions.length === 0 ? (
                <p className="client-notes-empty">
                  No sessions logged this month.
                </p>
              ) : (
                monthSessions
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((s) => (
                    <div key={s.id} className="client-notes-item">
                      <div className="client-notes-item-header">
                        <span className="client-notes-date">
                          {format(new Date(s.date), "EEE, MMM d")}
                        </span>
                        <span className="client-notes-hours">{s.hours}h</span>
                      </div>
                      {s.notes && (
                        <p className="client-notes-text">{s.notes}</p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </section>
        </div>

        <aside className="client-page-right">
          <h2 className="client-section-title">Calendar</h2>
          <ClientCalendarPreview customerId={customer.id} tasksOnly />
        </aside>
      </div>

      {showNotesModal && (
        <CustomerNotesModal
          customerId={customer.id}
          customerName={customer.name}
          year={currentYear}
          month={currentMonth}
          onClose={() => setShowNotesModal(false)}
        />
      )}

      {showAddSession && (
        <AddWorkSessionModal
          onClose={() => setShowAddSession(false)}
          preselectedDate={format(new Date(), "yyyy-MM-dd")}
          preselectedCustomerId={customer.id}
        />
      )}

      {selectedTaskId && selectedTaskDate && (
        <TaskDetailModal
          taskId={selectedTaskId}
          date={selectedTaskDate}
          onClose={() => {
            setSelectedTaskId(null);
            setSelectedTaskDate(null);
          }}
        />
      )}
    </div>
  );
}
