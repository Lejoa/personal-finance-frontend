import { TestBed } from '@angular/core/testing';
import { NormalizeDatesService } from './normalize-dates.service';

describe('NormalizeDatesService', () => {
  let service: NormalizeDatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NormalizeDatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseLocalDate', () => {
    it('should parse YYYY-MM-DD string as local midnight', () => {
      const date = service.parseLocalDate('2024-05-10');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(4); // May = index 4
      expect(date.getDate()).toBe(10);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should parse beginning of year', () => {
      const date = service.parseLocalDate('2026-01-01');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('should parse end of year', () => {
      const date = service.parseLocalDate('2025-12-31');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });
  });

  describe('normalizeDate', () => {
    it('should set hours to midnight', () => {
      const input = new Date(2024, 4, 10, 15, 30, 45);
      const result = service.normalizeDate(input);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should preserve the date part', () => {
      const input = new Date(2024, 4, 10, 22, 0, 0);
      const result = service.normalizeDate(input);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(10);
    });

    it('should not mutate the original date', () => {
      const input = new Date(2024, 4, 10, 12, 0, 0);
      service.normalizeDate(input);
      expect(input.getHours()).toBe(12); // unchanged
    });
  });
});
