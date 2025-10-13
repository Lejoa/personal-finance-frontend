import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterTabsComponent } from './footer-tabs.component';

describe('FooterTabsComponent', () => {
  let component: FooterTabsComponent;
  let fixture: ComponentFixture<FooterTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
