import { TestBed } from '@angular/core/testing';

import { RecurringExpensesService } from './recurring-expenses.service';

describe('RecurringExpenseService', () => {
  let service: RecurringExpensesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecurringExpensesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
