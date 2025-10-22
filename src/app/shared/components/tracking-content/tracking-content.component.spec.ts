import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingContentComponent } from './tracking-content.component';

describe('TrackingContentComponent', () => {
  let component: TrackingContentComponent;
  let fixture: ComponentFixture<TrackingContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
