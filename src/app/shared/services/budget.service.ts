import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, BudgetCategory } from '../models/budget.model';
import { environment } from '../../../environments/environment';

interface BudgetDTO {
    id: number;
    startDate: string;
    endDate: string;
    categories: BudgetCategory[];
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class BudgetService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/budgets`;

    getBudgets(): Observable<Budget[]> {
        return this.http.get<BudgetDTO[]>(this.apiUrl).pipe(
            map(budgets => budgets.map(dto => this.mapDtoToBudget(dto)))
        );
    }

    getBudgetById(id: number): Observable<Budget> {
        return this.http.get<BudgetDTO>(`${this.apiUrl}/${id}`).pipe(
            map(dto => this.mapDtoToBudget(dto))
        );
    }

    createBudget(request: CreateBudgetRequest): Observable<Budget> {
        return this.http.post<BudgetDTO>(this.apiUrl, request).pipe(
            map(dto => this.mapDtoToBudget(dto))
        );
    }

    updateBudget(id: number, request: UpdateBudgetRequest): Observable<Budget> {
        return this.http.patch<BudgetDTO>(`${this.apiUrl}/${id}`, request).pipe(
            map(dto => this.mapDtoToBudget(dto))
        );
    }

    deleteBudget(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    deleteBudgetCategory(budgetId: number, budgetCategoryId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${budgetId}/categories/${budgetCategoryId}`);
    }

    updateBudgetCategoryAmount(budgetId: number, budgetCategoryId: number, amount: number): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${budgetId}/categories/${budgetCategoryId}`, { amount });
    }

    getBudgetByMonth(month: Date): Observable<Budget | null> {
        return this.getBudgets().pipe(
            map(budgets => {
                return budgets.find(budget => {
                    const bStart = new Date(budget.startDate);
                    return (
                        bStart.getFullYear() === month.getFullYear() &&
                        bStart.getMonth() === month.getMonth()
                    );
                }) ?? null;
            })
        );
    }

    setBudgetForCategory(categoryId: number, limit: number, month: Date, existingBudget: Budget | null): Observable<Budget> {
        const startDate = this.formatDate(new Date(month.getFullYear(), month.getMonth(), 1));
        const endDate = this.formatDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));

        if (existingBudget?.id) {
            // Ya existe un budget para este mes: agregar la nueva categoría a las existentes
            const existingCategories = (existingBudget.categories ?? []).map(c => ({
                categoryId: c.categoryId,
                amount: c.amount
            }));
            const request: UpdateBudgetRequest = {
                categories: [...existingCategories, { categoryId, amount: limit }]
            };
            return this.updateBudget(existingBudget.id, request);
        }

        // No existe budget para este mes: crear uno nuevo
        const request: CreateBudgetRequest = {
            startDate,
            endDate,
            categories: [{ categoryId, amount: limit }]
        };
        return this.createBudget(request);
    }

    private formatDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /** Parse a YYYY-MM-DD string as local midnight (avoids UTC-offset month shift) */
    private parseLocalDate(dateStr: string): Date {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    private mapDtoToBudget(dto: BudgetDTO): Budget {
        return {
            id: dto.id,
            startDate: this.parseLocalDate(dto.startDate),
            endDate: this.parseLocalDate(dto.endDate),
            categories: dto.categories,
            items: dto.categories.map(category => ({
                nombre: category.categoryName,
                tope: category.amount
            })),
            createdAt: new Date(dto.createdAt)
        };
    }
}