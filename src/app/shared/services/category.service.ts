import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../models/category.model';
import { environment } from '../../../environments/environment';

export interface CategoryFilters {
  type?: CategoryType;
  name?: string;
}

interface CategoriesResponse {
  data: Category[];
  total: number;
}

interface CategoryResponse {
  category: Category;
}

interface CategoryCreateResponse {
  message: string;
  category: Category;
}

interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  type: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/categories`;

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  /** Obtiene todas las categorías del backend y actualiza el estado */
  getCategories(filters?: CategoryFilters): Observable<Category[]> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.name) {
      params = params.set('name', filters.name);
    }
    return this.http.get<CategoriesResponse>(this.apiUrl, { params })
            .pipe(
              map(response => response.data.map(dto => this.mapDtoToCategory(dto))),
              tap(categories => this.categoriesSubject.next(categories))
            );
  }

  /** Obtiene una categoría por ID */
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<CategoryResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.category)
    );
  }

  /** Crea una nueva categoría */
  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<CategoryCreateResponse>(this.apiUrl, request).pipe(
      map(response => response.category),
      tap(newCategory => {
        const currentCategories = this.categoriesSubject.value;
        this.categoriesSubject.next([...currentCategories, newCategory]);
      })
    );
  }

  /** Actualiza una categoría existente */
  updateCategory(id: number, request: UpdateCategoryRequest): Observable<Category> {
    return this.http.patch<CategoryCreateResponse>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => response.category),
      tap(updatedCategory => {
        const currentCategories = this.categoriesSubject.value;
        const index = currentCategories.findIndex(c => c.id === id);
        if (index !== -1) {
          currentCategories[index] = updatedCategory;
          this.categoriesSubject.next([...currentCategories]);
        }
      })
    );
  }

  /** Elimina una categoría */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentCategories = this.categoriesSubject.value;
        this.categoriesSubject.next(currentCategories.filter(c => c.id !== id));
      })
    );
  }

  /** Obtiene el estado actual de categorías sin hacer una llamada HTTP */
  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }

  private mapDtoToCategory(dto: CategoryDTO): Category {
      return {
        id: dto.id,
        name: dto.name,
        description: dto.description,
        type: dto.type as CategoryType,
        createdAt: new Date(dto.createdAt)
      };
  }
      
}