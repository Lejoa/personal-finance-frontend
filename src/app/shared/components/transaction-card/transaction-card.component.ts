import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Observable } from 'rxjs';
import { Transaction, TransactionAction, TransactionCategory } from '../../models/transaction.model';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    MatFormFieldModule,
    MatSelectModule,
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

  @Input() transaction!: Transaction;
  @Input() editable: boolean = false;
  @Input() transactionAction!: TransactionAction;
  @Output() transactionUpdated = new EventEmitter<Transaction>();

  isEditing: boolean = false;

  editName: string = '';
  editAmount: number = 0;
  editDate: Date = new Date();
  editCategory: TransactionCategory = 'Otros';

  selectedCategory = new FormControl<number | null>(null);
  categories$: Observable<Category[]> = this.categoryService.categories$;

  ngOnInit(): void {
    this.loadCategories();
  }

  /** Carga las categorías desde el backend */
  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  /** Obtiene la configuración de textos y acciones según el tipo de transacción */
  private getActionConfig(): ActionConfig {
    const configs: Record<TransactionAction, ActionConfig> = {
      'Edit': {
        cancelText: 'Cancelar',
        modalTitle: 'Editar Transacción',
        buttonTitle: 'Editar',
        cancelAction: () => this.cancelEdit()
      },
      'Sincronize': {
        cancelText: 'Descartar',
        modalTitle: 'Sincronizar Transacción',
        buttonTitle: 'Sincronizar',
        cancelAction: () => this.cancelSyncronization()
      }
    };

    return configs[this.transactionAction];
  }

  /** Texto dinámico del botón de cancelar */
  get cancelButtonText(): string {
    return this.getActionConfig().cancelText;
  }

  /** Título dinámico del modal */
  get modalTitle(): string {
    return this.getActionConfig().modalTitle;
  }

  /** Título dinámico del botón principal */
  get buttonTitle(): string {
    return this.getActionConfig().buttonTitle;
  }

  startEdit(): void {
    this.isEditing = true;
    this.editName = this.transaction.name;
    this.editAmount = this.transaction.amount;
    this.editDate = this.transaction.date;
    this.editCategory = this.transaction.category;
  }

  saveEdit(): void {
    this.isEditing = false;
  }

  /** Ejecuta la acción de cancelar según el tipo de transacción */
  handleCancel(): void {
    const config = this.getActionConfig();
    config.cancelAction();
  }

  private cancelEdit(): void {
    this.isEditing = false;
    this.selectedCategory.reset();
  }

  private cancelSyncronization(): void {
    this.isEditing = false;
    this.selectedCategory.reset();
  }
}

interface ActionConfig {
  cancelText: string;
  modalTitle: string;
  buttonTitle: string;
  cancelAction: () => void;
}
