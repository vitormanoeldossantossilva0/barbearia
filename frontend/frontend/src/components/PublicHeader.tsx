import { Logo } from "./Logo";

export function PublicHeader({ shopSlug, shopName }: { shopSlug?: string; shopName?: string }) {
  const homeHref = shopSlug ? `/${encodeURIComponent(shopSlug)}` : "/";
  const anchor = (section: string) => `${homeHref}#${section}`;
  const bookingHref = shopSlug
    ? `/${encodeURIComponent(shopSlug)}/booking`
    : "/";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/20 bg-black/20 px-4 py-2.5 shadow-2xl shadow-black/20 backdrop-blur-md sm:px-5">
        <Logo homeHref={homeHref} name={shopName || "BARBEARIA"} />

        <nav className="hidden items-center gap-1 rounded-full border border-white/20 bg-black/15 p-1 backdrop-blur-md md:flex">
          <a href={anchor("inicio")} className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-amber-500 hover:text-zinc-950">
            Início
          </a>
          <a href={anchor("servicos")} className="rounded-full px-4 py-2 text-xs font-medium text-zinc-100 transition hover:bg-white/15 hover:text-white">
            Serviços
          </a>
          <a href={anchor("barbeiros")} className="rounded-full px-4 py-2 text-xs font-medium text-zinc-100 transition hover:bg-white/15 hover:text-white">
            Barbeiros
          </a>
        </nav>

        <a href={bookingHref} className="rounded-full bg-amber-500 px-4 py-2.5 text-xs font-black text-zinc-950 transition hover:bg-amber-400 sm:px-5">
          Agendar horário
        </a>
      </div>
    </header>
  );
}
