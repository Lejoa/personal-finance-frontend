import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FinancialTipsComponent } from './financial-tips.component';

describe('FinancialTipsComponent', () => {
  let component: FinancialTipsComponent;
  let fixture: ComponentFixture<FinancialTipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialTipsComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialTipsComponent);
    component = fixture.componentInstance;
    component.title = 'Tip de prueba';
    component.description = 'Descripción de prueba';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('emitExpand', () => {
    it('should emit on the expand EventEmitter', () => {
      const emitSpy = spyOn(component.expand, 'emit');
      component.emitExpand();
      expect(emitSpy).toHaveBeenCalledOnceWith();
    });

    it('should emit each time it is called', () => {
      const emitSpy = spyOn(component.expand, 'emit');
      component.emitExpand();
      component.emitExpand();
      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });
});
