export function Loading({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-zinc-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
      {text}
    </div>
  );
}
