export type Customer = {
  id: string;
  name: string;
  monthlyHours: number;
  color: string;
  isAdHoc?: boolean; // no commitment, just track hours
};

export type WorkSession = {
  id: string;
  customerId: string | null; // null = ad-hoc
  date: string; // ISO date YYYY-MM-DD
  hours: number;
  notes: string;
  isAdHoc: boolean;
};

export type Task = {
  id: string;
  customerId: string;
  text: string;
  done: boolean;
  isWeekly?: boolean;
  dayOfWeek?: number; // 0=Sun, 1=Mon, ..., 6=Sat
  completedDates?: string[]; // ISO dates "YYYY-MM-DD" - per-occurrence completion for weekly tasks
  estimatedHours?: number; // optional planned/estimated time
  createdAt: string; // ISO string
};

export type ViewMode = "monthly" | "weekly" | "daily";
