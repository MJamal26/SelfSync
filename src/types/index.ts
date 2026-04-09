export interface Task {
  id: string;
  title: string;
  time: string; // e.g. "08:00 AM"
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  completedDates: string[]; // ISO date strings e.g. "2026-03-18"
  streak: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  date: string; // ISO date "YYYY-MM-DD"
  time: string; // display string e.g. "08:30 AM"
}

export type ExpenseCategory = 'food' | 'travel' | 'personal';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // "YYYY-MM-DD"
  month: string; // "YYYY-MM"
}
