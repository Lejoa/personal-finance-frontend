import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/api/categories`;

const makeDto = (id: number, type: 'gasto' | 'ingreso' = 'gasto') => ({
  id,
  name: `Cat ${id}`,
  description: 'desc',
  type,
  createdAt: '2024-05-01T00:00:00Z'
});

describe('CategoryService', () => {
  let service: CategoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CategoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCategories', () => {
    it('should GET and map categories', () => {
      let result: { id: number; type: string }[] | undefined;
      service.getCategories().subscribe(r => result = r);
      http.expectOne(req => req.url === API).flush({ data: [makeDto(1)], total: 1 });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
      expect(result[0].type).toBe('gasto');
    });

    it('should pass type filter', () => {
      service.getCategories({ type: 'ingreso' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('type')).toBe('ingreso');
      req.flush({ data: [], total: 0 });
    });

    it('should pass name filter', () => {
      service.getCategories({ name: 'Comida' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('name')).toBe('Comida');
      req.flush({ data: [], total: 0 });
    });

    it('should update categories$ BehaviorSubject', () => {
      let emitted: { length: number }[] | undefined;
      service.categories$.subscribe(v => emitted = v);

      service.getCategories().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1), makeDto(2)], total: 2 });

      expect(emitted.length).toBe(2);
    });
  });

  describe('getCategoryById', () => {
    it('should GET a single category', () => {
      let result: { id: number } | undefined;
      service.getCategoryById(1).subscribe(r => result = r);
      http.expectOne(`${API}/1`).flush({ category: makeDto(1) });
      expect(result.id).toBe(1);
    });
  });

  describe('createCategory', () => {
    it('should POST and append to categories$', () => {
      service.createCategory({ name: 'Nueva', description: '', type: 'gasto' }).subscribe();
      http.expectOne(r => r.method === 'POST').flush({ message: 'ok', category: makeDto(5) });

      expect(service.getCurrentCategories().length).toBe(1);
      expect(service.getCurrentCategories()[0].id).toBe(5);
    });
  });

  describe('updateCategory', () => {
    it('should PATCH and update categories$ in place', () => {
      // Seed subject with two categories
      service.getCategories().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1), makeDto(2)], total: 2 });

      service.updateCategory(1, { name: 'Editada' }).subscribe();
      http.expectOne(r => r.url === `${API}/1` && r.method === 'PATCH')
        .flush({ message: 'ok', category: { ...makeDto(1), name: 'Editada' } });

      const current = service.getCurrentCategories();
      expect(current.find(c => c.id === 1)!.name).toBe('Editada');
    });

    it('should not modify categories$ when id not found', () => {
      service.getCategories().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(2)], total: 1 });

      service.updateCategory(99, { name: 'X' }).subscribe();
      http.expectOne(r => r.url === `${API}/99`).flush({ message: 'ok', category: makeDto(99) });

      expect(service.getCurrentCategories().length).toBe(1); // unchanged
    });
  });

  describe('deleteCategory', () => {
    it('should DELETE and remove from categories$', () => {
      service.getCategories().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1), makeDto(2)], total: 2 });

      service.deleteCategory(1).subscribe();
      http.expectOne(r => r.url === `${API}/1` && r.method === 'DELETE').flush(null);

      expect(service.getCurrentCategories().find(c => c.id === 1)).toBeUndefined();
      expect(service.getCurrentCategories().length).toBe(1);
    });
  });

  describe('getCurrentCategories', () => {
    it('should return empty array initially', () => {
      expect(service.getCurrentCategories()).toEqual([]);
    });
  });
});
