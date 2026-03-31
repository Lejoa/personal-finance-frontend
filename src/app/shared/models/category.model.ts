export interface Category {
  id: number;
  name: string;
  description: string;
  type: CategoryType;
  createdAt?: Date;
}

export type CategoryType = 'ingreso' | 'gasto';

export interface CreateCategoryRequest {
  name: string;
  description: string;
  type: CategoryType;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}