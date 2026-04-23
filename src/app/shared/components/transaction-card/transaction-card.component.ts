import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { Transaction, TransactionAction } from '../../models/transaction.model';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
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
export class TransactionCardComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);

  @Input() transaction!: Transaction;
  @Input() editable: boolean = false;
  @Input() transactionAction!: TransactionAction;
  @Output() transactionUpdated = new EventEmitter<Transaction>();

  isEditing = false;
  isSaving = false;

  editName = '';
  editAmount = 0;
  editDate = '';

  selectedCategory = new FormControl<number | null>(null);
  categories$: Observable<Category[]> = this.categoryService.categories$;

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  private getActionConfig(): ActionConfig {
    const configs: Record<TransactionAction, ActionConfig> = {
      'Edit': {
        cancelText: 'Cancelar',
        modalTitle: 'Editar Transacción',
        buttonTitle: 'Editar',
        cancelAction: () => this.cancelEdit(),
        updateAction: () => this.saveEdit()
      },
      'Sincronize': {
        cancelText: 'Descartar',
        modalTitle: 'Sincronizar Transacción',
        buttonTitle: 'Sincronizar',
        cancelAction: () => this.cancelSyncronization(),
        updateAction: () => this.saveEdit()
      }
    };
    return configs[this.transactionAction];
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

  startEdit(): void {
    this.isEditing = true;
    this.editName = this.transaction.name;
    this.editAmount = this.transaction.amount;
    this.editDate = this.formatDateForInput(this.transaction.date);
    this.selectedCategory.setValue(this.transaction.categoryId ?? null);
  }

  saveEdit(): void {
    if (!this.transaction.id) return;

    this.isSaving = true;
    const updatedData: Partial<Transaction> = {
      name: this.editName,
      amount: this.editAmount,
      date: new Date(this.editDate),
      categoryId: this.selectedCategory.value ?? undefined,
      status: this.transactionAction === 'Sincronize' ? 'done' : undefined
    };

    this.transactionService.updateTransaction(Number(this.transaction.id), updatedData)
      .subscribe({
        next: (updated) => {
          this.transaction = updated;
          this.isSaving = false;
          this.transactionUpdated.emit(updated);
          this.snackBar.open('Transacción actualizada correctamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success']
          });
          this.isEditing = false;
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          this.isSaving = false;
        }
      });
  }

  handleCancel(): void {
    this.getActionConfig().cancelAction();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedCategory.reset();
  }

  private cancelSyncronization(): void {
    if (!this.transaction.id) return;

    this.isSaving = true;
    const updatedData: Partial<Transaction> = {
      status: 'rejected'
    };

    this.transactionService.updateTransaction(Number(this.transaction.id), updatedData)
      .subscribe({
        next: (updated) => {
          this.transaction = updated;
          this.isEditing = false;
          this.isSaving = false;
          this.transactionUpdated.emit(updated);
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          this.isSaving = false;
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
  updateAction: () => void;
}
