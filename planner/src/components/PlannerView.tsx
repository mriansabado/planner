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

type Props = {
  focusDate: Date;
  onFocusDateChange: (d: Date) => void;
  onDayClick?: (date: string) => void;
};

export function PlannerView({ focusDate, onFocusDateChange, onDayClick }: Props) {
  const { viewMode, workSessions, customers } = useStore();

  const getSessionsForDay = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    return workSessions.filter((s) => s.date === key);
  };

  const getTotalHoursForDay = (d: Date) => {
    return getSessionsForDay(d).reduce((sum, s) => sum + s.hours, 0);
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
                {h}
              </div>
            ))}
          </div>
        )}

        <div className="planner-days">
          {days.map((d) => {
            const sessions = getSessionsForDay(d);
            const totalHours = getTotalHoursForDay(d);
            const inMonth = viewMode !== "monthly" || isSameMonth(d, focusDate);

            return (
              <div
                key={d.toISOString()}
                className={`planner-day ${!inMonth ? "other-month" : ""} ${onDayClick ? "clickable" : ""} ${isToday(d) ? "today" : ""}`}
                onClick={() => onDayClick?.(format(d, "yyyy-MM-dd"))}
              >
                <div className="day-num">{format(d, "d")}</div>
                <div className="day-sessions">
                  {sessions.map((s) => {
                    const customer = s.customerId
                      ? customerMap.get(s.customerId)
                      : null;
                    const color = s.isAdHoc ? "var(--coral)" : customer?.color ?? "var(--accent)";
                    return (
                      <div
                        key={s.id}
                        className="session-chip"
                        style={{ borderLeftColor: color }}
                        title={`${s.hours}h${s.notes ? `: ${s.notes}` : ""}`}
                      >
                        <span className="chip-hours">{s.hours}h</span>
                        {s.notes && (
                          <span className="chip-notes">{s.notes}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {totalHours > 0 && (
                  <div className="day-total">{totalHours.toFixed(1)}h</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
