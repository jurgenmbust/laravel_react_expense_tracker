import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

// Native dialogs trap focus, support Escape and restore focus after closing.
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">TU REGISTRO PERSONAL</span>
          <h2 id={id}>{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Cerrar diálogo"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
