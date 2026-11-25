import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExpenseForm, validateExpense } from "../components/ExpenseForm";
import { CategoryForm } from "../components/CategoryForm";
import { ApiError } from "../services/api";
const categories = [{ id: 1, name: "Hogar", color: "#64748b" }];
const valid = {
  title: "Compra",
  amount: "12.50",
  spent_on: "2026-11-25",
  category_id: "1",
  notes: "",
};

describe("expense form", () => {
  it("accepts decimal money strings and rejects invalid amounts", () => {
    expect(validateExpense(valid)).toEqual({});
    expect(validateExpense({ ...valid, amount: "-1.001" })).toHaveProperty(
      "amount",
    );
    expect(validateExpense({ ...valid, amount: "0" })).toHaveProperty("amount");
    expect(
      validateExpense({ ...valid, title: " ", category_id: "" }),
    ).toHaveProperty("category_id");
  });
  it("does not send a form with missing fields", async () => {
    const save = vi.fn();
    render(
      <ExpenseForm
        categories={categories}
        currency="CRC"
        onSave={save}
        onCancel={vi.fn()}
        onBusy={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Registrar gasto" }),
    );
    expect(screen.getByText("Selecciona una categoría.")).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
  it("sends the amount as text and the category as a number", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ExpenseForm
        categories={categories}
        currency="CRC"
        onSave={save}
        onCancel={vi.fn()}
        onBusy={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("Concepto *"), "Compra");
    await user.type(screen.getByLabelText("Monto (CRC) *"), "12.50");
    await user.selectOptions(screen.getByLabelText("Categoría *"), "1");
    await user.click(screen.getByRole("button", { name: "Registrar gasto" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Compra",
        amount: "12.50",
        category_id: 1,
      }),
    );
  });
  it("preserves the draft and shows backend field validation", async () => {
    const save = vi
      .fn()
      .mockRejectedValue(
        new ApiError("Revisa el monto.", { amount: ["Monto inválido"] }),
      );
    const expense = {
      id: 1,
      title: "Compra",
      amount: "12.50",
      spent_on: "2026-11-25",
      category: categories[0],
      notes: null,
      created_at: "",
    };
    render(
      <ExpenseForm
        expense={expense}
        categories={categories}
        currency="CRC"
        onSave={save}
        onCancel={vi.fn()}
        onBusy={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revisa el monto.",
    );
    expect(screen.getByText("Monto inválido")).toBeInTheDocument();
    expect(screen.getByLabelText("Concepto *")).toHaveValue("Compra");
  });
});
describe("category form", () => {
  it("rejects whitespace names", async () => {
    const save = vi.fn();
    render(<CategoryForm onSave={save} onCancel={vi.fn()} onBusy={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Crear categoría" }),
    );
    expect(
      screen.getByText("Escribe un nombre de hasta 80 caracteres."),
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
  it("shows a duplicate-name API failure", async () => {
    const save = vi
      .fn()
      .mockRejectedValue(
        new ApiError("Ya existe una categoría con ese nombre."),
      );
    render(
      <CategoryForm
        category={categories[0]}
        onSave={save}
        onCancel={vi.fn()}
        onBusy={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe");
    expect(screen.getByLabelText("Nombre de categoría *")).toHaveValue("Hogar");
  });
});
