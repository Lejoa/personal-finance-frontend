export type TransactionType = 'expenses' | 'income';

export interface Transaction {
  name: string;
  amount: number;
  date: string;
  category: string[];
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}