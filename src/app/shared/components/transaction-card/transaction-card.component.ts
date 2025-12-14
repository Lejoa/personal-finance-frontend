import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Transaction, TransactionCategory } from '../../models/transaction.model';
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

  @Output() transactionUpdated = new EventEmitter<Transaction>();

  isEditing: boolean = false;

  // temporary variables to hold edited values
  editName: string = '';
  editAmount: number = 0;
  editDate: Date = new Date();
  editCategory: TransactionCategory = 'Otros';

  //category options
  categories = new FormControl<string[]>([], { nonNullable: true });
  categoryList: string[] = [
    'Alimentos', 
    'Transporte', 
    'Entretenimiento', 
    'Salud', 
    'Educación', 
    'Otros'
  ];

  startEdit(): void {
    this.isEditing = true;
    // Copy current values to temp values
    this.editName = this.transaction.name;
    this.editAmount = this.transaction.amount;
    this.editDate = this.transaction.date;
    this.editCategory = this.transaction.category;
    // const validCategories = this.editCategory.filter(cat => this.categoryList.includes(cat));
    // this.categories.patchValue(validCategories);
  }

  saveEdit(): void {
    //Pending to save changes to backend or service
    this.isEditing = false;
  }

  cancelEdit(): void {
    //Pending to revert changes with the backend or service
    this.isEditing = false;
    this.categories.reset([]);
  }

}
