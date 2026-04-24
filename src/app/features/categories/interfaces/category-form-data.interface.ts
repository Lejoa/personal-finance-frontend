import { CategoryType } from '../../../shared/models/category.model';

export interface CategoryFormData {
  name: string;
  description: string;
  type: CategoryType;
}
