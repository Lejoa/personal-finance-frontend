import { Component } from '@angular/core';
import { CategorySectionComponent } from '../category-section/category-section.component';

@Component({
  selector: 'app-category-content',
  standalone: true,
  imports: [CategorySectionComponent],
  templateUrl: './category-content.component.html',
  styleUrl: './category-content.component.scss'
})
export class CategoryContentComponent {}