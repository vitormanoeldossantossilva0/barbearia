export function Logo() {
  return (
    <a
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="Barbearia - início"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-xl font-black text-zinc-950 transition group-hover:rotate-6">
        ✂
      </span>
      <span className="text-lg font-black tracking-tight text-white">
        BARBEARIA<span className="text-amber-500">.</span>
      </span>
    </a>
  );
}
