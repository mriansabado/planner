import { useState } from "react";
import type { FormEvent } from "react";
import { useStore } from "../store/useStore";

type Props = {
  onClose: () => void;
};

export function AddCustomerModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [hours, setHours] = useState("10");
  const [isAdHoc, setIsAdHoc] = useState(false);
  const { addCustomer } = useStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isAdHoc) {
      addCustomer(name.trim(), { isAdHoc: true });
      onClose();
    } else {
      const h = parseFloat(hours);
      if (!isNaN(h) && h > 0) {
        addCustomer(name.trim(), { monthlyHours: h });
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add customer</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              autoFocus
            />
          </label>
          <div className="session-type-toggle">
            <button
              type="button"
              className={!isAdHoc ? "active" : ""}
              onClick={() => setIsAdHoc(false)}
            >
              Hourly commitment
            </button>
            <button
              type="button"
              className={isAdHoc ? "active" : ""}
              onClick={() => setIsAdHoc(true)}
            >
              Ad-hoc
            </button>
          </div>
          {!isAdHoc && (
            <label>
              Monthly hours commitment
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="10"
              />
            </label>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
