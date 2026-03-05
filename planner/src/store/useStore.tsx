import { createContext, useContext, useCallback, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Customer, WorkSession, ViewMode } from "../types";

const STORAGE_KEY = "freelance-planner-data";

type StoreData = {
  customers: Customer[];
  workSessions: WorkSession[];
  customerOrder: string[];
};

const DEFAULT_DATA: StoreData = {
  customers: [],
  workSessions: [],
  customerOrder: [],
};

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if ((!parsed.customerOrder || parsed.customerOrder.length === 0) && Array.isArray(parsed.customers)) {
        parsed.customerOrder = parsed.customers.map((c: Customer) => c.id);
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_DATA };
}

function saveData(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const CUSTOMER_COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f43f5e",
];

function nextColor(customers: Customer[]): string {
  const used = new Set(customers.map((c) => c.color));
  return CUSTOMER_COLORS.find((c) => !used.has(c)) ?? CUSTOMER_COLORS[0];
}

type Store = {
  customers: Customer[];
  customerOrder: string[];
  workSessions: WorkSession[];
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  addCustomer: (name: string, options: { monthlyHours?: number; isAdHoc?: boolean }) => void;
  removeCustomer: (id: string) => void;
  reorderCustomers: (fromIndex: number, toIndex: number) => void;
  addWorkSession: (session: Omit<WorkSession, "id">) => void;
  removeWorkSession: (id: string) => void;
  updateWorkSession: (id: string, updates: Partial<Omit<WorkSession, "id">>) => void;
  getSessionsForMonth: (year: number, month: number) => WorkSession[];
  getTotalCommittedHours: (year: number, month: number) => number;
  getTotalLoggedHours: (year: number, month: number) => number;
  getHoursByCustomer: (year: number, month: number) => { customerId: string | null; hours: number }[];
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(loadData);
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addCustomer = useCallback((name: string, options: { monthlyHours?: number; isAdHoc?: boolean }) => {
    setData((prev) => {
      const color = nextColor(prev.customers);
      const isAdHoc = options.isAdHoc ?? false;
      const customer: Customer = {
        id: crypto.randomUUID(),
        name: name.trim(),
        monthlyHours: isAdHoc ? 0 : (options.monthlyHours ?? 0),
        color,
        isAdHoc,
      };
      return {
        ...prev,
        customers: [...prev.customers, customer],
        customerOrder: [...prev.customerOrder, customer.id],
      };
    });
  }, []);

  const removeCustomer = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
      customerOrder: prev.customerOrder.filter((oid) => oid !== id),
      workSessions: prev.workSessions.filter((s) => s.customerId !== id),
    }));
  }, []);

  const reorderCustomers = useCallback((fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const order = [...prev.customerOrder];
      const [removed] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, removed);
      return { ...prev, customerOrder: order };
    });
  }, []);

  const addWorkSession = useCallback((session: Omit<WorkSession, "id">) => {
    const workSession: WorkSession = {
      ...session,
      id: crypto.randomUUID(),
    };
    setData((prev) => ({
      ...prev,
      workSessions: [...prev.workSessions, workSession],
    }));
  }, []);

  const removeWorkSession = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      workSessions: prev.workSessions.filter((s) => s.id !== id),
    }));
  }, []);

  const updateWorkSession = useCallback((id: string, updates: Partial<Omit<WorkSession, "id">>) => {
    setData((prev) => ({
      ...prev,
      workSessions: prev.workSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const getSessionsForMonth = useCallback(
    (year: number, month: number) => {
      return data.workSessions.filter((s) => {
        const [y, m] = s.date.split("-").map(Number);
        return y === year && m === month;
      });
    },
    [data.workSessions]
  );

  const getTotalCommittedHours = useCallback(
    (_year: number, _month: number) => {
      return data.customers.reduce(
        (sum, c) => sum + (c.isAdHoc ? 0 : c.monthlyHours),
        0
      );
    },
    [data.customers]
  );

  const getTotalLoggedHours = useCallback(
    (year: number, month: number) => {
      return getSessionsForMonth(year, month).reduce((sum, s) => sum + s.hours, 0);
    },
    [getSessionsForMonth]
  );

  const getHoursByCustomer = useCallback(
    (year: number, month: number) => {
      const sessions = getSessionsForMonth(year, month);
      const map = new Map<string | null, number>();
      for (const s of sessions) {
        const key = s.isAdHoc ? null : s.customerId;
        map.set(key, (map.get(key) ?? 0) + s.hours);
      }
      return Array.from(map.entries()).map(([customerId, hours]) => ({
        customerId,
        hours,
      }));
    },
    [getSessionsForMonth]
  );

  const orderedCustomers = data.customerOrder
    .map((id) => data.customers.find((c) => c.id === id))
    .filter((c): c is Customer => c != null);

  const value: Store = {
    customers: orderedCustomers,
    customerOrder: data.customerOrder,
    workSessions: data.workSessions,
    viewMode,
    setViewMode,
    addCustomer,
    removeCustomer,
    reorderCustomers,
    addWorkSession,
    removeWorkSession,
    updateWorkSession,
    getSessionsForMonth,
    getTotalCommittedHours,
    getTotalLoggedHours,
    getHoursByCustomer,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
