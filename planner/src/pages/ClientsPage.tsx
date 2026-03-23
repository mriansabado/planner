import { useState } from "react";
import { Link } from "react-router-dom";
import { AddCustomerModal } from "../components/AddCustomerModal";
import { useStore } from "../store/useStore";

export function ClientsPage() {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const { customers, workSessions, removeCustomer, getTasksForCustomer } = useStore();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete client "${name}"? This will also remove all their work sessions.`)) {
      removeCustomer(id);
    }
  };

  const totalHoursByCustomer = new Map<string, number>();
  const sessionCountByCustomer = new Map<string, number>();
  for (const s of workSessions) {
    if (s.customerId && !s.isAdHoc) {
      totalHoursByCustomer.set(
        s.customerId,
        (totalHoursByCustomer.get(s.customerId) ?? 0) + s.hours
      );
      sessionCountByCustomer.set(
        s.customerId,
        (sessionCountByCustomer.get(s.customerId) ?? 0) + 1
      );
    }
  }

  return (
    <div className="page clients-page">
      <div className="page-header">
        <h2>Clients</h2>
        <button className="btn-primary" onClick={() => setShowAddCustomer(true)}>
          + Add customer
        </button>
      </div>

      {customers.length === 0 ? (
        <p className="clients-page-empty">No clients yet. Add one to get started.</p>
      ) : (
        <ul className="all-clients-list clients-page-list">
          {customers.map((c) => {
            const totalHours = totalHoursByCustomer.get(c.id) ?? 0;
            const sessionCount = sessionCountByCustomer.get(c.id) ?? 0;
            const taskCount = getTasksForCustomer(c.id).length;
            return (
              <li key={c.id} className="all-clients-item">
                <div
                  className="all-clients-color"
                  style={{ backgroundColor: c.color }}
                />
                <Link to={`/clients/${c.id}`} className="all-clients-info all-clients-link">
                  <span className="all-clients-name">{c.name}</span>
                  <span className="all-clients-meta">
                    {c.isAdHoc ? "Ad-hoc" : `${c.monthlyHours}h/mo`}
                    {" · "}
                    {totalHours.toFixed(1)}h total
                    {sessionCount > 0 && ` · ${sessionCount} session${sessionCount !== 1 ? "s" : ""}`}
                    {taskCount > 0 && ` · ${taskCount} task${taskCount !== 1 ? "s" : ""}`}
                  </span>
                </Link>
                <Link
                  to={`/clients/${c.id}`}
                  className="btn-tasks"
                  title="View client page"
                >
                  View →
                </Link>
                <button
                  type="button"
                  className="btn-delete-client"
                  onClick={() => handleDelete(c.id, c.name)}
                  title="Delete client"
                >
                  🗑 Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showAddCustomer && (
        <AddCustomerModal onClose={() => setShowAddCustomer(false)} />
      )}
    </div>
  );
}
