
export interface Task {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  startTime: string; // HH:mm
  icon: string;
  date: string; // YYYY-MM-DD
  color: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export interface MonthData {
  month: number;
  year: number;
  days: DayData[];
}
