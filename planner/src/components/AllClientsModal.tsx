import { useStore } from "../store/useStore";

type Props = {
  onClose: () => void;
};

export function AllClientsModal({ onClose }: Props) {
  const { customers, workSessions, removeCustomer } = useStore();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete client "${name}"? This will also remove all their work sessions.`)) {
      removeCustomer(id);
    }
  };

  const totalHoursByCustomer = new Map<string, number>();
  for (const s of workSessions) {
    if (s.customerId && !s.isAdHoc) {
      totalHoursByCustomer.set(
        s.customerId,
        (totalHoursByCustomer.get(s.customerId) ?? 0) + s.hours
      );
    }
  }

  const sessionCountByCustomer = new Map<string, number>();
  for (const s of workSessions) {
    if (s.customerId && !s.isAdHoc) {
      sessionCountByCustomer.set(
        s.customerId,
        (sessionCountByCustomer.get(s.customerId) ?? 0) + 1
      );
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-all-clients" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">All clients</h2>
        {customers.length === 0 ? (
          <p className="empty-state">No clients yet. Add one to get started.</p>
        ) : (
          <ul className="all-clients-list">
            {customers.map((c) => {
              const totalHours = totalHoursByCustomer.get(c.id) ?? 0;
              const sessionCount = sessionCountByCustomer.get(c.id) ?? 0;
              return (
                <li key={c.id} className="all-clients-item">
                  <div
                    className="all-clients-color"
                    style={{ backgroundColor: c.color }}
                  />
                  <div className="all-clients-info">
                    <span className="all-clients-name">{c.name}</span>
                    <span className="all-clients-meta">
                      {c.isAdHoc ? "Ad-hoc" : `${c.monthlyHours}h/mo`}
                      {" · "}
                      {totalHours.toFixed(1)}h total
                      {sessionCount > 0 && ` · ${sessionCount} session${sessionCount !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-delete-client"
                    onClick={() => handleDelete(c.id, c.name)}
                    title="Delete client"
                  >
                    🗑 Delete client
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
