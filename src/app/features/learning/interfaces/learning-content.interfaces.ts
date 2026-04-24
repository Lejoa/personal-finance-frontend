export interface FinancialTip {
  id?: number;
  title: string;
  shortDescription?: string;
  description: string;
  imageSrc?: string;
  author?: string;
  authorTitle?: string;
  reason?: string;
}

export interface FinancialAnalysis {
  id: number;
  period: string;
  checkpoint: 'mid' | 'end';
  content: string;
  isRead: boolean;
  generatedAt: string;
}