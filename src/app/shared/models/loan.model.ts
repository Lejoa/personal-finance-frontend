export type LoanFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface LoanResult {
  amount: number;
  annualRate: number;
  termMonths: number;
  numberOfPayments: number;
  extraPayment: number;
  frequency: LoanFrequency;
  periodicPayment: number;
  totalInterest: number;
  totalPaid: number;
}

export interface AmortizationRow {
  number: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface SavedLoanCalculation {
  id: number;
  name: string;
  amount: number;
  annualRate: number;
  termMonths: number;
  extraPayment: number;
  frequency: LoanFrequency;
  periodicPayment: number;
  totalInterest: number;
  totalPaid: number;
  createdAt: string;
}

export interface CreateLoanCalculationRequest {
  name: string;
  amount: number;
  annualRate: number;
  termMonths: number;
  extraPayment: number;
  frequency: LoanFrequency;
  periodicPayment: number;
  totalInterest: number;
  totalPaid: number;
}
