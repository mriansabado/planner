import { useState } from "react";
import { format } from "date-fns";
import { AddWorkSessionModal } from "../components/AddWorkSessionModal";
import { CustomerList } from "../components/CustomerList";
import { PlannerView } from "../components/PlannerView";
import { HoursChart } from "../components/HoursChart";

export function PlannerPage() {
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionDate, setSessionDate] = useState<string | undefined>();
  const [focusDate, setFocusDate] = useState(new Date());
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  const year = focusDate.getFullYear();
  const month = focusDate.getMonth() + 1;

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <aside className="sidebar">
        <CustomerList
          year={year}
          month={month}
          selectedCustomerIds={selectedCustomerIds}
          onToggleCustomer={toggleCustomerSelection}
        />
        <HoursChart
          year={year}
          month={month}
          selectedCustomerIds={selectedCustomerIds}
        />
      </aside>
      <div className="content">
        <div className="page-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setSessionDate(undefined);
              setShowAddSession(true);
            }}
          >
            + Log work
          </button>
        </div>
        <PlannerView
          focusDate={focusDate}
          onFocusDateChange={setFocusDate}
          onDayClick={(date) => {
            setSessionDate(date);
            setShowAddSession(true);
          }}
        />
      </div>

      {showAddSession && (
        <AddWorkSessionModal
          onClose={() => setShowAddSession(false)}
          preselectedDate={sessionDate ?? format(focusDate, "yyyy-MM-dd")}
        />
      )}
    </>
  );
}
