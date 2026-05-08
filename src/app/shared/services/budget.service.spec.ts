import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BudgetService } from './budget.service';
import { Budget } from '../models/budget.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/api/budgets`;

const makeDto = (id: number, startDate = '2026-04-01', endDate = '2026-04-30') => ({
  id,
  startDate,
  endDate,
  categories: [
    { id: 10, categoryId: 1, categoryName: 'Alimentación', categoryDescription: '', amount: 500000 }
  ],
  createdAt: '2026-04-01T00:00:00Z'
});

describe('BudgetService', () => {
  let service: BudgetService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BudgetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBudgets', () => {
    it('should GET and map budget DTOs', () => {
      let result: Budget[] = [];
      service.getBudgets().subscribe(r => result = r);
      http.expectOne(API).flush([makeDto(1)]);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
      expect(result[0].startDate).toEqual(new Date(2026, 3, 1));
    });
  });

  describe('getBudgetById', () => {
    it('should GET a single budget', () => {
      let result: Budget | undefined;
      service.getBudgetById(1).subscribe(r => result = r);
      http.expectOne(`${API}/1`).flush(makeDto(1));
      expect(result!.id).toBe(1);
    });
  });

  describe('createBudget', () => {
    it('should POST and return mapped budget', () => {
      let result: Budget | undefined;
      service.createBudget({ startDate: '2026-04-01', endDate: '2026-04-30', categories: [] }).subscribe(r => result = r);
      http.expectOne(r => r.method === 'POST' && r.url === API).flush(makeDto(5));
      expect(result!.id).toBe(5);
    });
  });

  describe('updateBudget', () => {
    it('should PATCH and return mapped budget', () => {
      let result: Budget | undefined;
      service.updateBudget(1, { categories: [] }).subscribe(r => result = r);
      http.expectOne(r => r.method === 'PATCH' && r.url === `${API}/1`).flush(makeDto(1));
      expect(result!.id).toBe(1);
    });
  });

  describe('deleteBudget', () => {
    it('should DELETE the budget', () => {
      let called = false;
      service.deleteBudget(1).subscribe(() => called = true);
      http.expectOne(r => r.method === 'DELETE' && r.url === `${API}/1`).flush(null);
      expect(called).toBeTrue();
    });
  });

  describe('deleteBudgetCategory', () => {
    it('should DELETE a budget category', () => {
      let called = false;
      service.deleteBudgetCategory(1, 10).subscribe(() => called = true);
      http.expectOne(r => r.method === 'DELETE' && r.url === `${API}/1/categories/10`).flush(null);
      expect(called).toBeTrue();
    });
  });

  describe('updateBudgetCategoryAmount', () => {
    it('should PATCH the budget category amount', () => {
      service.updateBudgetCategoryAmount(1, 10, 600000).subscribe();
      const req = http.expectOne(r => r.url === `${API}/1/categories/10` && r.method === 'PATCH');
      expect(req.request.body).toEqual({ amount: 600000 });
      req.flush(null);
    });
  });

  describe('getBudgetCategoryFeedback', () => {
    it('should POST and extract feedback string', () => {
      let result: string | null | undefined;
      service.getBudgetCategoryFeedback(1, 10).subscribe(r => result = r);
      http.expectOne(r => r.url === `${API}/1/categories/10/feedback` && r.method === 'POST')
        .flush({ feedback: 'Buen control' });
      expect(result).toBe('Buen control');
    });

    it('should return null when feedback is null', () => {
      let result: string | null | undefined;
      service.getBudgetCategoryFeedback(1, 10).subscribe(r => result = r);
      http.expectOne(r => r.url === `${API}/1/categories/10/feedback`).flush({ feedback: null });
      expect(result).toBeNull();
    });
  });

  describe('getBudgetByMonth', () => {
    it('should return the budget matching the given month', () => {
      let result: Budget | null | undefined;
      service.getBudgetByMonth(new Date(2026, 3, 15)).subscribe(r => result = r);
      http.expectOne(API).flush([makeDto(1, '2026-04-01', '2026-04-30')]);
      expect(result!.id).toBe(1);
    });

    it('should return null when no budget matches the month', () => {
      let result: Budget | null | undefined;
      service.getBudgetByMonth(new Date(2026, 5, 1)).subscribe(r => result = r);
      http.expectOne(API).flush([makeDto(1, '2026-04-01', '2026-04-30')]);
      expect(result).toBeNull();
    });
  });

  describe('setBudgetForCategory', () => {
    it('should create a new budget when no existing budget', () => {
      service.setBudgetForCategory(1, 500000, new Date(2026, 3, 1), null).subscribe();
      const req = http.expectOne(r => r.method === 'POST' && r.url === API);
      expect(req.request.body.categories[0].categoryId).toBe(1);
      expect(req.request.body.categories[0].amount).toBe(500000);
      req.flush(makeDto(99));
    });

    it('should update existing budget when one already exists', () => {
      const existing: Budget = {
        id: 1,
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 30),
        items: [],
        categories: [{ id: 10, categoryId: 2, categoryName: 'Transporte', categoryDescription: '', amount: 100000 }]
      };

      service.setBudgetForCategory(3, 200000, new Date(2026, 3, 1), existing).subscribe();
      const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${API}/1`);
      const cats = req.request.body.categories;
      expect(cats.length).toBe(2); // existing + new
      expect(cats[1].categoryId).toBe(3);
      req.flush(makeDto(1));
    });
  });
});
