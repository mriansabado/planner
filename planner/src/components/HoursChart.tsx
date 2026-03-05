import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useStore } from "../store/useStore";

type Props = {
  year: number;
  month: number;
};

export function HoursChart({ year, month }: Props) {
  const {
    customers,
    getTotalCommittedHours,
    getTotalLoggedHours,
    getHoursByCustomer,
  } = useStore();

  const committed = getTotalCommittedHours(year, month);
  const logged = getTotalLoggedHours(year, month);
  const byCustomer = getHoursByCustomer(year, month);

  const chartData = customers.map((c) => {
    const entry = byCustomer.find((b) => b.customerId === c.id);
    return {
      name: c.name,
      hours: entry?.hours ?? 0,
      commitment: c.isAdHoc ? 0 : c.monthlyHours,
      fill: c.color,
    };
  });

  const adHocEntry = byCustomer.find((b) => b.customerId === null);
  if (adHocEntry && adHocEntry.hours > 0) {
    chartData.push({
      name: "Ad-hoc",
      hours: adHocEntry.hours,
      commitment: 0,
      fill: "var(--coral)",
    });
  }

  const met = committed > 0 && logged >= committed;
  const pct = committed > 0 ? Math.min(100, (logged / committed) * 100) : 0;

  return (
    <section className="hours-chart">
      <h3 className="section-title">Hours overview</h3>
      <div className="chart-summary">
        <div className="summary-card">
          <span className="summary-label">Logged</span>
          <span className="summary-value">{logged.toFixed(1)}h</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Committed</span>
          <span className="summary-value">{committed.toFixed(1)}h</span>
        </div>
        <div className={`summary-card status ${met ? "met" : "pending"}`}>
          <span className="summary-label">Status</span>
          <span className="summary-value">{met ? "✓ Met" : `${pct.toFixed(0)}%`}</span>
        </div>
      </div>
      <div className="chart-progress">
        <div className="progress-track">
          <div
            className="progress-fill-bar"
            style={{
              width: `${pct}%`,
              backgroundColor: met ? "var(--success)" : "var(--accent)",
            }}
          />
        </div>
        <span className="progress-label">
          {logged.toFixed(1)} / {committed} hours
        </span>
      </div>
      {chartData.length > 0 && (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={(value) => [`${value ?? 0}h`, "Hours"]}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
              {chartData.some((d) => d.commitment > 0) && (
                <Bar
                  dataKey="commitment"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeDasharray="4 4"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
          {chartData.some((d) => d.commitment > 0) && (
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot filled" /> Logged
              </span>
              <span className="legend-item">
                <span className="legend-dot dashed" /> Commitment
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
