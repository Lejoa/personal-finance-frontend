export interface Transaction {
  id?: string;
  name: string;
  amount: number;
  date: Date;
  category: TransactionCategory;
  status?: 'pending' | 'synchronized' | 'rejected';
  transactionType: TransactionType;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionCategory = 
  | 'Viajes'
  | 'Comida'
  | 'Transporte'
  | 'Entretenimiento'
  | 'Servicios'
  | 'Salud'
  | 'Educación'
  | 'Trabajo'
  | 'Freelance'
  | 'Otros';

  export type TransactionType = 'expenses' | 'income';
