import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { InfoSheetComponent } from './info-sheet.component';
import { InfoHelpService } from '../../../services/info-help/info-help.service';
import { InfoConcept } from '../../../interfaces/info-concept.interface';

const MOCK: InfoConcept = {
  id: 'gasto',
  title: '¿Qué es? Un Gasto',
  accent: 'red',
  definition: 'Es todo el dinero que sale.',
  tip: 'Mini tip.'
};

const MOCK_WITH_EXAMPLE: InfoConcept = { ...MOCK, example: 'Ejemplo concreto.' };

describe('InfoSheetComponent', () => {
  let fixture: ComponentFixture<InfoSheetComponent>;
  let activeConcept$: BehaviorSubject<InfoConcept | null>;
  let infoHelpSpy: jasmine.SpyObj<InfoHelpService>;

  beforeEach(async () => {
    activeConcept$ = new BehaviorSubject<InfoConcept | null>(null);
    infoHelpSpy = jasmine.createSpyObj('InfoHelpService', ['open', 'close'], {
      activeConcept$: activeConcept$.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [InfoSheetComponent],
      providers: [{ provide: InfoHelpService, useValue: infoHelpSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(InfoSheetComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not have info-sheet--open class when concept is null', () => {
    const sheet = fixture.nativeElement.querySelector('.info-sheet') as HTMLElement;
    expect(sheet.classList.contains('info-sheet--open')).toBeFalse();
  });

  it('should add info-sheet--open class when a concept is emitted', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const sheet = fixture.nativeElement.querySelector('.info-sheet') as HTMLElement;
    expect(sheet.classList.contains('info-sheet--open')).toBeTrue();
  });

  it('should render the concept title', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.info-sheet__title') as HTMLElement;
    expect(title.textContent?.trim()).toBe(MOCK.title);
  });

  it('should render the definition layer', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const def = fixture.nativeElement.querySelector('.info-sheet__layer--def') as HTMLElement;
    expect(def.textContent).toContain(MOCK.definition);
  });

  it('should render the tip layer when tip is provided', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const tip = fixture.nativeElement.querySelector('.info-sheet__layer--tip') as HTMLElement;
    expect(tip).toBeTruthy();
    expect(tip.textContent).toContain(MOCK.tip);
  });

  it('should not render the example layer when example is absent', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const ex = fixture.nativeElement.querySelector('.info-sheet__layer--ex');
    expect(ex).toBeNull();
  });

  it('should render the example layer when example is provided', () => {
    activeConcept$.next(MOCK_WITH_EXAMPLE);
    fixture.detectChanges();
    const ex = fixture.nativeElement.querySelector('.info-sheet__layer--ex') as HTMLElement;
    expect(ex).toBeTruthy();
    expect(ex.textContent).toContain(MOCK_WITH_EXAMPLE.example);
  });

  it('should call close() when ✕ button is clicked', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector('.info-sheet__close') as HTMLButtonElement;
    closeBtn.click();
    expect(infoHelpSpy.close).toHaveBeenCalledTimes(1);
  });

  it('should call close() when scrim is clicked', () => {
    activeConcept$.next(MOCK);
    fixture.detectChanges();
    const scrim = fixture.nativeElement.querySelector('.info-scrim') as HTMLElement;
    scrim.click();
    expect(infoHelpSpy.close).toHaveBeenCalledTimes(1);
  });

  it('should apply info-sheet--green for green accent', () => {
    const greenConcept: InfoConcept = { ...MOCK, accent: 'green' };
    activeConcept$.next(greenConcept);
    fixture.detectChanges();
    const sheet = fixture.nativeElement.querySelector('.info-sheet') as HTMLElement;
    expect(sheet.classList.contains('info-sheet--green')).toBeTrue();
  });
});
