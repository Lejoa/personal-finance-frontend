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

    private mapDtoToBudget(dto: BudgetDTO): Budget {
        return {
            id: dto.id,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            categories: dto.categories,
            items: dto.categories.map(category => ({
                nombre: category.categoryName,
                tope: category.amount
            })),
            createdAt: new Date(dto.createdAt)
        };
    }
}