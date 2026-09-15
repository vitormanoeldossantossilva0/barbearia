import { Link } from "react-router-dom";
import type { Barber } from "../types";

export function BarberCard({ barber }: { barber: Barber }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-800 transition hover:-translate-y-1 hover:border-amber-500/40">
      <div className="grid h-44 place-items-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-6xl">
        💈
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-black">{barber.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">
          {barber.description}
        </p>
        <Link
          to={`/barbers/${barber.id}`}
          className="mt-5 inline-flex font-bold text-amber-500 hover:text-amber-400"
        >
          Ver horários →
        </Link>
      </div>
    </article>
  );
}
