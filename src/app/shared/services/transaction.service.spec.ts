import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/api/transactions`;

const makeDto = (id: number, overrides: Partial<Record<string, unknown>> = {}) => ({
  id,
  name: `Tx ${id}`,
  type: 'gasto',
  amount: 100,
  date: '2024-05-10',
  synchronized: 'done',
  source: 'manual' as const,
  createdAt: '2024-05-10T00:00:00Z',
  ...overrides
});

describe('TransactionService', () => {
  let service: TransactionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(TransactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTransactions', () => {
    it('should GET transactions and map DTOs', () => {
      let result: { id: string; transactionType: string }[] | undefined;
      service.getTransactions().subscribe(r => result = r);

      http.expectOne(req => req.url === API && req.method === 'GET')
        .flush({ data: [makeDto(1)], total: 1 });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].transactionType).toBe('gasto');
    });

    it('should pass type filter as query param', () => {
      service.getTransactions({ type: 'ingreso' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('type')).toBe('ingreso');
      req.flush({ data: [], total: 0 });
    });

    it('should pass sync filter as query param', () => {
      service.getTransactions({ sync: 'pending' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('sync')).toBe('pending');
      req.flush({ data: [], total: 0 });
    });

    it('should pass startDate and endDate filters', () => {
      service.getTransactions({ startDate: '2024-05-01', endDate: '2024-05-31' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('startDate')).toBe('2024-05-01');
      expect(req.request.params.get('endDate')).toBe('2024-05-31');
      req.flush({ data: [], total: 0 });
    });

    it('should pass limit filter', () => {
      service.getTransactions({ limit: 5 }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('limit')).toBe('5');
      req.flush({ data: [], total: 0 });
    });

    it('should update transactions$ BehaviorSubject', () => {
      let emitted: { length: number }[] | undefined;
      service.transactions$.subscribe(v => emitted = v);

      service.getTransactions().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1)], total: 1 });

      expect(emitted.length).toBe(1);
    });
  });

  describe('getLatestTransactions', () => {
    it('should call getTransactions with limit', () => {
      service.getLatestTransactions(3).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('limit')).toBe('3');
      req.flush({ data: [], total: 0 });
    });
  });

  describe('getTransactionsByDateRange', () => {
    it('should format dates and delegate to getTransactions', () => {
      service.getTransactionsByDateRange(new Date('2024-05-01'), new Date('2024-05-31')).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('startDate')).toBe('2024-05-01');
      expect(req.request.params.get('endDate')).toBe('2024-05-31');
      req.flush({ data: [], total: 0 });
    });

    it('should include type when provided', () => {
      service.getTransactionsByDateRange(new Date('2024-05-01'), new Date('2024-05-31'), 'gasto').subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('type')).toBe('gasto');
      req.flush({ data: [], total: 0 });
    });
  });

  describe('getTransactionsQuiet', () => {
    it('should GET without updating BehaviorSubject', () => {
      let subjectEmitted = 0;
      service.transactions$.subscribe(() => subjectEmitted++);
      const initialCount = subjectEmitted;

      service.getTransactionsQuiet({ type: 'gasto' }).subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1)], total: 1 });

      expect(subjectEmitted).toBe(initialCount); // no new emission
    });
  });

  describe('getTransactionById', () => {
    it('should GET a single transaction by id', () => {
      let result: { id: string } | undefined;
      service.getTransactionById(1).subscribe(r => result = r);

      http.expectOne(`${API}/1`).flush({ transaction: makeDto(1) });

      expect(result.id).toBe('1');
    });
  });

  describe('getTransactionsUnsynced', () => {
    it('should call getTransactions with sync=pending', () => {
      service.getTransactionsUnsynced().subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('sync')).toBe('pending');
      req.flush({ data: [], total: 0 });
    });
  });

  describe('createTransaction', () => {
    it('should POST and return mapped transaction', () => {
      let result: { id: string; name: string } | undefined;
      service.createTransaction({ name: 'Compra', amount: 50, transactionType: 'gasto', date: new Date('2024-05-10') })
        .subscribe(r => result = r);

      const req = http.expectOne(r => r.url === API && r.method === 'POST');
      req.flush({ message: 'ok', transaction: makeDto(99, { name: 'Compra' }) });

      expect(result.id).toBe('99');
      expect(result.name).toBe('Compra');
    });

    it('should prepend to transactions$ and emit transactionChanged$', () => {
      let changed = false;
      service.transactionChanged$.subscribe(() => changed = true);

      service.createTransaction({ name: 'X', amount: 10, transactionType: 'gasto', date: new Date() }).subscribe();
      http.expectOne(r => r.method === 'POST').flush({ message: 'ok', transaction: makeDto(1) });

      expect(service.getCurrentTransactions().length).toBe(1);
      expect(changed).toBeTrue();
    });

    it('should map ingreso type correctly', () => {
      let result: { transactionType: string } | undefined;
      service.createTransaction({ name: 'Ingreso', amount: 1000, transactionType: 'ingreso', date: new Date() })
        .subscribe(r => result = r);
      http.expectOne(r => r.method === 'POST').flush({ message: 'ok', transaction: makeDto(2, { type: 'ingreso' }) });
      expect(result.transactionType).toBe('ingreso');
    });
  });

  describe('updateTransaction', () => {
    it('should PATCH and return mapped transaction', () => {
      let result: { name: string } | undefined;
      service.updateTransaction(1, { name: 'Updated' }).subscribe(r => result = r);

      http.expectOne(r => r.url === `${API}/1` && r.method === 'PATCH')
        .flush({ message: 'ok', transaction: makeDto(1, { name: 'Updated' }) });

      expect(result.name).toBe('Updated');
    });

    it('should update the item in transactions$ when it exists', () => {
      // seed the subject with an existing transaction
      service.getTransactions().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1)], total: 1 });

      service.updateTransaction(1, { name: 'Changed' }).subscribe();
      http.expectOne(r => r.url === `${API}/1`).flush({ message: 'ok', transaction: makeDto(1, { name: 'Changed' }) });

      const current = service.getCurrentTransactions();
      expect(current[0].name).toBe('Changed');
    });

    it('should emit transactionChanged$ on update', () => {
      let changed = false;
      service.transactionChanged$.subscribe(() => changed = true);

      service.updateTransaction(1, {}).subscribe();
      http.expectOne(r => r.url === `${API}/1`).flush({ message: 'ok', transaction: makeDto(1) });

      expect(changed).toBeTrue();
    });
  });

  describe('deleteTransaction', () => {
    it('should DELETE and remove from transactions$', () => {
      service.getTransactions().subscribe();
      http.expectOne(r => r.url === API).flush({ data: [makeDto(1), makeDto(2)], total: 2 });

      service.deleteTransaction(1).subscribe();
      http.expectOne(r => r.url === `${API}/1` && r.method === 'DELETE').flush(null);

      expect(service.getCurrentTransactions().find(t => t.id === '1')).toBeUndefined();
      expect(service.getCurrentTransactions().length).toBe(1);
    });

    it('should emit transactionChanged$ on delete', () => {
      let changed = false;
      service.transactionChanged$.subscribe(() => changed = true);

      service.deleteTransaction(5).subscribe();
      http.expectOne(r => r.url === `${API}/5`).flush(null);

      expect(changed).toBeTrue();
    });
  });

  describe('getFeedback', () => {
    it('should POST to feedback endpoint', () => {
      let result: { feedback: string } | undefined;
      service.getFeedback(1).subscribe(r => result = r);
      http.expectOne(r => r.url === `${API}/1/feedback` && r.method === 'POST')
        .flush({ feedback: 'Buen gasto' });
      expect(result.feedback).toBe('Buen gasto');
    });
  });

  describe('getCurrentTransactions', () => {
    it('should return the current value of transactions$', () => {
      expect(service.getCurrentTransactions()).toEqual([]);
    });
  });

  describe('approveAllPending', () => {
    it('should PATCH each transaction with synchronized=done', () => {
      const txs = [
        { id: '1', name: 'A', amount: 10, date: new Date(), transactionType: 'gasto' as const },
        { id: '2', name: 'B', amount: 20, date: new Date(), transactionType: 'gasto' as const }
      ];

      service.approveAllPending(txs).subscribe();

      const req1 = http.expectOne(r => r.url === `${API}/1`);
      const req2 = http.expectOne(r => r.url === `${API}/2`);
      expect(req1.request.body['synchronized']).toBe('done');
      expect(req2.request.body['synchronized']).toBe('done');
      req1.flush({ message: 'ok', transaction: makeDto(1) });
      req2.flush({ message: 'ok', transaction: makeDto(2) });
    });
  });

  describe('batchApprove', () => {
    it('should PATCH approved ids as done and others as rejected', () => {
      const txs = [
        { id: '1', name: 'A', amount: 10, date: new Date(), transactionType: 'gasto' as const },
        { id: '2', name: 'B', amount: 20, date: new Date(), transactionType: 'gasto' as const }
      ];
      const approvedIds = new Set(['1']);

      service.batchApprove(txs, approvedIds).subscribe();

      const req1 = http.expectOne(r => r.url === `${API}/1`);
      const req2 = http.expectOne(r => r.url === `${API}/2`);
      expect(req1.request.body['synchronized']).toBe('done');
      expect(req2.request.body['synchronized']).toBe('rejected');
      req1.flush({ message: 'ok', transaction: makeDto(1) });
      req2.flush({ message: 'ok', transaction: makeDto(2) });
    });
  });
});
