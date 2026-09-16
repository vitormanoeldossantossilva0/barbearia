import { useRef, useState, type ChangeEvent } from "react";
import { fileToDataUrl } from "../utils/image";

interface ImageUploadButtonProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  errorMessage?: (message: string) => void;
}

export function ImageUploadButton({
  value,
  onChange,
  label = "Adicionar imagem",
  errorMessage,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      onChange(await fileToDataUrl(file));
    } catch (error) {
      errorMessage?.(error instanceof Error ? error.message : "Erro ao carregar a imagem.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">▣</span>
        {loading ? "Processando imagem..." : value ? "Trocar imagem" : label}
      </button>
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
          <img src={value} alt="Prévia" className="h-44 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950 text-sm text-zinc-600">
          Nenhuma imagem selecionada
        </div>
      )}
    </div>
  );
}
