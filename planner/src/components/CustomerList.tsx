import { useState } from "react";
import { useStore } from "../store/useStore";
import { CustomerNotesModal } from "./CustomerNotesModal";

type Props = {
  year: number;
  month: number;
  selectedCustomerIds: Set<string>;
  onToggleCustomer: (id: string) => void;
};

export function CustomerList({ year, month, selectedCustomerIds, onToggleCustomer }: Props) {
  const [notesCustomerId, setNotesCustomerId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { customers, getSessionsForMonth, reorderCustomers } = useStore();
  const sessions = getSessionsForMonth(year, month);

  const hoursByCustomer = new Map<string, number>();
  for (const s of sessions) {
    if (s.customerId && !s.isAdHoc) {
      hoursByCustomer.set(
        s.customerId,
        (hoursByCustomer.get(s.customerId) ?? 0) + s.hours
      );
    }
  }
  const adHocHours = sessions
    .filter((s) => s.isAdHoc)
    .reduce((sum, s) => sum + s.hours, 0);

  if (customers.length === 0) {
    return (
      <section className="customer-list">
        <h3 className="section-title">Clients & commitments</h3>
        <p className="empty-state">
          No customers yet. Add one to start tracking your commitments.
        </p>
      </section>
    );
  }

  return (
    <section className="customer-list">
      <h3 className="section-title">Clients & commitments</h3>
      <div className="customer-cards">
        {customers.map((c, index) => {
          const logged = hoursByCustomer.get(c.id) ?? 0;
          const hasCommitment = !c.isAdHoc && c.monthlyHours > 0;
          const pct = hasCommitment ? Math.min(100, (logged / c.monthlyHours) * 100) : 0;
          const met = hasCommitment && logged >= c.monthlyHours;

          return (
            <div
              key={c.id}
              className={`customer-card ${c.isAdHoc ? "ad-hoc-customer" : ""} ${draggedIndex === index ? "dragging" : ""} ${selectedCustomerIds.has(c.id) ? "selected" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const src = e.dataTransfer.getData("text/plain");
                const fromIndex = src ? parseInt(src, 10) : null;
                if (fromIndex !== null && !isNaN(fromIndex) && fromIndex !== index) {
                  reorderCustomers(fromIndex, index);
                }
                setDraggedIndex(null);
              }}
            >
              <div
                className="customer-drag-handle"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(index));
                  e.dataTransfer.effectAllowed = "move";
                  setDraggedIndex(index);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                title="Drag to reorder"
              >
                ⋮⋮
              </div>
              <div
                className="customer-color-bar"
                style={{ backgroundColor: c.color }}
              />
              <div
                className="customer-info"
                onClick={() => onToggleCustomer(c.id)}
              >
                <span className="customer-name">{c.name}</span>
                <span className="customer-hours">
                  {logged.toFixed(1)}h
                  {hasCommitment ? ` / ${c.monthlyHours}h` : c.isAdHoc ? " (ad-hoc)" : ""}
                </span>
                <button
                  className="btn-icon notes"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotesCustomerId(c.id);
                  }}
                  title="View notes summary"
                >
                  📋
                </button>
              </div>
              {hasCommitment && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: met ? "var(--success)" : c.color,
                  }}
                />
              </div>
              )}
            </div>
          );
        })}
        {adHocHours > 0 && (
          <div className="customer-card ad-hoc">
            <div className="customer-color-bar" style={{ backgroundColor: "var(--coral)" }} />
            <div className="customer-info">
              <span className="customer-name">Ad-hoc</span>
              <span className="customer-hours">{adHocHours.toFixed(1)}h</span>
            </div>
          </div>
        )}
      </div>

      {notesCustomerId && (
        <CustomerNotesModal
          customerId={notesCustomerId}
          customerName={customers.find((c) => c.id === notesCustomerId)?.name ?? ""}
          year={year}
          month={month}
          onClose={() => setNotesCustomerId(null)}
        />
      )}
    </section>
  );
}
