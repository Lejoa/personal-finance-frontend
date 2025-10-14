import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialTipsComponent } from './financial-tips.component';

describe('FinancialTipsComponent', () => {
  let component: FinancialTipsComponent;
  let fixture: ComponentFixture<FinancialTipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialTipsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialTipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
