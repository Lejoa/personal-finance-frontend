import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoanCalculatorService } from './loan-calculator.service';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiUrl}/api/loan-calculations`;

const mockCalc = {
  id: 1,
  name: 'Préstamo casa',
  amount: 10000000,
  annualRate: 12,
  termMonths: 24,
  extraPayment: 0,
  frequency: 'monthly',
  periodicPayment: 470735,
  totalInterest: 1297640,
  totalPaid: 11297640,
  createdAt: '2024-05-01T00:00:00Z'
};

describe('LoanCalculatorService', () => {
  let service: LoanCalculatorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(LoanCalculatorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCalculations', () => {
    it('should GET and return the data array', () => {
      let result: { id: number }[] | undefined;
      service.getCalculations().subscribe(r => result = r);
      http.expectOne(API).flush({ data: [mockCalc], total: 1 });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('saveCalculation', () => {
    it('should POST and return the calculation', () => {
      let result: { id: number } | undefined;
      const req = { name: 'Test', amount: 5000000, annualRate: 10, termMonths: 12, extraPayment: 0, frequency: 'monthly' as const, periodicPayment: 439583, totalInterest: 274996, totalPaid: 5274996 };
      service.saveCalculation(req).subscribe(r => result = r);
      http.expectOne(r => r.method === 'POST' && r.url === API)
        .flush({ message: 'ok', calculation: mockCalc });
      expect(result.id).toBe(1);
    });
  });

  describe('deleteCalculation', () => {
    it('should DELETE the calculation by id', () => {
      let called = false;
      service.deleteCalculation(1).subscribe(() => called = true);
      http.expectOne(r => r.method === 'DELETE' && r.url === `${API}/1`).flush(null);
      expect(called).toBeTrue();
    });
  });
});
