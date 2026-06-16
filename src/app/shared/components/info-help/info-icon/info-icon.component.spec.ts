import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoIconComponent } from './info-icon.component';
import { InfoHelpService } from '../../../services/info-help/info-help.service';
import { InfoConcept } from '../../../interfaces/info-concept.interface';

const MOCK_CONCEPT: InfoConcept = {
  id: 'gasto',
  title: '¿Qué es? Un Gasto',
  accent: 'red',
  definition: 'Es todo el dinero que sale de tus cuentas.'
};

describe('InfoIconComponent', () => {
  let component: InfoIconComponent;
  let fixture: ComponentFixture<InfoIconComponent>;
  let infoHelpSpy: jasmine.SpyObj<InfoHelpService>;

  beforeEach(async () => {
    infoHelpSpy = jasmine.createSpyObj('InfoHelpService', ['open', 'close']);

    await TestBed.configureTestingModule({
      imports: [InfoIconComponent],
      providers: [{ provide: InfoHelpService, useValue: infoHelpSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(InfoIconComponent);
    component = fixture.componentInstance;
    component.concept = MOCK_CONCEPT;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a button with the correct aria-label', () => {
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('¿Qué significa? Toca para aprender');
  });

  it('should call infoHelpService.open with the concept on click', () => {
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(infoHelpSpy.open).toHaveBeenCalledTimes(1);
    expect(infoHelpSpy.open).toHaveBeenCalledWith(MOCK_CONCEPT);
  });

  it('should call stopPropagation on click', () => {
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const event = new MouseEvent('click', { bubbles: true });
    spyOn(event, 'stopPropagation');
    btn.dispatchEvent(event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should not have info-icon--light class by default', () => {
    const btn = fixture.nativeElement.querySelector('.info-icon') as HTMLElement;
    expect(btn.classList.contains('info-icon--light')).toBeFalse();
  });

  it('should apply info-icon--light class when tone is light', () => {
    component.tone = 'light';
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.info-icon') as HTMLElement;
    expect(btn.classList.contains('info-icon--light')).toBeTrue();
  });
});
