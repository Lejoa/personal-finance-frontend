import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Transaction, TransactionAction, TransactionCategory } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
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
export class TransactionCardComponent {

  @Input() transaction!: Transaction;
  
  @Input() editable: boolean = false;

  @Input() transactionAction!: TransactionAction;

  @Output() transactionUpdated = new EventEmitter<Transaction>();

  isEditing: boolean = false;

  editName: string = '';
  editAmount: number = 0;
  editDate: Date = new Date();
  editCategory: TransactionCategory = 'Otros';

  categories = new FormControl<string[]>([], { nonNullable: true });
  categoryList: string[] = [
    'Alimentos',
    'Transporte',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Otros'
  ];

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
    this.categories.reset([]);
  }

  private cancelSyncronization(): void {
    this.isEditing = false;
    this.categories.reset([]);
  }
}

interface ActionConfig {
  cancelText: string;
  modalTitle: string;
  buttonTitle: string;
  cancelAction: () => void;
}
