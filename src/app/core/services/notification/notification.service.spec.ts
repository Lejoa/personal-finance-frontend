import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiUrl}/api/notifications`;

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadUnread', () => {
    it('should GET unread notifications', () => {
      let result: { count: number; notifications: unknown[] } | undefined;
      service.loadUnread().subscribe(r => result = r);
      http.expectOne(`${API}/unread`).flush({ count: 3, notifications: [] });
      expect(result.count).toBe(3);
    });

    it('should update unreadCount$', () => {
      let count: number | undefined;
      service.unreadCount$.subscribe(c => count = c);

      service.loadUnread().subscribe();
      http.expectOne(`${API}/unread`).flush({ count: 5, notifications: [] });

      expect(count).toBe(5);
    });
  });

  describe('markAllRead', () => {
    it('should POST to /read endpoint', () => {
      let called = false;
      service.markAllRead().subscribe(() => called = true);
      http.expectOne(r => r.url === `${API}/read` && r.method === 'POST').flush(null);
      expect(called).toBeTrue();
    });

    it('should reset unreadCount$ to 0', () => {
      let count: number | undefined;
      service.unreadCount$.subscribe(c => count = c);

      // Set a non-zero count first
      service.loadUnread().subscribe();
      http.expectOne(`${API}/unread`).flush({ count: 4, notifications: [] });
      expect(count).toBe(4);

      service.markAllRead().subscribe();
      http.expectOne(r => r.url === `${API}/read`).flush(null);
      expect(count).toBe(0);
    });
  });
});
