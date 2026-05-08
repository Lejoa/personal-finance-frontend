import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TransactionCardComponent } from './transaction-card.component';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

const mockTransaction: Transaction = {
  id: '1',
  name: 'Compra supermercado',
  amount: 150,
  date: new Date('2024-05-10'),
  transactionType: 'gasto',
  categoryId: 2,
  categoryName: 'Comida'
};

const mockUpdatedTransaction: Transaction = {
  ...mockTransaction,
  name: 'Compra actualizada',
  amount: 200
};

describe('TransactionCardComponent', () => {
  let component: TransactionCardComponent;
  let fixture: ComponentFixture<TransactionCardComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoriesSubject: BehaviorSubject<any[]>;

  beforeEach(async () => {
    categoriesSubject = new BehaviorSubject<any[]>([]);
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['updateTransaction']);
    transactionServiceSpy.updateTransaction.and.returnValue(of(mockUpdatedTransaction));

    await TestBed.configureTestingModule({
      imports: [TransactionCardComponent, NoopAnimationsModule],
      providers: [
        {
          provide: CategoryService,
          useValue: { categories$: categoriesSubject.asObservable() }
        },
        { provide: TransactionService, useValue: transactionServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionCardComponent);
    component = fixture.componentInstance;
    component.transaction = { ...mockTransaction };
    component.transactionAction = 'Edit';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getters with transactionAction Edit', () => {
    it('cancelButtonText should return "Cancelar"', () => {
      expect(component.cancelButtonText).toBe('Cancelar');
    });

    it('modalTitle should return "Editar Transacción"', () => {
      expect(component.modalTitle).toBe('Editar Transacción');
    });

    it('buttonTitle should return "Editar"', () => {
      expect(component.buttonTitle).toBe('Editar');
    });
  });

  describe('getters with transactionAction Sincronize', () => {
    beforeEach(() => {
      component.transactionAction = 'Sincronize';
      (component as any).actionConfig = null;
    });

    it('cancelButtonText should return "Descartar"', () => {
      expect(component.cancelButtonText).toBe('Descartar');
    });

    it('modalTitle should return "Sincronizar Transacción"', () => {
      expect(component.modalTitle).toBe('Sincronizar Transacción');
    });

    it('buttonTitle should return "Sincronizar"', () => {
      expect(component.buttonTitle).toBe('Sincronizar');
    });
  });

  describe('saveButtonLabel', () => {
    it('should return "Guardar" when not saving', () => {
      component.isSaving = false;
      expect(component.saveButtonLabel).toBe('Guardar');
    });

    it('should return "Guardando..." when saving', () => {
      component.isSaving = true;
      expect(component.saveButtonLabel).toBe('Guardando...');
    });
  });

  describe('startEdit', () => {
    it('should set isEditing to true', () => {
      component.startEdit();
      expect(component.isEditing).toBeTrue();
    });

    it('should copy transaction fields to edit fields', () => {
      component.startEdit();
      expect(component.editName).toBe(mockTransaction.name);
      expect(component.editAmount).toBe(mockTransaction.amount);
      expect(component.selectedCategory.value).toBe(mockTransaction.categoryId ?? null);
    });
  });

  describe('cancelEdit', () => {
    it('should set isEditing to false', () => {
      component.isEditing = true;
      component.cancelEdit();
      expect(component.isEditing).toBeFalse();
    });

    it('should reset selectedCategory', () => {
      component.selectedCategory.setValue(2);
      component.cancelEdit();
      expect(component.selectedCategory.value).toBeNull();
    });
  });

  describe('saveEdit', () => {
    beforeEach(() => {
      component.startEdit();
      component.editName = 'Compra actualizada';
      component.editAmount = 200;
    });

    it('should call updateTransaction with the edited data', () => {
      component.saveEdit();
      expect(transactionServiceSpy.updateTransaction).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ name: 'Compra actualizada', amount: 200 })
      );
    });

    it('should update transaction, set isEditing to false and emit transactionUpdated on success', () => {
      const emitted: Transaction[] = [];
      component.transactionUpdated.subscribe(t => emitted.push(t));

      component.saveEdit();

      expect(component.transaction).toEqual(mockUpdatedTransaction);
      expect(component.isEditing).toBeFalse();
      expect(component.isSaving).toBeFalse();
      expect(emitted).toEqual([mockUpdatedTransaction]);
    });

    it('should set isSaving to false on error', () => {
      transactionServiceSpy.updateTransaction.and.returnValue(throwError(() => new Error('error')));
      component.saveEdit();
      expect(component.isSaving).toBeFalse();
    });

    it('should do nothing when transaction has no id', () => {
      component.transaction = { ...mockTransaction, id: undefined };
      component.saveEdit();
      expect(transactionServiceSpy.updateTransaction).not.toHaveBeenCalled();
    });
  });

  describe('handleCancel', () => {
    it('should call cancelEdit when transactionAction is Edit', () => {
      component.isEditing = true;
      component.handleCancel();
      expect(component.isEditing).toBeFalse();
    });

    it('should call updateTransaction with status rejected when transactionAction is Sincronize', () => {
      component.transactionAction = 'Sincronize';
      (component as any).actionConfig = null;

      component.handleCancel();

      expect(transactionServiceSpy.updateTransaction).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ status: 'rejected' })
      );
    });
  });
});
