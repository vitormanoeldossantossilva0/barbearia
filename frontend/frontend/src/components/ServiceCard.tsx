import type { Service } from "../types";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-xl text-amber-500">
        ✦
      </div>
      <h3 className="font-bold text-white">{service.name}</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Cuidado profissional para você sair renovado.
      </p>
    </article>
  );
}
