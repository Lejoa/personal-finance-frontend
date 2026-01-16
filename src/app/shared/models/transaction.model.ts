export interface Transaction {
  id?: string;
  name: string;
  amount: number;
  date: Date;
  category?: string;
  categoryId?: number;
  categoryName?: string;
  status?: TransactionStatus;
  transactionType: TransactionType;
  createdAt?: Date;
  updatedAt?: Date;
}


export type TransactionType = 'ingreso' | 'gasto';

export type TransactionStatus = 
 | 'pending' 
 | 'synchronized' 
 | 'rejected';

 export type TransactionAction = 'Edit' | 'Sincronize';