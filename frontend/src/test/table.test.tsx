import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExpenseTable } from "../components/ExpenseTable";
describe("expense list", () => {
  it("communicates the selected record through an edit callback", async () => {
    const expense = {
      id: 1,
      title: "Compra",
      amount: "12.50",
      spent_on: "2026-11-25",
      notes: null,
      created_at: "",
      category: { id: 1, name: "Hogar", color: "#64748b" },
    };
    const edit = vi.fn();
    render(
      <ExpenseTable
        expenses={[expense]}
        currency="CRC"
        onEdit={edit}
        onDelete={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Editar Compra" }),
    );
    expect(edit).toHaveBeenCalledWith(expense);
  });
  it("shows an honest empty state instead of example records", () => {
    render(
      <ExpenseTable
        expenses={[]}
        currency="CRC"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Tu registro empieza aquí")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
