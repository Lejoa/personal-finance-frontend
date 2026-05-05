import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  DestroyRef,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Chart, registerables } from 'chart.js';
import { LoanCalculatorService } from '../../services/loan-calculator.service';
import {
  AmortizationRow,
  LoanFrequency,
  LoanResult,
  SavedLoanCalculation,
} from '../../../../shared/models/loan.model';

Chart.register(...registerables);

@Component({
  selector: 'app-loan-calculator',
  standalone: true,
  imports: [FormsModule, CommonModule, CurrencyPipe, DecimalPipe, MatSnackBarModule],
  templateUrl: './loan-calculator.component.html',
  styleUrl: './loan-calculator.component.scss',
})
export class LoanCalculatorComponent implements OnInit, AfterViewInit, OnDestroy {
  private loanService = inject(LoanCalculatorService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  @ViewChild('lineChartCanvas') lineChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChartCanvas') doughnutChartCanvas?: ElementRef<HTMLCanvasElement>;

  isPanelOpen = false;
  showResults = false;
  activeTab: 'progress' | 'breakdown' | 'table' = 'progress';

  amount: number | null = null;
  annualRate: number | null = null;
  termMonths: number | null = null;
  extraPayment: number | null = null;
  frequency: LoanFrequency = 'monthly';

  result: LoanResult | null = null;
  amortizationTable: AmortizationRow[] = [];
  savedCalculations: SavedLoanCalculation[] = [];
  showSaved = false;

  // El registro guardado asociado al resultado actual (si fue cargado desde lista)
  currentSavedId: number | null = null;

  // Modal de guardar
  showSaveModal = false;
  saveName = '';
  isSaving = false;

  // Eliminar desde resultados
  isDeletingCurrent = false;

  // Eliminar desde lista
  isDeleting: number | null = null;

  errorMessage: string | null = null;

  private lineChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  ngOnInit(): void {
    this.loanService
      .getCalculations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (calcs) => (this.savedCalculations = calcs),
        error: () => {},
      });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
    if (!this.isPanelOpen) this.resetAll();
  }

  calculate(): void {
    this.errorMessage = null;

    if (!this.amount || !this.annualRate || !this.termMonths) {
      this.errorMessage = 'Completa los campos obligatorios.';
      return;
    }
    if (this.amount <= 0 || this.annualRate < 0 || this.termMonths <= 0) {
      this.errorMessage = 'Ingresa valores válidos.';
      return;
    }

    const extra = this.extraPayment ?? 0;
    const { periodsPerYear } = this.frequencyConfig();
    const rPeriod = this.annualRate / 100 / periodsPerYear;
    const nTotal = this.termMonths * (periodsPerYear / 12);

    const basePayment =
      rPeriod === 0
        ? this.amount / nTotal
        : (this.amount * rPeriod * Math.pow(1 + rPeriod, nTotal)) /
          (Math.pow(1 + rPeriod, nTotal) - 1);

    const paymentWithExtra = basePayment + extra;
    this.amortizationTable = this.buildAmortization(
      this.amount,
      rPeriod,
      paymentWithExtra,
      nTotal
    );

    const numberOfPayments = this.amortizationTable.length;
    const totalPaid = this.amortizationTable.reduce(
      (s, r) => s + r.principal + r.interest,
      0
    );
    const totalInterest = this.amortizationTable.reduce((s, r) => s + r.interest, 0);

    this.result = {
      amount: this.amount,
      annualRate: this.annualRate,
      termMonths: this.termMonths,
      numberOfPayments,
      extraPayment: extra,
      frequency: this.frequency,
      periodicPayment: basePayment,
      totalInterest,
      totalPaid,
    };

    this.showResults = true;
    this.activeTab = 'progress';

    this.cdr.detectChanges();
    setTimeout(() => this.renderCharts(), 50);
  }

  closeResults(): void {
    this.showResults = false;
    this.currentSavedId = null;
    this.destroyCharts();
  }

  setTab(tab: 'progress' | 'breakdown' | 'table'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (tab === 'progress') this.renderLineChart();
      if (tab === 'breakdown') this.renderDoughnutChart();
    }, 50);
  }

  // Abre el modal pidiendo nombre
  openSaveModal(): void {
    this.saveName = '';
    this.showSaveModal = true;
  }

  closeSaveModal(): void {
    this.showSaveModal = false;
    this.saveName = '';
  }

  confirmSave(): void {
    if (!this.result || !this.saveName.trim() || this.isSaving) return;
    this.isSaving = true;

    this.loanService
      .saveCalculation({
        name: this.saveName.trim(),
        amount: this.result.amount,
        annualRate: this.result.annualRate,
        termMonths: this.result.termMonths,
        extraPayment: this.result.extraPayment,
        frequency: this.result.frequency,
        periodicPayment: this.result.periodicPayment,
        totalInterest: this.result.totalInterest,
        totalPaid: this.result.totalPaid,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.savedCalculations = [saved, ...this.savedCalculations];
          this.currentSavedId = saved.id;
          this.isSaving = false;
          this.showSaveModal = false;
          this.saveName = '';
          this.snackBar.open(`"${saved.name}" guardado correctamente.`, 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success'],
          });
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('No se pudo guardar el cálculo. Intenta de nuevo.', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-error'],
          });
        },
      });
  }

  // Elimina el registro que se está visualizando actualmente
  deleteCurrentCalculation(): void {
    if (!this.currentSavedId || this.isDeletingCurrent) return;
    this.isDeletingCurrent = true;

    const id = this.currentSavedId;
    this.loanService
      .deleteCalculation(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savedCalculations = this.savedCalculations.filter((c) => c.id !== id);
          this.isDeletingCurrent = false;
          this.currentSavedId = null;
          this.showResults = false;
          this.destroyCharts();
          this.snackBar.open('Cálculo eliminado.', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-success'],
          });
        },
        error: () => {
          this.isDeletingCurrent = false;
          this.snackBar.open('No se pudo eliminar el cálculo.', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snack-error'],
          });
        },
      });
  }

  // Elimina desde la lista de guardados
  deleteCalculation(id: number): void {
    this.isDeleting = id;
    this.loanService
      .deleteCalculation(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savedCalculations = this.savedCalculations.filter((c) => c.id !== id);
          if (this.currentSavedId === id) this.currentSavedId = null;
          this.isDeleting = null;
        },
        error: () => (this.isDeleting = null),
      });
  }

  loadSavedCalculation(calc: SavedLoanCalculation): void {
    this.amount = calc.amount;
    this.annualRate = calc.annualRate;
    this.termMonths = calc.termMonths;
    this.extraPayment = calc.extraPayment > 0 ? calc.extraPayment : null;
    this.frequency = calc.frequency;
    this.currentSavedId = calc.id;
    this.showSaved = false;
    this.calculate();
  }

  frequencyLabel(): string {
    return this.frequencyConfig().label;
  }

  private frequencyConfig(): { periodsPerYear: number; label: string } {
    switch (this.frequency) {
      case 'biweekly':
        return { periodsPerYear: 24, label: 'Quincenal' };
      case 'weekly':
        return { periodsPerYear: 52, label: 'Semanal' };
      default:
        return { periodsPerYear: 12, label: 'Mensual' };
    }
  }

  private buildAmortization(
    amount: number,
    rPeriod: number,
    payment: number,
    maxPeriods: number
  ): AmortizationRow[] {
    const rows: AmortizationRow[] = [];
    let balance = amount;
    const limit = Math.ceil(maxPeriods * 2);

    for (let i = 1; i <= limit && balance > 0.005; i++) {
      const interest = balance * rPeriod;
      const principal = Math.min(payment - interest, balance);
      balance = Math.max(balance - principal, 0);
      rows.push({ number: i, principal, interest, balance });
    }
    return rows;
  }

  private renderCharts(): void {
    if (this.activeTab === 'progress') this.renderLineChart();
    if (this.activeTab === 'breakdown') this.renderDoughnutChart();
  }

  private renderLineChart(): void {
    if (!this.lineChartCanvas || !this.amortizationTable.length) return;
    this.lineChart?.destroy();

    const labels = this.amortizationTable.map((r) => String(r.number));
    let principalAccum = 0;
    let interestAccum = 0;
    const principalData: number[] = [];
    const balanceData: number[] = [];
    const interestData: number[] = [];

    for (const row of this.amortizationTable) {
      principalAccum += row.principal;
      interestAccum += row.interest;
      principalData.push(principalAccum);
      balanceData.push(row.balance);
      interestData.push(interestAccum);
    }

    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Principal Pagado',
            data: principalData,
            borderColor: '#43A047',
            backgroundColor: 'rgba(67,160,71,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'Saldo',
            data: balanceData,
            borderColor: '#1565C0',
            backgroundColor: 'rgba(21,101,192,0.06)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'Interés Total',
            data: interestData,
            borderColor: '#E53935',
            backgroundColor: 'rgba(229,57,53,0.06)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 8, font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  private renderDoughnutChart(): void {
    if (!this.doughnutChartCanvas || !this.result) return;
    this.doughnutChart?.destroy();

    this.doughnutChart = new Chart(this.doughnutChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Interés'],
        datasets: [
          {
            data: [this.result.amount, this.result.totalInterest],
            backgroundColor: ['#43A047', '#E53935'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        cutout: '65%',
      },
    });
  }

  private destroyCharts(): void {
    this.lineChart?.destroy();
    this.doughnutChart?.destroy();
    this.lineChart = null;
    this.doughnutChart = null;
  }

  private resetAll(): void {
    this.amount = null;
    this.annualRate = null;
    this.termMonths = null;
    this.extraPayment = null;
    this.frequency = 'monthly';
    this.result = null;
    this.amortizationTable = [];
    this.showResults = false;
    this.showSaved = false;
    this.currentSavedId = null;
    this.showSaveModal = false;
    this.saveName = '';
    this.errorMessage = null;
    this.destroyCharts();
  }
}
