import type { ReactNode } from "react";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <h2 className="min-w-0 text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-5 scrollbar-invisible">
          {children}
        </div>
      </div>
    </div>
  );
}
