type LogoProps = { homeHref?: string; name?: string };

export function Logo({ homeHref = "/", name = "BARBEARIA" }: LogoProps) {
  return (
    <a
      href={homeHref}
      className="group inline-flex min-w-0 items-center gap-3"
      aria-label={`${name} - início`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-lg font-black text-zinc-950 transition group-hover:rotate-6">
        ✂
      </span>
      <span className="max-w-[10rem] break-words text-sm font-black leading-tight tracking-tight text-white sm:max-w-[18rem] sm:text-lg">
        {name}<span className="text-amber-500">.</span>
      </span>
    </a>
  );
}
