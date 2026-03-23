import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { useStore } from "../store/useStore";
import { DayDetailModal } from "./DayDetailModal";

type Props = {
  customerId: string;
  tasksOnly?: boolean;
};

export function ClientCalendarPreview({ customerId, tasksOnly = false }: Props) {
  const [focusDate, setFocusDate] = useState(new Date());
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const { workSessions, getTasksForDay, isTaskDoneForDate } = useStore();

  const getSessionsForDay = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    return workSessions.filter(
      (s) => s.date === key && s.customerId === customerId && !s.isAdHoc
    );
  };

  const getClientTasksForDay = (d: Date) => {
    const allDayTasks = getTasksForDay(d);
    return allDayTasks.filter((t) => t.customerId === customerId);
  };

  const rangeStart = startOfWeek(startOfMonth(focusDate));
  const rangeEnd = endOfWeek(endOfMonth(focusDate));
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  return (
    <section className="client-calendar-preview">
      <div className="client-calendar-nav">
        <button
          type="button"
          className="btn-icon"
          onClick={() => setFocusDate(addMonths(focusDate, -1))}
        >
          ←
        </button>
        <h3 className="client-calendar-title">
          {format(focusDate, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          className="btn-icon"
          onClick={() => setFocusDate(addMonths(focusDate, 1))}
        >
          →
        </button>
      </div>

      <div className="client-calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((h) => (
          <div key={h} className="client-calendar-header">
            {h.charAt(0)}
          </div>
        ))}
        {days.map((d) => {
          const dateKey = format(d, "yyyy-MM-dd");
          const sessions = tasksOnly ? [] : getSessionsForDay(d);
          const tasks = getClientTasksForDay(d);
          const inMonth = isSameMonth(d, focusDate);
          const hasActivity =
            sessions.length > 0 || (inMonth && tasks.length > 0);
          const hasMultiple = sessions.length + tasks.length >= 2;

          return (
            <div
              key={d.toISOString()}
              className={`client-calendar-day ${!inMonth ? "other-month" : ""} ${isToday(d) ? "today" : ""} ${hasActivity ? "has-activity" : ""} ${hasMultiple ? "has-scroll" : ""}`}
              onClick={() => setExpandedDayKey(dateKey)}
              title="View day"
            >
              <span className="client-calendar-day-num">{format(d, "d")}</span>
              {hasActivity && (
                <div className="client-calendar-dots">
                  {sessions.map((s) => (
                    <span
                      key={s.id}
                      className="client-calendar-dot session"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  ))}
                  {tasks.map((t) => (
                    <span
                      key={`${t.id}-${dateKey}`}
                      className={`client-calendar-dot task ${isTaskDoneForDate(t, dateKey) ? "done" : ""}`}
                      style={{ borderColor: "var(--accent)" }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="client-calendar-hint">Click a day to view details</p>

      {expandedDayKey && (
        <DayDetailModal
          date={expandedDayKey}
          onClose={() => setExpandedDayKey(null)}
        />
      )}
    </section>
  );
}
