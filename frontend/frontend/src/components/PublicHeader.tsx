import { Logo } from "./Logo";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-300 md:flex">
          <a href="/#inicio" className="transition hover:text-white">
            Início
          </a>
          <a href="/#servicos" className="transition hover:text-white">
            Serviços
          </a>
          <a href="/#barbeiros" className="transition hover:text-white">
            Barbeiros
          </a>
          <a
            href="/booking"
            className="rounded-full bg-amber-500 px-5 py-2.5 font-bold text-zinc-950 transition hover:bg-amber-400"
          >
            Agendar horário
          </a>
        </nav>
        <a
          href="/booking"
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950 md:hidden"
        >
          Agendar
        </a>
      </div>
    </header>
  );
}
