import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FooterTabsComponent } from './footer-tabs.component';
import { TabService } from '../../../core/services/tab/tab.service';

describe('FooterTabsComponent', () => {
  let component: FooterTabsComponent;
  let fixture: ComponentFixture<FooterTabsComponent>;
  let tabServiceSpy: jasmine.SpyObj<TabService>;
  let activeTabSubject: BehaviorSubject<string>;

  beforeEach(async () => {
    activeTabSubject = new BehaviorSubject<string>('Home');
    tabServiceSpy = jasmine.createSpyObj('TabService', ['setActiveTab'], {
      activeTab$: activeTabSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [FooterTabsComponent],
      providers: [
        { provide: TabService, useValue: tabServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should sync activeTab with TabService activeTab$', () => {
      activeTabSubject.next('Tracking');
      expect(component.activeTab).toBe('Tracking');
    });

    it('should initialize activeTab with the current value of activeTab$', () => {
      expect(component.activeTab).toBe('Home');
    });
  });

  describe('onTabChange', () => {
    it('should update activeTab', () => {
      component.onTabChange('Aprende');
      expect(component.activeTab).toBe('Aprende');
    });

    it('should call tabService.setActiveTab with the selected tab', () => {
      component.onTabChange('Tracking');
      expect(tabServiceSpy.setActiveTab).toHaveBeenCalledOnceWith('Tracking');
    });

    it('should emit the selected tab via tabChange', () => {
      const emitted: string[] = [];
      component.tabChange.subscribe(t => emitted.push(t));

      component.onTabChange('Tools');

      expect(emitted).toEqual(['Tools']);
    });
  });
});
