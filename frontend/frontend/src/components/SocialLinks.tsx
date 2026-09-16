import type { ReactNode } from "react";

type SocialLink = { label: string; href?: string | null; icon: ReactNode };

const iconClass = "h-4 w-4";

export function SocialLinks({
  instagram,
  facebook,
  tiktok,
  light = false,
  label = "Redes sociais",
}: {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  light?: boolean;
  label?: string;
}) {
  const links: SocialLink[] = [
    {
      label: "Instagram",
      href: instagram,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={iconClass}
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: facebook,
      icon: <span className="text-sm font-black leading-none">f</span>,
    },
    {
      label: "TikTok",
      href: tiktok,
      icon: <span className="text-[11px] font-black leading-none">tk</span>,
    },
  ];

  const visible = links.filter((link) => Boolean(link.href));
  if (!visible.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span
          className={`mr-1 text-xs font-bold uppercase tracking-[.16em] ${light ? "text-zinc-400" : "text-zinc-500"}`}
        >
          {label}
        </span>
      )}
      {visible.map((link) => (
        <a
          key={link.label}
          href={link.href!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          title={link.label}
          className={`grid h-9 w-9 place-items-center rounded-full border transition ${
            light
              ? "border-white/15 bg-white/5 text-zinc-200 hover:border-amber-500 hover:bg-amber-500 hover:text-zinc-950"
              : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-amber-500 hover:bg-amber-500 hover:text-zinc-950"
          }`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
