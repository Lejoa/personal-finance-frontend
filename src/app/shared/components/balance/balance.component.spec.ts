import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BalanceComponent } from './balance.component';
import { Transaction } from '../../models/transaction.model';

const makeTransaction = (type: 'ingreso' | 'gasto', amount: number): Transaction => ({
  name: 'Test',
  amount,
  date: new Date('2024-05-01'),
  transactionType: type
});

describe('BalanceComponent', () => {
  let component: BalanceComponent;
  let fixture: ComponentFixture<BalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('income', () => {
    it('should sum only ingreso transactions', () => {
      component.transactions = [
        makeTransaction('ingreso', 1000),
        makeTransaction('ingreso', 500),
        makeTransaction('gasto', 200)
      ];
      expect(component.income).toBe(1500);
    });

    it('should return 0 when there are no ingreso transactions', () => {
      component.transactions = [makeTransaction('gasto', 300)];
      expect(component.income).toBe(0);
    });
  });

  describe('expenses', () => {
    it('should sum only gasto transactions', () => {
      component.transactions = [
        makeTransaction('gasto', 400),
        makeTransaction('gasto', 100),
        makeTransaction('ingreso', 1000)
      ];
      expect(component.expenses).toBe(500);
    });

    it('should return 0 when there are no gasto transactions', () => {
      component.transactions = [makeTransaction('ingreso', 1000)];
      expect(component.expenses).toBe(0);
    });
  });

  describe('balance', () => {
    it('should return income minus expenses', () => {
      component.transactions = [
        makeTransaction('ingreso', 2000),
        makeTransaction('gasto', 800)
      ];
      expect(component.balance).toBe(1200);
    });

    it('should return negative balance when expenses exceed income', () => {
      component.transactions = [
        makeTransaction('ingreso', 300),
        makeTransaction('gasto', 500)
      ];
      expect(component.balance).toBe(-200);
    });

    it('should return 0 when transactions array is empty', () => {
      component.transactions = [];
      expect(component.balance).toBe(0);
    });
  });
});
