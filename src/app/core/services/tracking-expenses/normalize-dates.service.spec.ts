import { TestBed } from '@angular/core/testing';

import { NormalizeDatesService } from './normalize-dates.service';

describe('NormalizeDatesService', () => {
  let service: NormalizeDatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NormalizeDatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
