import { useState } from "react";
import type { FormEvent } from "react";
import type { Category, Expense, ExpenseInput } from "../types";
import { ApiError, errorMessage } from "../services/api";
import { ErrorPanel, localDate } from "./Feedback";

export interface ExpenseDraft {
  title: string;
  amount: string;
  spent_on: string;
  category_id: string;
  notes: string;
}

// Amount stays a string from input to JSON. Never use parseFloat to save money.
export function validateExpense(form: ExpenseDraft) {
  const errors: Record<string, string> = {};
  if (!form.title.trim() || form.title.trim().length > 150)
    errors.title = "Escribe un concepto de hasta 150 caracteres.";
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(form.amount) || Number(form.amount) <= 0)
    errors.amount = "Ingresa un monto positivo con hasta dos decimales.";
  if (!form.spent_on) errors.spent_on = "Selecciona una fecha.";
  if (!form.category_id) errors.category_id = "Selecciona una categoría.";
  if (form.notes.length > 2000) errors.notes = "Usa hasta 2000 caracteres.";
  return errors;
}

// The parent supplies the API operation. This component owns only the editable draft.
export function ExpenseForm({
  expense,
  categories,
  currency,
  onSave,
  onCancel,
  onBusy,
}: {
  expense?: Expense;
  categories: Category[];
  currency: string;
  onSave: (input: ExpenseInput) => Promise<void>;
  onCancel: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const [form, setForm] = useState<ExpenseDraft>({
    title: expense?.title || "",
    amount: expense?.amount || "",
    spent_on: expense?.spent_on || localDate(),
    category_id: String(expense?.category.id || ""),
    notes: expense?.notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (name: keyof ExpenseDraft, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateExpense(form);
    setErrors(invalid);
    setError("");
    if (Object.keys(invalid).length) return;
    setBusy(true);
    onBusy(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        category_id: Number(form.category_id),
      });
    } catch (reason) {
      setError(errorMessage(reason));
      if (reason instanceof ApiError)
        setErrors(
          Object.fromEntries(
            Object.entries(reason.errors).map(([key, messages]) => [
              key,
              messages[0],
            ]),
          ),
        );
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      {error && <ErrorPanel message={error} />}
      <fieldset disabled={busy} className="form-grid">
        <div className="full">
          <label htmlFor="expense-title">Concepto *</label>
          <input
            autoFocus
            id="expense-title"
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
            maxLength={150}
            placeholder="Ej. Compra del supermercado"
            aria-invalid={!!errors.title}
            aria-describedby="title-error"
          />
          <small id="title-error" className="field-error">
            {errors.title}
          </small>
        </div>
        <div>
          <label htmlFor="expense-amount">Monto ({currency}) *</label>
          <input
            id="expense-amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => change("amount", e.target.value)}
            placeholder="0.00"
            aria-invalid={!!errors.amount}
            aria-describedby="amount-error"
          />
          <small id="amount-error" className="field-error">
            {errors.amount}
          </small>
        </div>
        <div>
          <label htmlFor="expense-date">Fecha *</label>
          <input
            id="expense-date"
            type="date"
            value={form.spent_on}
            onChange={(e) => change("spent_on", e.target.value)}
            aria-invalid={!!errors.spent_on}
            aria-describedby="date-error"
          />
          <small id="date-error" className="field-error">
            {errors.spent_on}
          </small>
        </div>
        <div className="full">
          <label htmlFor="expense-category">Categoría *</label>
          <select
            id="expense-category"
            value={form.category_id}
            onChange={(e) => change("category_id", e.target.value)}
            aria-invalid={!!errors.category_id}
            aria-describedby="category-error"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <small id="category-error" className="field-error">
            {errors.category_id}
          </small>
        </div>
        <div className="full">
          <label htmlFor="expense-notes">
            Notas <span className="muted">(opcional)</span>
          </label>
          <textarea
            id="expense-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => change("notes", e.target.value)}
            maxLength={2000}
            placeholder="Agrega un detalle para recordarlo después"
            aria-describedby="notes-error"
          />
          <small id="notes-error" className="field-error">
            {errors.notes}
          </small>
        </div>
        <div className="form-actions full">
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            {busy
              ? "Guardando…"
              : expense
                ? "Guardar cambios"
                : "Registrar gasto"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
