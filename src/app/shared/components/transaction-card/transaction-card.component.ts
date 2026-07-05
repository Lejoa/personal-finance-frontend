import { Component, EventEmitter, Input, Output, inject, DestroyRef } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { Transaction, TransactionAction, TransactionType } from '../../models/transaction.model';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [
    AsyncPipe,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './transaction-card.component.html',
  styleUrl: './transaction-card.component.scss'
})
export class TransactionCardComponent {
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  @Input() transaction!: Transaction;
  @Input() editable = false;
  @Input() transactionAction!: TransactionAction;
  @Output() transactionUpdated = new EventEmitter<Transaction>();
  @Output() transactionDeleted = new EventEmitter<string>();

  isEditing = false;
  isSaving = false;
  isConfirmingDelete = false;
  isDeleting = false;

  editName = '';
  editAmount = 0;
  editDate = '';

  selectedTransactionType = new FormControl<TransactionType>('gasto');
  selectedCategory = new FormControl<number | null>(null);

  filteredCategories$: Observable<Category[]> = combineLatest([
    this.categoryService.categories$,
    this.selectedTransactionType.valueChanges.pipe(startWith(this.selectedTransactionType.value))
  ]).pipe(
    map(([categories, type]) => categories.filter(c => c.type === type))
  );

  private actionConfig: ActionConfig | null = null;

  private getActionConfig(): ActionConfig {
    if (!this.actionConfig) {
      const configs: Record<TransactionAction, ActionConfig> = {
        'Edit': {
          cancelText: 'Cancelar',
          modalTitle: 'Editar Transacción',
          buttonTitle: 'Editar',
          cancelAction: () => this.cancelEdit(),
        },
        'Sincronize': {
          cancelText: 'Descartar',
          modalTitle: 'Sincronizar Transacción',
          buttonTitle: 'Sincronizar',
          cancelAction: () => this.cancelSynchronization(),
        }
      };
      this.actionConfig = configs[this.transactionAction];
    }
    return this.actionConfig;
  }

  get cancelButtonText(): string {
    return this.getActionConfig().cancelText;
  }

  get modalTitle(): string {
    return this.getActionConfig().modalTitle;
  }

  get buttonTitle(): string {
    return this.getActionConfig().buttonTitle;
  }

  get saveButtonLabel(): string {
    return this.isSaving ? 'Guardando...' : 'Guardar';
  }

  startEdit(): void {
    this.isEditing = true;
    this.editName = this.transaction.name;
    this.editAmount = this.transaction.amount;
    this.editDate = this.formatDateForInput(this.transaction.date);
    this.selectedTransactionType.setValue(this.transaction.transactionType ?? 'gasto');
    this.selectedCategory.setValue(this.transaction.categoryId ?? null);
  }

  saveEdit(): void {
    if (!this.transaction.id) return;

    this.isSaving = true;
    const updatedData: Partial<Transaction> = {
      name: this.editName,
      amount: this.editAmount,
      date: new Date(this.editDate),
      transactionType: this.selectedTransactionType.value ?? 'gasto',
      categoryId: this.selectedCategory.value ?? undefined,
      status: this.transactionAction === 'Sincronize' ? 'done' : undefined
    };

    this.transactionService.updateTransaction(Number(this.transaction.id), updatedData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.transaction = updated;
          this.isSaving = false;
          this.isEditing = false;
          this.transactionUpdated.emit(updated);
          this.snackBar.open('Transacción actualizada correctamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success']
          });
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('No se pudo actualizar la transacción. Intenta de nuevo.', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-error']
          });
        }
      });
  }

  handleCancel(): void {
    this.getActionConfig().cancelAction();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedCategory.reset();
    this.selectedTransactionType.setValue('gasto');
  }

  private cancelSynchronization(): void {
    if (!this.transaction.id) return;

    this.isSaving = true;
    this.transactionService.updateTransaction(Number(this.transaction.id), { status: 'rejected' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.transaction = updated;
          this.isEditing = false;
          this.isSaving = false;
          this.transactionUpdated.emit(updated);
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('No se pudo descartar la transacción. Intenta de nuevo.', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-error']
          });
        }
      });
  }

  confirmDelete(): void {
    this.isConfirmingDelete = true;
  }

  cancelDelete(): void {
    this.isConfirmingDelete = false;
  }

  deleteTransaction(): void {
    if (!this.transaction.id) return;

    this.isDeleting = true;
    this.transactionService.deleteTransaction(Number(this.transaction.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.isConfirmingDelete = false;
          this.transactionDeleted.emit(this.transaction.id);
          this.snackBar.open('Transacción eliminada correctamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success']
          });
        },
        error: () => {
          this.isDeleting = false;
          this.snackBar.open('No se pudo eliminar la transacción. Intenta de nuevo.', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-error']
          });
        }
      });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

interface ActionConfig {
  cancelText: string;
  modalTitle: string;
  buttonTitle: string;
  cancelAction: () => void;
}
