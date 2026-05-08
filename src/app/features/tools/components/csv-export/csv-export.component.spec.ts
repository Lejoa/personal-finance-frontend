import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CsvExportComponent } from './csv-export.component';
import { CategoryService } from '../../../../shared/services/category.service';
import { CsvExportService } from '../../services/csv-export.service';
import { Category } from '../../../../shared/models/category.model';

const makeCategory = (id: number, type: 'ingreso' | 'gasto'): Category => ({
  id,
  name: `Cat ${id}`,
  description: '',
  type
});

describe('CsvExportComponent', () => {
  let component: CsvExportComponent;
  let fixture: ComponentFixture<CsvExportComponent>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let csvExportServiceSpy: jasmine.SpyObj<CsvExportService>;

  beforeEach(async () => {
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories']);
    csvExportServiceSpy = jasmine.createSpyObj('CsvExportService', ['exportCsv']);

    categoryServiceSpy.getCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CsvExportComponent],
      providers: [
        { provide: CategoryService,   useValue: categoryServiceSpy },
        { provide: CsvExportService,  useValue: csvExportServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CsvExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load all categories on init', () => {
      const cats = [makeCategory(1, 'gasto')];
      categoryServiceSpy.getCategories.and.returnValue(of(cats));
      component.ngOnInit();
      expect(component.categories).toEqual(cats);
    });
  });

  describe('toggleExportPanel', () => {
    it('should open the panel', () => {
      component.toggleExportPanel();
      expect(component.isExportPanelOpen).toBeTrue();
    });

    it('should close the panel and reset the form', () => {
      component.isExportPanelOpen = true;
      component.selectedType = 'ingreso';
      component.startDate = '2024-01-01';
      component.toggleExportPanel();
      expect(component.isExportPanelOpen).toBeFalse();
      expect(component.selectedType).toBe('todos');
      expect(component.startDate).toBe('');
    });
  });

  describe('getCategoriesForType', () => {
    beforeEach(() => {
      component.categories = [
        makeCategory(1, 'gasto'),
        makeCategory(2, 'ingreso'),
        makeCategory(3, 'gasto')
      ];
    });

    it('should return all categories when type is "todos"', () => {
      component.selectedType = 'todos';
      expect(component.getCategoriesForType().length).toBe(3);
    });

    it('should return only gasto categories', () => {
      component.selectedType = 'gasto';
      expect(component.getCategoriesForType().length).toBe(2);
    });

    it('should return only ingreso categories', () => {
      component.selectedType = 'ingreso';
      expect(component.getCategoriesForType().length).toBe(1);
    });
  });

  describe('onTypeChange', () => {
    it('should reset selectedCategoryId to empty', () => {
      component.selectedCategoryId = 5;
      component.onTypeChange();
      expect(component.selectedCategoryId).toEqual('' as any);
    });
  });

  describe('exportCsv', () => {
    it('should do nothing when already loading', () => {
      component.isLoading = true;
      component.exportCsv();
      expect(csvExportServiceSpy.exportCsv).not.toHaveBeenCalled();
    });

    it('should call exportCsv and set isLoading to false on success', () => {
      csvExportServiceSpy.exportCsv.and.returnValue(of(void 0));
      component.exportCsv();
      expect(csvExportServiceSpy.exportCsv).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should set errorMessage and isLoading to false on error', () => {
      csvExportServiceSpy.exportCsv.and.returnValue(throwError(() => new Error()));
      component.exportCsv();
      expect(component.errorMessage).toBe('No se pudo generar el archivo. Intenta de nuevo.');
      expect(component.isLoading).toBeFalse();
    });

    it('should not include type param when selectedType is "todos"', () => {
      csvExportServiceSpy.exportCsv.and.returnValue(of(void 0));
      component.selectedType = 'todos';
      component.exportCsv();
      const [params] = csvExportServiceSpy.exportCsv.calls.mostRecent().args;
      expect(params.type).toBeUndefined();
    });

    it('should include type param when selectedType is not "todos"', () => {
      csvExportServiceSpy.exportCsv.and.returnValue(of(void 0));
      component.selectedType = 'gasto';
      component.exportCsv();
      const [params] = csvExportServiceSpy.exportCsv.calls.mostRecent().args;
      expect(params.type).toBe('gasto');
    });
  });
});
