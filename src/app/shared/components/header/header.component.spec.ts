import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { TabService } from '../../../core/services/tab/tab.service';
import { NotificationService, NotificationSummary } from '../../../core/services/notification/notification.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let tabServiceSpy: jasmine.SpyObj<TabService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let activeTabSubject: BehaviorSubject<string>;
  let unreadCountSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    activeTabSubject  = new BehaviorSubject<string>('Home');
    unreadCountSubject = new BehaviorSubject<number>(0);

    tabServiceSpy = jasmine.createSpyObj('TabService', ['setActiveTab'], {
      activeTab$: activeTabSubject.asObservable()
    });
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['loadUnread', 'markAllRead'], {
      unreadCount$: unreadCountSubject.asObservable()
    });

    const mockSummary: NotificationSummary = { count: 0, notifications: [] };
    notificationServiceSpy.loadUnread.and.returnValue(of(mockSummary));
    notificationServiceSpy.markAllRead.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: TabService,           useValue: tabServiceSpy },
        { provide: NotificationService,  useValue: notificationServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call notificationService.loadUnread on init', () => {
      expect(notificationServiceSpy.loadUnread).toHaveBeenCalled();
    });
  });

  describe('onProfileClick', () => {
    it('should set isMenuOpen$ to true', (done) => {
      component.onProfileClick();
      component.isMenuOpen$.subscribe(value => {
        expect(value).toBeTrue();
        done();
      });
    });
  });

  describe('closeMenu', () => {
    it('should set isMenuOpen$ to false after opening', (done) => {
      component.onProfileClick();
      component.closeMenu();
      component.isMenuOpen$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });
  });

  describe('onCategoriesClicked', () => {
    it('should set active tab to Categories', () => {
      component.onCategoriesClicked();
      expect(tabServiceSpy.setActiveTab).toHaveBeenCalledOnceWith('Categories');
    });
  });

  describe('onBellClick', () => {
    it('should call notificationService.markAllRead', () => {
      component.onBellClick();
      expect(notificationServiceSpy.markAllRead).toHaveBeenCalled();
    });

    it('should navigate to Aprende tab', () => {
      component.onBellClick();
      expect(tabServiceSpy.setActiveTab).toHaveBeenCalledWith('Aprende');
    });
  });
});
