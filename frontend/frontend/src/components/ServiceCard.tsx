import type { Service } from "../types";

export function ServiceCard({
  service,
  showPrice = true,
}: {
  service: Service;
  showPrice?: boolean;
}) {
  const isCombo = service.category === "COMBO";
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/85 p-5 backdrop-blur-sm">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-xl text-amber-500">
        {isCombo ? "✦" : "✂"}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-zinc-600">
            {isCombo ? "Combo" : "Serviço"}
          </p>
          <h3 className="mt-1 font-bold text-white">{service.name}</h3>
        </div>
        {showPrice && (
          <span className="shrink-0 whitespace-nowrap text-sm font-black text-amber-500">
            R$ {service.price.toFixed(2).replace(".", ",")}
          </span>
        )}
      </div>
      {isCombo && service.comboItems?.length ? (
        <p className="mt-3 text-sm text-zinc-300">
          {service.comboItems.map((item) => item.service.name).join(" + ")}
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-300">
          Cuidado profissional para você sair renovado.
        </p>
      )}
    </article>
  );
}
