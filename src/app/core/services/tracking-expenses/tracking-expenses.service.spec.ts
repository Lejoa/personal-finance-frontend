import { TestBed } from '@angular/core/testing';

import { TrackingExpensesService } from './tracking-expenses.service';

describe('TrackingExpensesService', () => {
  let service: TrackingExpensesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingExpensesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
