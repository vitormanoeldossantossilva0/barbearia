import { Modal } from "./Modal";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onClose,
  danger = true,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-zinc-400">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/5"
        >
          Voltar
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-950 ${danger ? "bg-red-400 hover:bg-red-300" : "bg-amber-500 hover:bg-amber-400"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
