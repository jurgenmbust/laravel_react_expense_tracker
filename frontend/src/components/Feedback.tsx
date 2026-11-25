import { AlertCircle, LoaderCircle, ReceiptText } from "lucide-react";
export function Loading() {
  return (
    <div className="empty" role="status">
      <LoaderCircle className="spin" size={25} />
      <p>Cargando tus datos…</p>
    </div>
  );
}
export function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <ReceiptText size={27} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
// Number conversion is only for display. The API calculates exact money totals.
export const money = (amount: string, currency: string) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
export const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
export const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
