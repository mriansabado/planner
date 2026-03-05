import { useState } from "react";
import { format } from "date-fns";
import "./App.css";
import { StoreProvider } from "./store/useStore";
import { ViewToggle } from "./components/ViewToggle";
import { ThemeToggle } from "./components/ThemeToggle";
import { AddCustomerModal } from "./components/AddCustomerModal";
import { AddWorkSessionModal } from "./components/AddWorkSessionModal";
import { CustomerList } from "./components/CustomerList";
import { PlannerView } from "./components/PlannerView";
import { HoursChart } from "./components/HoursChart";

function AppContent() {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionDate, setSessionDate] = useState<string | undefined>();
  const [focusDate, setFocusDate] = useState(new Date());

  const year = focusDate.getFullYear();
  const month = focusDate.getMonth() + 1;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <h1>Freelance Planner</h1>
          <p className="tagline">Track hours. Meet commitments. Stay organized.</p>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <ViewToggle />
          <button className="btn-secondary" onClick={() => { setSessionDate(undefined); setShowAddSession(true); }}>
            + Log work
          </button>
          <button className="btn-primary" onClick={() => setShowAddCustomer(true)}>
            + Add customer
          </button>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          <CustomerList year={year} month={month} />
          <HoursChart year={year} month={month} />
        </aside>
        <div className="content">
          <PlannerView
            focusDate={focusDate}
            onFocusDateChange={setFocusDate}
            onDayClick={(date) => { setSessionDate(date); setShowAddSession(true); }}
          />
        </div>
      </main>

      {showAddCustomer && (
        <AddCustomerModal onClose={() => setShowAddCustomer(false)} />
      )}
      {showAddSession && (
        <AddWorkSessionModal
          onClose={() => setShowAddSession(false)}
          preselectedDate={sessionDate ?? format(focusDate, "yyyy-MM-dd")}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
