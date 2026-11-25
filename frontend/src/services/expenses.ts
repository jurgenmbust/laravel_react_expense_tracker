import { request } from "./api";
import type {
  Category,
  CategoryInput,
  Expense,
  ExpenseInput,
  ExpensePage,
  Filters,
  Summary,
} from "../types";

// Services send HTTP requests; components decide when to call them.
export function queryString(filters: Filters) {
  return new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}
export const expenseService = {
  list: (filters: Filters, signal?: AbortSignal) =>
    request<ExpensePage>(`/expenses?${queryString(filters)}`, { signal }),
  summary: async (filters: Filters, signal?: AbortSignal) =>
    (
      await request<{ data: Summary }>(`/summary?${queryString(filters)}`, {
        signal,
      })
    ).data,
  create: async (input: ExpenseInput) =>
    (
      await request<{ data: Expense }>("/expenses", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ).data,
  update: async (id: number, input: ExpenseInput) =>
    (
      await request<{ data: Expense }>(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      })
    ).data,
  remove: (id: number) =>
    request<void>(`/expenses/${id}`, { method: "DELETE" }),
};
export const categoryService = {
  list: async (signal?: AbortSignal) =>
    (await request<{ data: Category[] }>("/categories", { signal })).data,
  create: async (input: CategoryInput) =>
    (
      await request<{ data: Category }>("/categories", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ).data,
  update: async (id: number, input: CategoryInput) =>
    (
      await request<{ data: Category }>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      })
    ).data,
  remove: (id: number) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),
};
