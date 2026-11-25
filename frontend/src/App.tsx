import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Plus,
  ReceiptText,
  Search,
  Tags,
  Wallet,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { categoryService, expenseService } from "./services/expenses";
import { errorMessage } from "./services/api";
import { useResource } from "./hooks/useResource";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import type {
  Category,
  CategoryInput,
  Expense,
  ExpenseInput,
  Filters,
} from "./types";
import { Modal } from "./components/Modal";
import { ExpenseForm } from "./components/ExpenseForm";
import { CategoryForm } from "./components/CategoryForm";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { ExpenseTable } from "./components/ExpenseTable";
import {
  Empty,
  ErrorPanel,
  Loading,
  localDate,
  money,
} from "./components/Feedback";

type Page = "overview" | "expenses" | "categories";
type Editor =
  | { kind: "expense"; expense?: Expense }
  | { kind: "category"; category?: Category };
type Deletion = { kind: "expense" | "category"; id: number; name: string };
const initialFilters: Filters = {
  month: localDate().slice(0, 7),
  search: "",
  category_id: "",
  page: 1,
  per_page: 10,
  sort: "spent_on",
  direction: "desc",
};

// App coordinates server data and actions. Forms keep their own unsaved drafts.
export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<Editor>();
  const [deletion, setDeletion] = useState<Deletion>();
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notification, setNotification] = useState("");
  const debouncedSearch = useDebouncedValue(filters.search);
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  // useCallback keeps loader identity stable until the selected filters change.
  const loadLedger = useCallback(
    async (signal: AbortSignal) => {
      const [expenses, summary] = await Promise.all([
        expenseService.list(effectiveFilters, signal),
        expenseService.summary(effectiveFilters, signal),
      ]);
      return { expenses, summary };
    },
    [effectiveFilters],
  );
  const loadCategories = useCallback(
    (signal: AbortSignal) => categoryService.list(signal),
    [],
  );
  const ledger = useResource(loadLedger, revision);
  const categories = useResource(loadCategories, revision);
  const summary = ledger.data?.summary;
  const currency = summary?.currency || "CRC";
  const refresh = () => setRevision((current) => current + 1);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(""), 4500);
    return () => clearTimeout(timer);
  }, [notification]);
  // Deleting the last row should not leave the user on an unavailable page.
  useEffect(() => {
    const lastPage = ledger.data?.expenses.meta.last_page;
    if (!ledger.loading && lastPage && filters.page > lastPage)
      setFilters((current) => ({ ...current, page: lastPage }));
  }, [ledger.data, ledger.loading, filters.page]);

  function filter<K extends keyof Filters>(name: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: name === "page" ? Number(value) : 1,
    }));
  }
  function navigate(next: Page) {
    setPage(next);
    setMobileMenu(false);
  }
  function closeEditor() {
    setEditor(undefined);
  }
  function confirmDelete(target: Deletion) {
    setDeleteError("");
    setDeletion(target);
  }

  // The modal closes only after the backend confirms a successful save.
  async function saveExpense(input: ExpenseInput) {
    if (editor?.kind === "expense" && editor.expense)
      await expenseService.update(editor.expense.id, input);
    else await expenseService.create(input);
    setNotification("Gasto guardado correctamente.");
    closeEditor();
    refresh();
  }
  async function saveCategory(input: CategoryInput) {
    if (editor?.kind === "category" && editor.category)
      await categoryService.update(editor.category.id, input);
    else await categoryService.create(input);
    setNotification("Categoría guardada correctamente.");
    closeEditor();
    refresh();
  }
  async function removeRecord() {
    if (!deletion || busy) return;
    setBusy(true);
    setDeleteError("");
    try {
      if (deletion.kind === "expense") await expenseService.remove(deletion.id);
      else {
        await categoryService.remove(deletion.id);
        if (filters.category_id === String(deletion.id))
          filter("category_id", "");
      }
      setDeletion(undefined);
      setNotification("Registro eliminado.");
      refresh();
    } catch (reason) {
      setDeleteError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <div className="mobile-header">
        <span className="brand">
          clara<span>.</span>
        </span>
        <button
          className="icon-button"
          aria-label={mobileMenu ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenu}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </div>
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand desktop-brand">
          clara<span>.</span>
          <small>MENOS DUDAS, MÁS CLARIDAD</small>
        </div>
        <div className="workspace">
          <span className="workspace-icon">
            <Wallet size={18} />
          </span>
          <div>
            <strong>Mis finanzas</strong>
            <small>Espacio personal</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">MI ESPACIO</p>
        <nav aria-label="Navegación principal">
          {[
            {
              key: "overview" as const,
              label: "Resumen",
              icon: LayoutDashboard,
            },
            {
              key: "expenses" as const,
              label: "Mis gastos",
              icon: ReceiptText,
            },
            { key: "categories" as const, label: "Categorías", icon: Tags },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={page === key ? "nav-item active" : "nav-item"}
              aria-current={page === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <Icon size={19} />
              {label}
              {page === key && <span />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">✦</span>
            <h3>
              Los pequeños hábitos
              <br />
              hacen la diferencia.
            </h3>
            <p>Registrar tus gastos hoy es cuidar de tu tranquilidad mañana.</p>
          </div>
          <div className="profile">
            <span>MP</span>
            <div>
              <strong>Mi cuenta personal</strong>
              <small>Un paso a la vez</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <span>
            Mi espacio <ChevronRight size={13} />{" "}
            <strong>
              {page === "overview"
                ? "Resumen"
                : page === "expenses"
                  ? "Mis gastos"
                  : "Categorías"}
            </strong>
          </span>
          <div>
            <span className="local-dot" /> Registro personal{" "}
            <span className="avatar">MP</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                UN POCO DE ORDEN, MUCHA TRANQUILIDAD
              </span>
              <h1>
                {page === "overview"
                  ? "Tus gastos, bajo control."
                  : page === "expenses"
                    ? "Cada gasto, en su lugar."
                    : "Organiza a tu manera."}
              </h1>
              <p>
                {page === "overview"
                  ? "Una mirada clara a dónde va tu dinero."
                  : page === "expenses"
                    ? "Consulta, registra y actualiza tus movimientos."
                    : "Agrupa tus gastos y entiende mejor tus hábitos."}
              </p>
            </div>
            <button
              className="button primary"
              onClick={() =>
                setEditor(
                  page === "categories"
                    ? { kind: "category" }
                    : { kind: "expense" },
                )
              }
            >
              <Plus size={17} />
              {page === "categories" ? "Nueva categoría" : "Registrar gasto"}
            </button>
          </div>
          {page !== "categories" && (
            <>
              <div className="period-bar">
                <div className="period-label">
                  <CalendarDays size={17} />
                  <label htmlFor="month-filter">Tu periodo</label>
                  <input
                    id="month-filter"
                    type="month"
                    value={filters.month}
                    onChange={(e) => filter("month", e.target.value)}
                  />
                </div>
                <button
                  className="text-button"
                  onClick={() =>
                    setFilters({
                      ...initialFilters,
                      month: "",
                      search: "",
                      page: 1,
                    })
                  }
                >
                  Ver todo el historial <ArrowUpRight size={14} />
                </button>
              </div>
              {ledger.loading ? (
                <Loading />
              ) : ledger.error ? (
                <ErrorPanel message={ledger.error} retry={refresh} />
              ) : (
                summary && (
                  <>
                    <div className="stats-grid">
                      {[
                        {
                          label: "Gastos del periodo",
                          value: money(summary.total, currency),
                          detail: "El total de tus registros",
                          icon: Wallet,
                          tone: "violet",
                        },
                        {
                          label: "Movimientos",
                          value: String(summary.count),
                          detail: "Gastos registrados",
                          icon: ArrowDownLeft,
                          tone: "blue",
                        },
                        {
                          label: "Promedio por gasto",
                          value: money(summary.average, currency),
                          detail: "Un vistazo a tus hábitos",
                          icon: CircleDollarSign,
                          tone: "mint",
                        },
                        {
                          label: "Categorías utilizadas",
                          value: String(summary.category_count),
                          detail: "Así se distribuyen tus gastos",
                          icon: Tags,
                          tone: "peach",
                        },
                      ].map(({ label, value, detail, icon: Icon, tone }) => (
                        <section key={label} className={`stat-card ${tone}`}>
                          <div>
                            <span>{label}</span>
                            <span className="stat-icon">
                              <Icon size={19} />
                            </span>
                          </div>
                          <strong>{value}</strong>
                          <small>{detail}</small>
                        </section>
                      ))}
                    </div>
                  </>
                )
              )}
              <div className={page === "overview" ? "ledger-grid" : ""}>
                <section className="panel ledger-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        {page === "overview"
                          ? "Tus últimos movimientos"
                          : "Todos tus gastos"}
                      </h2>
                      <p>Los detalles también importan.</p>
                    </div>
                    <span className="count-badge">
                      {ledger.data?.expenses.meta.total ?? "—"} registros
                    </span>
                  </div>
                  <div className="filters">
                    <div className="search">
                      <Search size={16} />
                      <input
                        aria-label="Buscar gastos por concepto"
                        placeholder="Buscar un gasto…"
                        value={filters.search}
                        onChange={(e) => filter("search", e.target.value)}
                        maxLength={150}
                      />
                    </div>
                    <select
                      aria-label="Filtrar por categoría"
                      value={filters.category_id}
                      onChange={(e) => filter("category_id", e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {categories.data?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Ordenar gastos"
                      value={`${filters.sort}:${filters.direction}`}
                      onChange={(e) => {
                        const [sort, direction] = e.target.value.split(":");
                        setFilters((current) => ({
                          ...current,
                          sort,
                          direction,
                          page: 1,
                        }));
                      }}
                    >
                      <option value="spent_on:desc">Más recientes</option>
                      <option value="spent_on:asc">Más antiguos</option>
                      <option value="amount:desc">Mayor monto</option>
                      <option value="amount:asc">Menor monto</option>
                      <option value="title:asc">Concepto A–Z</option>
                    </select>
                  </div>
                  {ledger.loading ? (
                    <Loading />
                  ) : ledger.error ? (
                    <ErrorPanel message={ledger.error} retry={refresh} />
                  ) : (
                    <ExpenseTable
                      expenses={ledger.data?.expenses.data || []}
                      currency={currency}
                      onEdit={(expense) =>
                        setEditor({ kind: "expense", expense })
                      }
                      onDelete={(expense) =>
                        confirmDelete({
                          kind: "expense",
                          id: expense.id,
                          name: expense.title,
                        })
                      }
                    />
                  )}
                  <div className="pagination">
                    <span>
                      Página {ledger.data?.expenses.meta.current_page ?? 1} de{" "}
                      {ledger.data?.expenses.meta.last_page ?? 1}
                    </span>
                    <div>
                      <button
                        className="icon-button"
                        aria-label="Página anterior"
                        disabled={ledger.loading || filters.page <= 1}
                        onClick={() => filter("page", filters.page - 1)}
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Página siguiente"
                        disabled={
                          ledger.loading ||
                          filters.page >=
                            (ledger.data?.expenses.meta.last_page ?? 1)
                        }
                        onClick={() => filter("page", filters.page + 1)}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                </section>
                {page === "overview" &&
                  summary &&
                  !ledger.loading &&
                  !ledger.error && <CategoryBreakdown summary={summary} />}
              </div>
              {categories.error && (
                <ErrorPanel message={categories.error} retry={refresh} />
              )}
              {page === "overview" && (
                <section className="gentle-note">
                  <span>✦</span>
                  <div>
                    <h3>Claridad para tomar mejores decisiones.</h3>
                    <p>
                      No se trata de dejar de gastar, sino de saber en qué estás
                      gastando.
                    </p>
                  </div>
                  <span className="note-tag">A tu ritmo.</span>
                </section>
              )}
            </>
          )}
          {page === "categories" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Tus categorías</h2>
                  <p>Un lugar para cada tipo de gasto.</p>
                </div>
                <span className="count-badge">
                  {categories.data?.length ?? 0} categorías
                </span>
              </div>
              {categories.loading ? (
                <Loading />
              ) : categories.error ? (
                <ErrorPanel message={categories.error} retry={refresh} />
              ) : !categories.data?.length ? (
                <Empty
                  title="Dale un nombre a tus hábitos"
                  text="Crea tu primera categoría antes de registrar un gasto."
                />
              ) : (
                <div className="category-grid">
                  {categories.data.map((category) => (
                    <article className="category-card" key={category.id}>
                      <span
                        className="category-symbol"
                        style={{
                          color: category.color,
                          backgroundColor: `${category.color}18`,
                        }}
                      >
                        <Tags size={22} />
                      </span>
                      <h3>{category.name}</h3>
                      <p>{category.expenses_count ?? 0} gastos registrados</p>
                      <div className="category-actions">
                        <button
                          className="button secondary"
                          onClick={() =>
                            setEditor({ kind: "category", category })
                          }
                        >
                          <Pencil size={13} />
                          Editar
                        </button>
                        <button
                          className="icon-button danger-text"
                          aria-label={`Eliminar ${category.name}`}
                          onClick={() =>
                            confirmDelete({
                              kind: "category",
                              id: category.id,
                              name: category.name,
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="category-note">
                Para eliminar una categoría, primero mueve o elimina los gastos
                asociados.
              </p>
            </section>
          )}
        </main>
        <footer>
          <span>
            clara. <span>Tu dinero, con más claridad.</span>
          </span>
          <span>Hecho para aprender · Laravel + React</span>
        </footer>
      </div>
      {editor && (
        <Modal
          key={
            editor.kind === "expense"
              ? `expense-${editor.expense?.id || "new"}`
              : `category-${editor.category?.id || "new"}`
          }
          title={
            editor.kind === "expense"
              ? editor.expense
                ? "Editar gasto"
                : "Registrar un gasto"
              : editor.category
                ? "Editar categoría"
                : "Nueva categoría"
          }
          busy={busy}
          onClose={closeEditor}
        >
          {editor.kind === "category" ? (
            <CategoryForm
              category={editor.category}
              onSave={saveCategory}
              onCancel={closeEditor}
              onBusy={setBusy}
            />
          ) : categories.loading ? (
            <Loading />
          ) : categories.error ? (
            <ErrorPanel message={categories.error} retry={refresh} />
          ) : !categories.data?.length ? (
            <div className="empty">
              <Tags size={30} />
              <h3>Primero, una categoría</h3>
              <p>Crea una categoría para organizar tu primer gasto.</p>
              <button
                className="button primary"
                onClick={() => setEditor({ kind: "category" })}
              >
                Crear categoría
              </button>
            </div>
          ) : (
            <ExpenseForm
              expense={editor.expense}
              categories={categories.data}
              currency={currency}
              onSave={saveExpense}
              onCancel={closeEditor}
              onBusy={setBusy}
            />
          )}
        </Modal>
      )}
      {deletion && (
        <Modal
          title="¿Eliminar este registro?"
          busy={busy}
          onClose={() => setDeletion(undefined)}
        >
          <p className="delete-description">
            Vas a eliminar <strong>{deletion.name}</strong>. Esta acción no se
            puede deshacer.
          </p>
          {deleteError && <ErrorPanel message={deleteError} />}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeletion(undefined)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={removeRecord}
            >
              {busy ? "Eliminando…" : "Eliminar registro"}
            </button>
          </div>
        </Modal>
      )}
      {notification && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {notification}
          <button
            className="icon-button"
            aria-label="Cerrar notificación"
            onClick={() => setNotification("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
