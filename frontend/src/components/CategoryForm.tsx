import { useState } from "react";
import type { FormEvent } from "react";
import type { Category, CategoryInput } from "../types";
import { ApiError, errorMessage } from "../services/api";
import { ErrorPanel } from "./Feedback";
export const categoryColors = [
  "#6375cf",
  "#e7a85b",
  "#5da88c",
  "#c87893",
  "#8b75b5",
  "#64748b",
];

// Draft state remains visible if the server rejects a duplicate category.
export function CategoryForm({
  category,
  onSave,
  onCancel,
  onBusy,
}: {
  category?: Category;
  onSave: (input: CategoryInput) => Promise<void>;
  onCancel: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || categoryColors[0]);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNameError("");
    if (!name.trim() || name.trim().length > 80) {
      setNameError("Escribe un nombre de hasta 80 caracteres.");
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      await onSave({ name: name.trim(), color });
    } catch (reason) {
      setError(errorMessage(reason));
      if (reason instanceof ApiError)
        setNameError(reason.errors.name?.[0] || "");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      {error && <ErrorPanel message={error} />}
      <fieldset disabled={busy}>
        <label htmlFor="category-name">Nombre de categoría *</label>
        <input
          id="category-name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="Ej. Alimentación"
          aria-invalid={!!nameError}
          aria-describedby="category-name-error"
        />
        <small id="category-name-error" className="field-error">
          {nameError}
        </small>
        <div className="color-field">
          <label htmlFor="category-color">Color de identificación</label>
          <input
            id="category-color"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </div>
        <div className="color-options">
          {categoryColors.map((value) => (
            <button
              key={value}
              type="button"
              className={
                color === value ? "color-option selected" : "color-option"
              }
              style={{ backgroundColor: value }}
              onClick={() => setColor(value)}
              aria-label={`Usar color ${value}`}
              aria-pressed={color === value}
            />
          ))}
        </div>
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            {busy
              ? "Guardando…"
              : category
                ? "Guardar cambios"
                : "Crear categoría"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
