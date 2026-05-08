import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CsvExportService } from './csv-export.service';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiUrl}/api/transactions/export/csv`;

describe('CsvExportService', () => {
  let service: CsvExportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CsvExportService);
    http = TestBed.inject(HttpTestingController);

    // Stub DOM APIs used by triggerDownload
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL');
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportCsv', () => {
    const csvBlob = new Blob(['id,name'], { type: 'text/csv' });

    it('should GET with no query params when params are empty', () => {
      service.exportCsv({}).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(csvBlob, { headers: { 'Content-Disposition': 'attachment; filename="export.csv"' } });
    });

    it('should include type param when provided', () => {
      service.exportCsv({ type: 'gasto' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('type')).toBe('gasto');
      req.flush(csvBlob);
    });

    it('should include startDate and endDate when provided', () => {
      service.exportCsv({ startDate: '2024-01-01', endDate: '2024-01-31' }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('startDate')).toBe('2024-01-01');
      expect(req.request.params.get('endDate')).toBe('2024-01-31');
      req.flush(csvBlob);
    });

    it('should include categoryId when provided', () => {
      service.exportCsv({ categoryId: 3 }).subscribe();
      const req = http.expectOne(r => r.url === API);
      expect(req.request.params.get('categoryId')).toBe('3');
      req.flush(csvBlob);
    });

    it('should use filename from Content-Disposition header', () => {
      const anchorSpy = jasmine.createSpyObj('a', ['click']);
      anchorSpy.href = '';
      anchorSpy.download = '';
      anchorSpy.style = { display: '' };
      spyOn(document, 'createElement').and.returnValue(anchorSpy);

      service.exportCsv({}).subscribe();
      http.expectOne(r => r.url === API).flush(csvBlob, {
        headers: { 'Content-Disposition': 'attachment; filename="mis-transacciones.csv"' }
      });

      expect(anchorSpy.download).toBe('mis-transacciones.csv');
    });

    it('should use default filename when Content-Disposition is absent', () => {
      const anchorSpy = jasmine.createSpyObj('a', ['click']);
      anchorSpy.href = '';
      anchorSpy.download = '';
      anchorSpy.style = { display: '' };
      spyOn(document, 'createElement').and.returnValue(anchorSpy);

      service.exportCsv({}).subscribe();
      http.expectOne(r => r.url === API).flush(csvBlob);

      expect(anchorSpy.download).toBe('transacciones.csv');
    });
  });
});
