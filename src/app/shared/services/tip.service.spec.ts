import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TipService } from './tip.service';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/api/tips`;

const makeDto = (id: number) => ({
  id,
  title: `Tip ${id}`,
  author: 'Autor',
  authorTitle: 'Experto',
  shortDescription: 'Breve',
  description: 'Descripción completa',
  imageSrc: null,
  tags: null,
  reason: 'Relevante para ti',
  createdAt: '2024-05-01T00:00:00Z'
});

describe('TipService', () => {
  let service: TipService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TipService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRecommendedTips', () => {
    it('should GET recommended tips and map DTOs', () => {
      let result: { id: number; title: string; authorTitle?: string; reason?: string }[] | undefined;
      service.getRecommendedTips().subscribe(r => result = r);
      http.expectOne(`${API}/recommended`).flush({ data: [makeDto(1)], total: 1 });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('Tip 1');
      expect(result[0].authorTitle).toBe('Experto');
      expect(result[0].reason).toBe('Relevante para ti');
    });

    it('should map null fields to undefined', () => {
      let result: { imageSrc?: string; authorTitle?: string; reason?: string }[] | undefined;
      service.getRecommendedTips().subscribe(r => result = r);
      http.expectOne(`${API}/recommended`).flush({
        data: [{ ...makeDto(2), imageSrc: null, authorTitle: null, reason: null }],
        total: 1
      });
      expect(result[0].imageSrc).toBeUndefined();
      expect(result[0].authorTitle).toBeUndefined();
      expect(result[0].reason).toBeUndefined();
    });
  });

  describe('getAllTips', () => {
    it('should GET all tips', () => {
      let result: { length: number }[] | undefined;
      service.getAllTips().subscribe(r => result = r);
      http.expectOne(API).flush({ data: [makeDto(1), makeDto(2)], total: 2 });
      expect(result.length).toBe(2);
    });
  });
});
