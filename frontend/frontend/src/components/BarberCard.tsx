import { Link } from "react-router-dom";
import type { Barber } from "../types";
import { SocialLinks } from "./SocialLinks";

export function BarberCard({
  barber,
  barbershopSlug,
}: {
  barber: Barber;
  barbershopSlug?: string;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition-colors duration-300 hover:border-amber-500/40">
      <div className="relative h-72 overflow-hidden bg-zinc-950 sm:h-80">
        {barber.imageUrl ? (
          <img
            src={barber.imageUrl}
            alt={`Foto de ${barber.name}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-7xl">
            💈
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-gradient-to-t from-black/75 via-black/55 to-transparent px-5 pb-4 pt-7 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_0%,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_72%,transparent_100%)]">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-400">
            Barbeiro
          </p>
          <h3 className="mt-1 text-xl font-black text-white">{barber.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-300">
            {barber.description || "Profissional da barbearia"}
          </p>
          <div className="mt-2">
            <SocialLinks
              instagram={barber.instagram}
              facebook={barber.facebook}
              tiktok={barber.tiktok}
              light
              label=""
            />
          </div>
        </div>
      </div>
      <div className="p-4">
        <Link
          to={
            barbershopSlug
              ? `/${encodeURIComponent(barbershopSlug)}/barbers/${barber.id}`
              : "/"
          }
          className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 font-black text-zinc-950 transition hover:bg-amber-400"
        >
          Encontrar um horário
        </Link>
      </div>
    </article>
  );
}
