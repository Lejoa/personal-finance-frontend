import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningContentComponent } from './learning-content.component';

describe('LearningContentComponent', () => {
  let component: LearningContentComponent;
  let fixture: ComponentFixture<LearningContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
