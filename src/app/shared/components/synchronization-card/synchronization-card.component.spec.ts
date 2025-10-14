import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SynchronizationCardComponent } from './synchronization-card.component';

describe('SynchronizationCardComponent', () => {
  let component: SynchronizationCardComponent;
  let fixture: ComponentFixture<SynchronizationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SynchronizationCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SynchronizationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
