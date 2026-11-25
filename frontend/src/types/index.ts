// These interfaces describe the JSON contract, not database models.
export interface Category {
  id: number;
  name: string;
  color: string;
  expenses_count?: number;
}
export interface CategoryInput {
  name: string;
  color: string;
}
export interface Expense {
  id: number;
  title: string;
  amount: string;
  spent_on: string;
  notes: string | null;
  category: Category;
  created_at: string;
}
export interface ExpenseInput {
  title: string;
  amount: string;
  spent_on: string;
  category_id: number;
  notes: string;
}
export interface Filters {
  month: string;
  search: string;
  category_id: string;
  page: number;
  per_page: number;
  sort: string;
  direction: string;
}
export interface ExpensePage {
  data: Expense[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}
export interface Breakdown {
  id: number;
  name: string;
  color: string;
  total: string;
  count: number;
}
export interface Summary {
  currency: string;
  total: string;
  average: string;
  count: number;
  category_count: number;
  by_category: Breakdown[];
}
