import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { SmsSyncSheetComponent } from './sms-sync-sheet.component';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { CategoryService } from '../../../../shared/services/category.service';
import { SmsService, PendingSmsTransaction } from '../../../../core/services/sms/sms.service';
import { PlatformService } from '../../../../core/services/platform/platform.service';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';

const makePendingTx = (note: string, type: 'ingreso' | 'gasto' = 'gasto'): PendingSmsTransaction => ({
  name: `Tx ${note}`,
  amount: 100,
  date: new Date('2024-05-10'),
  transactionType: type,
  note,
  smsAddress: 'BANCO',
  smsDate: 1715299200000
});

const makeCategory = (id: number, type: 'ingreso' | 'gasto'): Category => ({
  id, name: `Cat ${id}`, description: '', type
});

const mockCreatedTx: Transaction = {
  name: 'Tx A',
  amount: 100,
  date: new Date('2024-05-10'),
  transactionType: 'gasto'
};

describe('SmsSyncSheetComponent', () => {
  let component: SmsSyncSheetComponent;
  let fixture: ComponentFixture<SmsSyncSheetComponent>;
  let txServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let smsServiceSpy: jasmine.SpyObj<SmsService>;
  let platformServiceSpy: { isNative: boolean };

  beforeEach(async () => {
    txServiceSpy = jasmine.createSpyObj('TransactionService', ['createTransaction']);
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories']);
    smsServiceSpy = jasmine.createSpyObj('SmsService', [
      'parseBankSms', 'triggerMockFetch', 'markSmsAsProcessed'
    ]);
    platformServiceSpy = { isNative: false };

    categoryServiceSpy.getCategories.and.returnValue(of([]));
    smsServiceSpy.triggerMockFetch.and.resolveTo([]);
    smsServiceSpy.parseBankSms.and.resolveTo([]);
    smsServiceSpy.markSmsAsProcessed.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [SmsSyncSheetComponent],
      providers: [
        { provide: TransactionService, useValue: txServiceSpy },
        { provide: CategoryService,    useValue: categoryServiceSpy },
        { provide: SmsService,         useValue: smsServiceSpy },
        { provide: PlatformService,    useValue: platformServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SmsSyncSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should reset state and load categories when isOpen becomes true', () => {
      component.transactions = [makePendingTx('A')];
      component.hasFetched = true;
      categoryServiceSpy.getCategories.and.returnValue(of([makeCategory(1, 'gasto')]));

      component.isOpen = true;
      component.ngOnChanges({ isOpen: new SimpleChange(false, true, false) });

      expect(component.transactions).toEqual([]);
      expect(component.hasFetched).toBeFalse();
      expect(component.categories.length).toBe(1);
    });

    it('should not reset state when isOpen is not the changed input', () => {
      component.hasFetched = true;
      component.ngOnChanges({ selectedDays: new SimpleChange(1, 3, false) });
      expect(component.hasFetched).toBeTrue();
    });
  });

  describe('fetch', () => {
    it('should call triggerMockFetch on non-native platform', async () => {
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A')]);
      await component.fetch();
      expect(smsServiceSpy.triggerMockFetch).toHaveBeenCalledWith(component.selectedDays);
      expect(component.transactions.length).toBe(1);
      expect(component.hasFetched).toBeTrue();
      expect(component.isFetching).toBeFalse();
    });

    it('should call parseBankSms on native platform', async () => {
      platformServiceSpy.isNative = true;
      smsServiceSpy.parseBankSms.and.resolveTo([makePendingTx('B')]);
      await component.fetch();
      expect(smsServiceSpy.parseBankSms).toHaveBeenCalled();
    });

    it('should not fetch again while already fetching', async () => {
      component.isFetching = true;
      await component.fetch();
      expect(smsServiceSpy.triggerMockFetch).not.toHaveBeenCalled();
    });
  });

  describe('toggleExpand', () => {
    it('should toggle expanded state of a card', async () => {
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A')]);
      await component.fetch();
      expect(component.cardStates.get('A')!.expanded).toBeFalse();
      component.toggleExpand('A');
      expect(component.cardStates.get('A')!.expanded).toBeTrue();
    });
  });

  describe('toggleCheck', () => {
    it('should toggle checked state of a card', async () => {
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A')]);
      await component.fetch();
      expect(component.cardStates.get('A')!.checked).toBeTrue();
      component.toggleCheck('A');
      expect(component.cardStates.get('A')!.checked).toBeFalse();
    });
  });

  describe('checkedCount getter', () => {
    it('should return the number of checked transactions', async () => {
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A'), makePendingTx('B')]);
      await component.fetch();
      expect(component.checkedCount).toBe(2);
      component.toggleCheck('A');
      expect(component.checkedCount).toBe(1);
    });
  });

  describe('getCategoriesForType', () => {
    beforeEach(async () => {
      component.categories = [makeCategory(1, 'gasto'), makeCategory(2, 'ingreso')];
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A', 'gasto')]);
      await component.fetch();
    });

    it('should return categories matching the transaction type', () => {
      expect(component.getCategoriesForType('A').length).toBe(1);
      expect(component.getCategoriesForType('A')[0].type).toBe('gasto');
    });

    it('should return all categories for unknown note', () => {
      expect(component.getCategoriesForType('UNKNOWN').length).toBe(2);
    });
  });

  describe('close', () => {
    it('should emit sheetClosed', () => {
      const emitSpy = spyOn(component.sheetClosed, 'emit');
      component.close();
      expect(emitSpy).toHaveBeenCalledOnceWith();
    });
  });

  describe('approve', () => {
    it('should do nothing when there are no transactions', () => {
      component.transactions = [];
      component.approve();
      expect(txServiceSpy.createTransaction).not.toHaveBeenCalled();
    });

    it('should do nothing when already approving', () => {
      component.transactions = [makePendingTx('A')];
      component.isApproving = true;
      component.approve();
      expect(txServiceSpy.createTransaction).not.toHaveBeenCalled();
    });

    it('should emit approved and mark as processed when all unchecked', async () => {
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A')]);
      await component.fetch();
      component.toggleCheck('A'); // uncheck

      const approvedSpy = spyOn(component.approved, 'emit');
      component.approve();

      expect(smsServiceSpy.markSmsAsProcessed).toHaveBeenCalled();
      expect(approvedSpy).toHaveBeenCalledOnceWith();
    });

    it('should call createTransaction and emit approved on success', async () => {
      smsServiceSpy.triggerMockFetch.and.resolveTo([makePendingTx('A')]);
      await component.fetch();
      txServiceSpy.createTransaction.and.returnValue(of(mockCreatedTx));

      const approvedSpy = spyOn(component.approved, 'emit');
      component.approve();

      expect(txServiceSpy.createTransaction).toHaveBeenCalled();
      expect(approvedSpy).toHaveBeenCalledOnceWith();
      expect(component.isApproving).toBeFalse();
    });
  });

  describe('formatAmount', () => {
    it('should format a number as COP currency', () => {
      const result = component.formatAmount(50000);
      expect(result).toContain('50');
    });
  });

  describe('formatDate', () => {
    it('should return a formatted date string', () => {
      const result = component.formatDate(new Date('2024-05-10'));
      expect(result).toContain('2024');
    });
  });
});
