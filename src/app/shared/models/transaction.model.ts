export interface Transaction {
  id?: string;
  name: string;
  amount: number;
  date: Date;
  category: TransactionCategory;
  status?:  TransactionStatus
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

export type TransactionStatus = 
 | 'pending' 
 | 'synchronized' 
 | 'rejected';

 export type TransactionAction = 'Edit' | 'Sincronize';