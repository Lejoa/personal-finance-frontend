import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../shared/services/category.service';
import { CsvExportService } from '../../services/csv-export.service';
import { Category } from '../../../../shared/models/category.model';

@Component({
  selector: 'app-csv-export',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './csv-export.component.html',
  styleUrl: './csv-export.component.scss'
})
export class CsvExportComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private csvExportService = inject(CsvExportService);
  private destroyRef = inject(DestroyRef);

  isExportPanelOpen = false;
  selectedType: 'ingreso' | 'gasto' | 'todos' = 'todos';
  selectedCategoryId: number | '' = '';
  startDate = '';
  endDate = '';
  categories: Category[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => { this.categories = cats; });
  }

  toggleExportPanel(): void {
    this.isExportPanelOpen = !this.isExportPanelOpen;
    if (!this.isExportPanelOpen) {
      this.resetForm();
    }
  }

  getCategoriesForType(): Category[] {
    if (this.selectedType === 'todos') return this.categories;
    return this.categories.filter(c => c.type === this.selectedType);
  }

  onTypeChange(): void {
    this.selectedCategoryId = '';
  }

  exportCsv(): void {
    if (this.isLoading) return;

    const params: Parameters<CsvExportService['exportCsv']>[0] = {};
    if (this.selectedType !== 'todos') params.type = this.selectedType;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;
    if (this.selectedCategoryId !== '') params.categoryId = Number(this.selectedCategoryId);

    this.isLoading = true;
    this.errorMessage = null;

    this.csvExportService.exportCsv(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.isLoading = false; },
        error: () => {
          this.errorMessage = 'No se pudo generar el archivo. Intenta de nuevo.';
          this.isLoading = false;
        }
      });
  }

  private resetForm(): void {
    this.selectedType = 'todos';
    this.selectedCategoryId = '';
    this.startDate = '';
    this.endDate = '';
    this.errorMessage = null;
    this.isLoading = false;
  }
}
