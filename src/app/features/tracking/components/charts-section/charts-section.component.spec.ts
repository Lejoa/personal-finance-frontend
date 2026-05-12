import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange, Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartsSectionComponent } from './charts-section.component';
import { Transaction } from '../../../../shared/models/transaction.model';

// eslint-disable-next-line @angular-eslint/component-selector
@Component({ selector: 'canvas[baseChart]', template: '', standalone: true })
class MockBaseChartDirective {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() type: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() options: any;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  update(): void {}
}

const makeTransaction = (categoryName: string, amount: number): Transaction => ({
  name: 'Transacción',
  amount,
  date: new Date('2024-05-01'),
  transactionType: 'gasto',
  categoryName
});

describe('ChartsSectionComponent', () => {
  let component: ChartsSectionComponent;
  let fixture: ComponentFixture<ChartsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsSectionComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ChartsSectionComponent, {
      remove: { imports: [BaseChartDirective] },
      add:    { imports: [MockBaseChartDirective] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should update chartData when transactions input changes', () => {
      const transactions = [
        makeTransaction('Comida', 100),
        makeTransaction('Transporte', 50)
      ];

      component.transactions = transactions;
      component.ngOnChanges({
        transactions: new SimpleChange([], transactions, false)
      });

      expect(component.chartData.labels).toEqual(['Comida', 'Transporte']);
      expect(component.chartData.datasets[0].data).toEqual([100, 50]);
    });

    it('should aggregate amounts for the same category', () => {
      const transactions = [
        makeTransaction('Comida', 100),
        makeTransaction('Comida', 200),
        makeTransaction('Transporte', 50)
      ];

      component.transactions = transactions;
      component.ngOnChanges({
        transactions: new SimpleChange([], transactions, false)
      });

      expect(component.chartData.labels).toEqual(['Comida', 'Transporte']);
      expect(component.chartData.datasets[0].data).toEqual([300, 50]);
    });

    it('should use "Sin categoría" for transactions without categoryName', () => {
      const transaction: Transaction = {
        name: 'Sin cat',
        amount: 75,
        date: new Date(),
        transactionType: 'gasto'
      };

      component.transactions = [transaction];
      component.ngOnChanges({
        transactions: new SimpleChange([], [transaction], false)
      });

      expect(component.chartData.labels).toEqual(['Sin categoría']);
      expect(component.chartData.datasets[0].data).toEqual([75]);
    });

    it('should produce empty chart when transactions array is empty', () => {
      component.transactions = [];
      component.ngOnChanges({
        transactions: new SimpleChange(null, [], true)
      });

      expect(component.chartData.labels).toEqual([]);
      expect(component.chartData.datasets[0].data).toEqual([]);
    });

    it('should not update chart when other inputs change', () => {
      const originalData = component.chartData;

      component.ngOnChanges({
        selectedMonth: new SimpleChange(null, new Date(), true)
      });

      expect(component.chartData).toBe(originalData);
    });

    it('should generate one color per category', () => {
      const transactions = [
        makeTransaction('Comida', 100),
        makeTransaction('Transporte', 50),
        makeTransaction('Ocio', 30)
      ];

      component.transactions = transactions;
      component.ngOnChanges({
        transactions: new SimpleChange([], transactions, false)
      });

      expect((component.chartData.datasets[0].backgroundColor as string[]).length).toBe(3);
    });
  });

  describe('setChartTransactionType', () => {
    it('should emit "gasto" when type is "expenses"', () => {
      const emitted: string[] = [];
      component.transactionTypeChange.subscribe(v => emitted.push(v));

      component.setChartTransactionType('expenses');

      expect(emitted).toEqual(['gasto']);
    });

    it('should emit "ingreso" when type is not "expenses"', () => {
      const emitted: string[] = [];
      component.transactionTypeChange.subscribe(v => emitted.push(v));

      component.setChartTransactionType('income');

      expect(emitted).toEqual(['ingreso']);
    });
  });
});
