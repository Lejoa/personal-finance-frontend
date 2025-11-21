import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './transaction-card.component.html',
  styleUrl: './transaction-card.component.scss'
})
export class TransactionCardComponent {
  @Input() name!: string;
  @Input() amount!: number;
  @Input() date!: string;
  @Input() category!: string;

  @Input() editable: boolean = false;

  @Output() transactionUpdated = new EventEmitter<{ 
    name: string;
    amount: number;
    date: string;
    category: string;
  }>();

  isEditing: boolean = false;

  // temporary variables to hold edited values
  editName: string = '';
  editAmount: number = 0;
  editDate: string = '';
  editCategory: string = '';

  startEdit(): void {
    this.isEditing = true;
    // Copy current values to temp values
    this.editName = this.name;
    this.editAmount = this.amount;
    this.editDate = this.date;
    this.editCategory = this.category;
  }

  saveEdit(): void {
    this.transactionUpdated.emit({
      name: this.editName,
      amount: this.editAmount,
      date: this.editDate,
      category: this.editCategory
    });
    this.isEditing = false;
  }

  cancelEdit(): void {
    this.isEditing = false;
    // Discard changes by not updating anything
  }

}
