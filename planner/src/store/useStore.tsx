import { createContext, useContext, useCallback, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Customer, WorkSession, Task, ViewMode } from "../types";

const STORAGE_KEY = "freelance-planner-data";

type StoreData = {
  customers: Customer[];
  workSessions: WorkSession[];
  tasks: Task[];
  customerOrder: string[];
};

const DEFAULT_DATA: StoreData = {
  customers: [],
  workSessions: [],
  tasks: [],
  customerOrder: [],
};

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreData>;
      const data: StoreData = {
        ...DEFAULT_DATA,
        ...parsed,
        customers: Array.isArray(parsed.customers) ? parsed.customers : DEFAULT_DATA.customers,
        workSessions: Array.isArray(parsed.workSessions) ? parsed.workSessions : DEFAULT_DATA.workSessions,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_DATA.tasks,
        customerOrder: Array.isArray(parsed.customerOrder) ? parsed.customerOrder : DEFAULT_DATA.customerOrder,
      };
      if (data.customerOrder.length === 0 && data.customers.length > 0) {
        data.customerOrder = data.customers.map((c) => c.id);
      }
      // Migrate weekly tasks: ensure dayOfWeek is set (0=Sun if missing)
      data.tasks = data.tasks.map((t) => {
        if (t.isWeekly && (t.dayOfWeek == null || t.dayOfWeek === undefined)) {
          return { ...t, dayOfWeek: 0 };
        }
        return t;
      });
      return data;
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
  tasks: Task[];
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  addCustomer: (name: string, options: { monthlyHours?: number; isAdHoc?: boolean }) => void;
  removeCustomer: (id: string) => void;
  reorderCustomers: (fromIndex: number, toIndex: number) => void;
  addWorkSession: (session: Omit<WorkSession, "id">) => void;
  removeWorkSession: (id: string) => void;
  updateWorkSession: (id: string, updates: Partial<Omit<WorkSession, "id">>) => void;
  addTask: (task: Omit<Task, "id" | "createdAt"> & { done?: boolean }) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, "text" | "done" | "isWeekly" | "dayOfWeek" | "customerId" | "estimatedHours">>) => void;
  setTaskCompletionForDate: (taskId: string, date: string, done: boolean) => void;
  isTaskDoneForDate: (task: Task, date: string) => boolean;
  getTasksForCustomer: (customerId: string) => Task[];
  getTasksForDay: (date: Date) => Task[];
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
      tasks: prev.tasks.filter((t) => t.customerId !== id),
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

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt"> & { done?: boolean }) => {
    const isWeekly = task.isWeekly ?? false;
    const newTask: Task = {
      ...task,
      done: task.done ?? false,
      isWeekly,
      dayOfWeek: isWeekly ? (task.dayOfWeek ?? 0) : undefined,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Pick<Task, "text" | "done" | "isWeekly" | "dayOfWeek" | "customerId" | "estimatedHours">>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const setTaskCompletionForDate = useCallback((taskId: string, date: string, done: boolean) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const dates = t.completedDates ?? [];
        const hasDate = dates.includes(date);
        if (done && !hasDate) {
          return { ...t, completedDates: [...dates, date].sort() };
        }
        if (!done && hasDate) {
          return { ...t, completedDates: dates.filter((d) => d !== date) };
        }
        return t;
      }),
    }));
  }, []);

  const isTaskDoneForDate = useCallback((task: Task, date: string) => {
    if (task.isWeekly && task.completedDates) {
      return task.completedDates.includes(date);
    }
    return task.done;
  }, []);

  const getTasksForCustomer = useCallback(
    (customerId: string) => {
      return data.tasks
        .filter((t) => t.customerId === customerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [data.tasks]
  );

  const getTasksForDay = useCallback(
    (date: Date) => {
      const targetDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      return data.tasks.filter((t) => {
        if (!t.isWeekly) return false;
        const taskDay = t.dayOfWeek ?? 0; // fallback for older tasks
        return Number(taskDay) === targetDay;
      });
    },
    [data.tasks]
  );

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
    tasks: data.tasks,
    viewMode,
    setViewMode,
    addCustomer,
    removeCustomer,
    reorderCustomers,
    addWorkSession,
    removeWorkSession,
    updateWorkSession,
    addTask,
    removeTask,
    updateTask,
    setTaskCompletionForDate,
    isTaskDoneForDate,
    getTasksForCustomer,
    getTasksForDay,
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
