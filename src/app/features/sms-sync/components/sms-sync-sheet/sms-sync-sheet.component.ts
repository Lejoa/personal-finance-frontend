import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TransactionType } from '../../../../shared/models/transaction.model';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { CategoryService } from '../../../../shared/services/category.service';
import { SmsService, PendingSmsTransaction } from '../../../../core/services/sms/sms.service';
import { PlatformService } from '../../../../core/services/platform/platform.service';
import { Category } from '../../../../shared/models/category.model';

interface SmsCardState {
  checked: boolean;
  expanded: boolean;
  name: string;
  amount: number;
  date: string;
  transactionType: TransactionType;
  categoryId: number | undefined;
}

export interface SmsRangeOption {
  label: string;
  days: number;
}

@Component({
  selector: 'app-sms-sync-sheet',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './sms-sync-sheet.component.html',
  styleUrl: './sms-sync-sheet.component.scss'
})
export class SmsSyncSheetComponent implements OnChanges {
  @Input() isOpen = false;

  @Output() sheetClosed = new EventEmitter<void>();
  @Output() approved = new EventEmitter<void>();

  private txService      = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private smsService     = inject(SmsService);
  private platform       = inject(PlatformService);

  readonly rangeOptions: SmsRangeOption[] = [
    { label: 'Hace 1 día',  days: 1 },
    { label: 'Hace 3 días', days: 3 },
    { label: 'Hace 7 días', days: 7 },
  ];

  selectedDays = 1;
  transactions: PendingSmsTransaction[] = [];
  cardStates: Map<string, SmsCardState> = new Map();

  isFetching  = false;
  isApproving = false;
  hasFetched  = false;   // true después del primer "Obtener"
  categories: Category[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Resetear estado al abrir
        this.transactions = [];
        this.cardStates   = new Map();
        this.hasFetched   = false;
        this.selectedDays = 1;
        this.categoryService.getCategories().subscribe(cats => {
          this.categories = cats;
        });
      }
    }
  }

  /** Carga los SMS del período seleccionado sin guardar nada en BD. */
  async fetch(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;
    this.transactions = [];
    this.cardStates   = new Map();

    try {
      const parsed = this.platform.isNative
        ? await this.smsService.parseBankSms(this.selectedDays)
        : await this.smsService.triggerMockFetch(this.selectedDays);

      this.transactions = parsed;
      this.buildCardStates();
      this.hasFetched = true;
    } finally {
      this.isFetching = false;
    }
  }

  private buildCardStates(): void {
    const newStates = new Map<string, SmsCardState>();
    for (const tx of this.transactions) {
      newStates.set(tx.note, {
        checked: true,
        expanded: false,
        name: tx.name,
        amount: tx.amount,
        date: this.toDateInputValue(tx.date),
        transactionType: tx.transactionType,
        categoryId: undefined,
      });
    }
    this.cardStates = newStates;
  }

  getState(note: string): SmsCardState {
    return this.cardStates.get(note)!;
  }

  toggleExpand(note: string): void {
    const state = this.cardStates.get(note);
    if (state) state.expanded = !state.expanded;
  }

  toggleCheck(note: string): void {
    const state = this.cardStates.get(note);
    if (state) state.checked = !state.checked;
  }

  get checkedCount(): number {
    let count = 0;
    this.cardStates.forEach(s => { if (s.checked) count++; });
    return count;
  }

  getCategoriesForType(note: string): Category[] {
    const state = this.cardStates.get(note);
    if (!state) return this.categories;
    return this.categories.filter(c => c.type === state.transactionType);
  }

  close(): void {
    this.sheetClosed.emit();
  }

  approve(): void {
    if (this.transactions.length === 0 || this.isApproving) return;
    this.isApproving = true;

    const toCreate   = this.transactions.filter(tx =>  this.cardStates.get(tx.note)?.checked);
    const toDiscard  = this.transactions.filter(tx => !this.cardStates.get(tx.note)?.checked);

    const markAllProcessed = () => {
      [...toCreate, ...toDiscard].forEach(tx => {
        this.smsService.markSmsAsProcessed(tx.smsAddress, tx.note, tx.smsDate);
      });
    };

    if (toCreate.length === 0) {
      markAllProcessed();
      this.isApproving = false;
      this.approved.emit();
      return;
    }

    const creates = toCreate.map(tx => {
      const s = this.cardStates.get(tx.note)!;
      return this.txService.createTransaction({
        name: s.name,
        amount: s.amount,
        date: new Date(s.date + 'T00:00:00'),
        transactionType: s.transactionType,
        categoryId: s.categoryId,
        note: tx.note,
        source: 'sms',
        synchronized: 'done',
      });
    });

    forkJoin(creates).subscribe({
      next: () => {
        markAllProcessed();
        this.isApproving = false;
        this.approved.emit();
      },
      error: () => {
        this.isApproving = false;
      }
    });
  }

  private toDateInputValue(date: Date): string {
    const d = new Date(date);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }
}