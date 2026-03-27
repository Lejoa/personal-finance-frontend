export interface Transaction {
  id?: string;
  name: string;
  amount: number;
  date: Date;
  category?: string;
  categoryId?: number;
  categoryName?: string;
  note?: string;
  status?: TransactionStatus;
  transactionType: TransactionType;
  synchronized?: 'pending' | 'done' | 'rejected';
  /** Origen de la transacción: 'manual' (entrada manual) o 'sms' (detectada de SMS bancario) */
  source?: 'manual' | 'sms';
  createdAt?: Date;
  updatedAt?: Date;
}


export type TransactionType = 'ingreso' | 'gasto';

export type TransactionStatus = 'pending' | 'done' | 'rejected';

 export type TransactionAction = 'Edit' | 'Sincronize';