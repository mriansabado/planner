import { useStore } from "../store/useStore";
import type { ViewMode } from "../types";

export function ViewToggle() {
  const { viewMode, setViewMode } = useStore();

  const options: { value: ViewMode; label: string }[] = [
    { value: "monthly", label: "Month" },
    { value: "weekly", label: "Week" },
    { value: "daily", label: "Day" },
  ];

  return (
    <div className="view-toggle">
      {options.map(({ value, label }) => (
        <button
          key={value}
          className={viewMode === value ? "active" : ""}
          onClick={() => setViewMode(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
