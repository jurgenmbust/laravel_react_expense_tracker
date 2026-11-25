import { Pencil, Trash2, ReceiptText } from "lucide-react";
import type { Expense } from "../types";
import { Empty, dateLabel, money } from "./Feedback";

// Props pass records and action callbacks down from App.
export function ExpenseTable({
  expenses,
  currency,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  currency: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  if (!expenses.length)
    return (
      <Empty
        title="Tu registro empieza aquí"
        text="Agrega tu primer gasto o ajusta los filtros para ver otros registros."
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Categoría</th>
            <th>Fecha</th>
            <th className="right">Monto</th>
            <th className="right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>
                <div className="expense-name">
                  <span className="expense-icon">
                    <ReceiptText size={17} />
                  </span>
                  <div>
                    <strong>{expense.title}</strong>
                    <small>{expense.notes || "Sin notas adicionales"}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className="category-badge">
                  <i style={{ backgroundColor: expense.category.color }} />
                  {expense.category.name}
                </span>
              </td>
              <td className="date-cell">{dateLabel(expense.spent_on)}</td>
              <td className="amount-cell">{money(expense.amount, currency)}</td>
              <td>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Editar ${expense.title}`}
                    onClick={() => onEdit(expense)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button danger-text"
                    aria-label={`Eliminar ${expense.title}`}
                    onClick={() => onDelete(expense)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
