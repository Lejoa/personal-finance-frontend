import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { InfoHelpService } from './info-help.service';
import { InfoConcept } from '../../interfaces/info-concept.interface';

const MOCK_CONCEPT: InfoConcept = {
  id: 'gasto',
  title: '¿Qué es? Un Gasto',
  accent: 'red',
  definition: 'Es todo el dinero que sale de tus cuentas.'
};

const MOCK_CONCEPT_FULL: InfoConcept = {
  id: 'ingreso',
  title: '¿Qué es? Un Ingreso',
  accent: 'green',
  definition: 'Es todo el dinero que entra a tus cuentas.',
  example: 'Este mes tus ingresos son <strong>$12.000.000</strong>.',
  exampleProgress: 28,
  exampleStat: '+28% vs. el mes anterior',
  tip: 'Aparta un poco extra en los meses altos.'
};

describe('InfoHelpService', () => {
  let service: InfoHelpService;
  let sub: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfoHelpService);
  });

  afterEach(() => sub?.unsubscribe());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit null initially', () => {
    const emitted: (InfoConcept | null)[] = [];
    sub = service.activeConcept$.subscribe(c => emitted.push(c));
    expect(emitted).toEqual([null]);
  });

  it('should emit the concept when open() is called', () => {
    const emitted: (InfoConcept | null)[] = [];
    sub = service.activeConcept$.subscribe(c => emitted.push(c));

    service.open(MOCK_CONCEPT);

    expect(emitted).toEqual([null, MOCK_CONCEPT]);
  });

  it('should emit null when close() is called after open()', () => {
    const emitted: (InfoConcept | null)[] = [];
    sub = service.activeConcept$.subscribe(c => emitted.push(c));

    service.open(MOCK_CONCEPT);
    service.close();

    expect(emitted).toEqual([null, MOCK_CONCEPT, null]);
  });

  it('should replace the concept when open() is called twice', () => {
    const second: InfoConcept = { ...MOCK_CONCEPT, id: 'second', title: 'Second' };
    const emitted: (InfoConcept | null)[] = [];
    sub = service.activeConcept$.subscribe(c => emitted.push(c));

    service.open(MOCK_CONCEPT);
    service.open(second);

    expect(emitted).toEqual([null, MOCK_CONCEPT, second]);
    expect(emitted[emitted.length - 1]).toEqual(second);
  });

  it('should accept a concept with all optional fields', () => {
    const emitted: (InfoConcept | null)[] = [];
    sub = service.activeConcept$.subscribe(c => emitted.push(c));

    service.open(MOCK_CONCEPT_FULL);

    const received = emitted[1] as InfoConcept;
    expect(received.accent).toBe('green');
    expect(received.example).toBe(MOCK_CONCEPT_FULL.example);
    expect(received.exampleProgress).toBe(28);
    expect(received.exampleStat).toBe('+28% vs. el mes anterior');
    expect(received.tip).toBe(MOCK_CONCEPT_FULL.tip);
  });

  it('should expose activeConcept$ as an observable (not the subject itself)', () => {
    expect(typeof service.activeConcept$.subscribe).toBe('function');
    expect((service as unknown as Record<string, unknown>)['_activeConcept$']).toBeUndefined();
  });
});
