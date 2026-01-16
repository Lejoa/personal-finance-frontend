export interface Category {
  id: number;
  name: string;
  description: string;
  type: 'ingreso' | 'gasto';
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}