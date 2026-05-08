import { TestBed } from '@angular/core/testing';
import { SmsParserService } from './sms-parser.service';

const TS = 1715299200000; // 2024-05-10 00:00:00 UTC — fallback timestamp

describe('SmsParserService', () => {
  let service: SmsParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmsParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parse — gasto patterns', () => {
    it('should parse "Compraste" SMS as gasto', () => {
      const body = 'Compraste COP40.900,00 en EXITO el 10/05/2024 a las 15:30';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('gasto');
      expect(result!.amount).toBe(40900);
      expect(result!.merchant).toContain('EXITO');
    });

    it('should parse "Compraste" with dollar-sign amount', () => {
      const body = 'Compraste $2,500.00 en TIENDA el 14/03/2026';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('gasto');
      expect(result!.amount).toBeCloseTo(2500, 0);
    });

    it('should parse "Pagaste" SMS as gasto', () => {
      const body = 'Pagaste $200,000.00 a EMPRESA desde tu producto el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('gasto');
      expect(result!.amount).toBeCloseTo(200000, 0);
      expect(result!.merchant).toContain('EMPRESA');
    });

    it('should parse "Retiraste" SMS as gasto', () => {
      const body = 'Retiraste COP500.000,00 en CAJERO ATM el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('gasto');
      expect(result!.amount).toBe(500000);
    });

    it('should parse "Transferiste" SMS as gasto', () => {
      const body = 'Transferiste $150,000.00 desde tu cuenta 123 a la cuenta 456 el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('gasto');
      expect(result!.amount).toBeCloseTo(150000, 0);
    });

    it('should parse "Transferiste por QR" SMS as gasto', () => {
      const body = 'Transferiste $50,000.00 por QR desde tu cuenta 123 a la cuenta 789 el 11/05/2024';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('gasto');
    });
  });

  describe('parse — ingreso patterns', () => {
    it('should parse "Recibiste" SMS as ingreso', () => {
      const body = 'Recibiste $300,000.00 de PERSONA el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('ingreso');
      expect(result!.amount).toBeCloseTo(300000, 0);
    });

    it('should parse "Abono" SMS as ingreso', () => {
      const body = 'Abono de $1,000,000.00 de SALARIO en cuenta el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('ingreso');
    });
  });

  describe('parse — date extraction', () => {
    it('should extract date in YYYY/MM/DD HH:MM format', () => {
      const body = 'Compraste $1,000.00 en TIENDA el 2026/03/11 15:03';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.date.getFullYear()).toBe(2026);
      expect(result!.date.getMonth()).toBe(2); // March = index 2
      expect(result!.date.getDate()).toBe(11);
    });

    it('should extract date in DD/MM/YYYY a las HH:MM format', () => {
      const body = 'Compraste $1,000.00 en TIENDA el 07/03/2026 a las 14:27';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.date.getFullYear()).toBe(2026);
      expect(result!.date.getDate()).toBe(7);
    });

    it('should extract date in DD/MM/YYYY HH:MM:SS format', () => {
      const body = 'Compraste $1,000.00 en TIENDA 04/03/2026 10:11:14';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.date.getFullYear()).toBe(2026);
    });

    it('should extract date in DD/MM/YYYY plain format', () => {
      const body = 'Compraste $1,000.00 en TIENDA el 14/03/2026';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.date.getFullYear()).toBe(2026);
      expect(result!.date.getDate()).toBe(14);
    });

    it('should fall back to smsTimestamp when no date pattern matches', () => {
      const body = 'Compraste $1,000.00 en TIENDA sin fecha';
      const result = service.parse(body, TS);
      expect(result).not.toBeNull();
      expect(result!.date.getTime()).toBe(TS);
    });
  });

  describe('parse — amount normalization', () => {
    it('should parse Colombian format: punto=miles, coma=decimal (COP40.900,00)', () => {
      const body = 'Compraste COP40.900,00 en TIENDA el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result!.amount).toBe(40900);
    });

    it('should parse international format: coma=miles, punto=decimal ($2,500.00)', () => {
      const body = 'Compraste $2,500.00 en TIENDA el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result!.amount).toBeCloseTo(2500, 0);
    });

    it('should parse large amount with multiple thousand separators', () => {
      const body = 'Recibiste $1,200,000.00 de SALARIO el 10/05/2024';
      const result = service.parse(body, TS);
      expect(result!.amount).toBeCloseTo(1200000, 0);
    });
  });

  describe('parse — unrecognized SMS', () => {
    it('should return null for non-bank SMS', () => {
      const result = service.parse('Su paquete ha sido enviado. Tracking: 1234XYZ', TS);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(service.parse('', TS)).toBeNull();
    });
  });

  describe('KNOWN_BANK_SENDERS', () => {
    it('should include major Colombian banks', () => {
      expect(service.KNOWN_BANK_SENDERS).toContain('Bancolombia');
      expect(service.KNOWN_BANK_SENDERS).toContain('Nequi');
      expect(service.KNOWN_BANK_SENDERS).toContain('Davivienda');
    });
  });
});
