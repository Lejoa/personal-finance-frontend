import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatFormFieldModule, 
    MatSelectModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './transaction-card.component.html',
  styleUrl: './transaction-card.component.scss'
})
export class TransactionCardComponent {
  @Input() name!: string;
  @Input() amount!: number;
  @Input() date!: string;
  @Input() category!: string [];

  @Input() editable: boolean = false;

  @Output() transactionUpdated = new EventEmitter<{ 
    name: string;
    amount: number;
    date: string;
    category: string[];
  }>();

  isEditing: boolean = false;

  // temporary variables to hold edited values
  editName: string = '';
  editAmount: number = 0;
  editDate: string = '';
  editCategory: string [] =  [];

  //category options
  categories = new FormControl<string[]>([], { nonNullable: true });
  categoryList: string[] = ['Alimentos', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Otros'];

  startEdit(): void {
    this.isEditing = true;
    // Copy current values to temp values
    this.editName = this.name;
    this.editAmount = this.amount;
    this.editDate = this.date;
    this.editCategory = [...this.category];
    const validCategories = this.editCategory.filter(cat => this.categoryList.includes(cat));
    this.categories.patchValue(validCategories);
  }

  saveEdit(): void {
    const selectedCategories = this.categories.value || [];
    this.transactionUpdated.emit({
      name: this.editName,
      amount: this.editAmount,
      date: this.editDate,
      category: selectedCategories
    });
    this.isEditing = false;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.categories.reset([]);
    // Discard changes by not updating anything
  }

}
