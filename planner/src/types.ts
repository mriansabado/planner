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

export type ViewMode = "monthly" | "weekly" | "daily";
