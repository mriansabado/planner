import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addWeeks,
  addDays,
  isSameMonth,
  isToday,
} from "date-fns";
import { useStore } from "../store/useStore";
import { SessionDetailModal } from "./SessionDetailModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { DayDetailModal } from "./DayDetailModal";

type Props = {
  focusDate: Date;
  onFocusDateChange: (d: Date) => void;
  onDayClick?: (date: string) => void;
};

export function PlannerView({ focusDate, onFocusDateChange, onDayClick }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDate, setSelectedTaskDate] = useState<string | null>(null);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const { viewMode, setViewMode, workSessions, customers, getTasksForDay, isTaskDoneForDate } = useStore();

  const getSessionsForDay = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    return workSessions.filter((s) => s.date === key);
  };

  const navigate = (dir: 1 | -1) => {
    if (viewMode === "monthly") {
      onFocusDateChange(addMonths(focusDate, dir));
    } else if (viewMode === "weekly") {
      onFocusDateChange(addWeeks(focusDate, dir));
    } else {
      onFocusDateChange(addDays(focusDate, dir));
    }
  };

  let rangeStart: Date;
  let rangeEnd: Date;
  let headerLabel: string;
  let dayHeaders: string[];

  if (viewMode === "monthly") {
    rangeStart = startOfWeek(startOfMonth(focusDate));
    rangeEnd = endOfWeek(endOfMonth(focusDate));
    headerLabel = format(focusDate, "MMMM yyyy");
    dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  } else if (viewMode === "weekly") {
    rangeStart = startOfWeek(focusDate);
    rangeEnd = endOfWeek(focusDate);
    headerLabel = `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "MMM d, yyyy")}`;
    dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  } else {
    rangeStart = focusDate;
    rangeEnd = focusDate;
    headerLabel = format(focusDate, "EEEE, MMMM d, yyyy");
    dayHeaders = [];
  }

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const goToToday = () => {
    onFocusDateChange(new Date());
    setViewMode("daily");
  };

  return (
    <section className="planner-view">
      <div className="planner-nav">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2 className="planner-title">{headerLabel}</h2>
        <button className="btn-icon" onClick={() => navigate(1)}>
          →
        </button>
        <button className="btn-today" onClick={goToToday}>
          Today
        </button>
      </div>

      <div className={`planner-grid ${viewMode}`}>
        {dayHeaders.length > 0 && (
          <div className="day-headers">
            {dayHeaders.map((h) => (
              <div key={h} className="day-header">
                <span className="day-header-full">{h}</span>
                <span className="day-header-short">{h.charAt(0)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="planner-days">
          {days.map((d) => {
            const dateKey = format(d, "yyyy-MM-dd");
            const sessions = getSessionsForDay(d);
            const tasks = getTasksForDay(d);
            const inMonth = viewMode !== "monthly" || isSameMonth(d, focusDate);
            const hasActivity = sessions.length > 0 || (inMonth && tasks.length > 0);

            return (
              <div
                key={d.toISOString()}
                className={`planner-day ${!inMonth ? "other-month" : ""} ${onDayClick ? "clickable" : ""} ${isToday(d) ? "today" : ""} ${hasActivity ? "has-activity" : ""}`}
                onClick={() => onDayClick?.(dateKey)}
              >
                <div
                  className="day-top"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDayKey(dateKey);
                  }}
                  title="View day details"
                >
                  <span className="day-num">{format(d, "d")}</span>
                  <span className="day-view-hint">view day</span>
                </div>
                <div className={`day-sessions-wrap ${sessions.length + tasks.length >= 2 ? "scrollable" : ""}`}>
                  <div className="day-sessions">
                  {sessions.map((s) => {
                    const customer = s.customerId
                      ? customerMap.get(s.customerId)
                      : null;
                    const color = s.isAdHoc ? "var(--coral)" : customer?.color ?? "var(--accent)";
                    return (
                      <div
                        key={s.id}
                        className="session-chip clickable"
                        style={{ borderLeftColor: color }}
                        title={`${s.isAdHoc ? "Ad-hoc" : customer?.name ?? ""} · ${s.hours}h${s.notes ? `: ${s.notes}` : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSessionId(s.id);
                        }}
                      >
                        <span className="chip-customer">
                          {s.isAdHoc ? "Ad-hoc" : customer?.name ?? "—"}
                        </span>
                        <span className="chip-details">
                          <span className="chip-hours">{s.hours}h</span>
                          {s.notes && (
                            <span className="chip-notes">{s.notes}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {inMonth &&
                    tasks.map((t) => {
                      const isDone = isTaskDoneForDate(t, dateKey);
                      const customer = customerMap.get(t.customerId);
                      const color = customer?.color ?? "var(--accent)";
                      return (
                        <div
                          key={`${t.id}-${dateKey}`}
                          className={`session-chip task-chip clickable ${isDone ? "task-done" : ""}`}
                          style={{
                            borderLeftColor: isDone ? "var(--text-muted)" : color,
                          }}
                          title={`${isDone ? "Done · " : ""}${customer?.name ?? ""} · ${t.text} · Click to open`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(t.id);
                            setSelectedTaskDate(dateKey);
                          }}
                        >
                          <span className="chip-customer">
                            {isDone ? "✓" : "☐"} {customer?.name ?? "—"}
                          </span>
                          <span className="chip-notes">{t.text}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="day-scroll-fade" aria-hidden />
                </div>
                {onDayClick && inMonth && (
                  <button
                    type="button"
                    className="day-add"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(dateKey);
                    }}
                    title="Log work for this day"
                  >
                    + add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
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
      {expandedDayKey && (
        <DayDetailModal
          date={expandedDayKey}
          onClose={() => setExpandedDayKey(null)}
        />
      )}
    </section>
  );
}
