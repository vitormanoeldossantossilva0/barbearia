import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Loading } from "../components/Loading";
import { serviceService } from "../services/services";
import type { Service, ServiceCategory } from "../types";

const categoryMeta: Record<
  Exclude<ServiceCategory, "COMBO">,
  { title: string; description: string }
> = {
  CORTE: {
    title: "Cortes",
    description: "Cabelo, degradê, social, freestyle e outros estilos.",
  },
  BARBA: {
    title: "Barba",
    description: "Serviços de barba com preço próprio.",
  },
  SOBRANCELHA: {
    title: "Sobrancelha",
    description: "Serviços de sobrancelha.",
  },
  PINTURA: {
    title: "Pinturas",
    description: "Pintura, platinado, luzes e outras técnicas.",
  },
};

const normalCategories: Array<Exclude<ServiceCategory, "COMBO">> = [
  "CORTE",
  "BARBA",
  "SOBRANCELHA",
  "PINTURA",
];

export function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("CORTE");
  const [includedServiceIds, setIncludedServiceIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError("");
    try {
      setItems(await serviceService.mine());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const normalServices = useMemo(
    () => items.filter((service) => service.category !== "COMBO"),
    [items],
  );
  const combos = useMemo(
    () => items.filter((service) => service.category === "COMBO"),
    [items],
  );

  const open = (service?: Service, forcedCategory?: ServiceCategory) => {
    const nextCategory = forcedCategory ?? service?.category ?? "CORTE";
    setEditing(
      service ?? { id: 0, name: "", price: 0, category: nextCategory },
    );
    setName(service?.name ?? "");
    setPrice(service ? String(service.price) : "");
    setCategory(nextCategory);
    setIncludedServiceIds(
      service?.comboItems?.map((item) => item.serviceId) ?? [],
    );
    setError("");
    setMessage("");
  };

  const toggleIncluded = (serviceId: number) => {
    setIncludedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  };

  const save = async () => {
    const value = Number(price.replace(",", "."));
    if (name.trim().length < 2 || !Number.isFinite(value) || value < 0) {
      setError("Informe nome e preço válidos.");
      return;
    }
    if (category === "COMBO" && includedServiceIds.length < 2) {
      setError("Selecione pelo menos dois serviços para montar o combo.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        price: value,
        category,
        ...(category === "COMBO" ? { includedServiceIds } : {}),
      };

      if (editing?.id) {
        await serviceService.update(editing.id, payload);
        setMessage("Serviço atualizado com sucesso.");
      } else {
        await serviceService.create(payload);
        setMessage("Serviço criado com sucesso.");
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar serviço.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await serviceService.remove(deleting.id);
      setDeleting(null);
      setMessage("Serviço excluído.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir serviço.");
    }
  };

  const serviceCard = (service: Service) => (
    <article
      key={service.id}
      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900 p-4"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="font-bold text-white">{service.name}</p>
          <p className="whitespace-nowrap text-sm font-black text-amber-500">
            R$ {service.price.toFixed(2).replace(".", ",")}
          </p>
        </div>
        {service.category === "COMBO" && (
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            {service.comboItems?.map((item) => item.service.name).join(" + ") ||
              "Sem itens"}
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => open(service)}
          className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/10"
        >
          Editar
        </button>
        <button
          onClick={() => setDeleting(service)}
          className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/15"
        >
          Excluir
        </button>
      </div>
    </article>
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-black">Serviços</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
          Organize seus serviços por categoria e monte combos sem misturar
          opções redundantes. Cada preço continua sendo exclusivo do barbeiro
          logado.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">
                  Serviços individuais
                </p>
                <h3 className="mt-1 text-xl font-black">Cortes e cuidados</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Cabelo, barba e sobrancelha ficam separados para facilitar a
                  escolha do cliente.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {normalCategories.slice(0, 3).map((itemCategory) => {
                const categoryItems = normalServices.filter(
                  (service) => service.category === itemCategory,
                );
                return (
                  <div key={itemCategory}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-black">
                          {categoryMeta[itemCategory].title}
                        </h4>
                        <p className="text-xs text-zinc-600">
                          {categoryMeta[itemCategory].description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => open(undefined, itemCategory)}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-zinc-950"
                      >
                        + Novo
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryItems.map(serviceCard)}
                      {categoryItems.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-5 text-sm text-zinc-600">
                          Nenhum serviço cadastrado nesta categoria.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">
                  Técnicas
                </p>
                <h3 className="mt-1 text-xl font-black">Pinturas</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Platinado, luzes, pintura e outras técnicas ficam em uma área
                  própria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => open(undefined, "PINTURA")}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950"
              >
                + Nova pintura
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {normalServices
                .filter((service) => service.category === "PINTURA")
                .map(serviceCard)}
              {normalServices.filter(
                (service) => service.category === "PINTURA",
              ).length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-5 text-sm text-zinc-600">
                  Nenhuma pintura cadastrada.
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">
                  Combinações
                </p>
                <h3 className="mt-1 text-xl font-black">Combos</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Monte uma oferta com serviços diferentes e defina um único
                  preço para o combo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => open(undefined, "COMBO")}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950"
              >
                + Novo combo
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {combos.map(serviceCard)}
              {combos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-5 text-sm text-zinc-600">
                  Nenhum combo cadastrado.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {editing && (
        <Modal
          title={
            editing.id
              ? `Editar ${editing.name}`
              : category === "COMBO"
                ? "Novo combo"
                : category === "CORTE"
                  ? "Novo corte"
                  : category === "BARBA"
                    ? "Nova barba"
                    : category === "SOBRANCELHA"
                      ? "Nova sobrancelha"
                      : "Nova pintura"
          }
          onClose={() => !saving && setEditing(null)}
        >
          <div className="space-y-4">
            {category === "COMBO" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-zinc-400">
                Escolha os serviços que formarão o combo. Você pode combinar
                categorias diferentes, mas não pode repetir a mesma categoria.
              </div>
            )}
            <label className="block text-sm font-bold">
              Tipo
              {category === "COMBO" ? (
                <input
                  value="Combo"
                  readOnly
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-zinc-400 outline-none"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ServiceCategory)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-white outline-none focus:border-amber-500"
                >
                  <option value="CORTE">Corte / cabelo</option>
                  <option value="BARBA">Barba</option>
                  <option value="SOBRANCELHA">Sobrancelha</option>
                  <option value="PINTURA">Pintura</option>
                </select>
              )}
            </label>
            <label className="block text-sm font-bold">
              Nome
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  category === "COMBO"
                    ? "Ex.: Corte + Barba"
                    : "Ex.: Corte degradê"
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-white outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              Preço
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="30,00"
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-white outline-none focus:border-amber-500"
              />
            </label>

            {category === "COMBO" && (
              <div>
                <div className="mb-2">
                  <p className="text-sm font-bold">
                    Quais serviços fazem parte deste combo?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Escolha no mínimo dois. O sistema impede colocar duas opções
                    da mesma categoria.
                  </p>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-3">
                  {normalServices.map((service) => {
                    const selected = includedServiceIds.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleIncluded(service.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${selected ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-white/[.02] hover:border-white/15"}`}
                      >
                        <span>
                          <span className="block text-sm font-bold text-white">
                            {service.name}
                          </span>
                          <span className="text-xs text-zinc-600">
                            {service.category === "COMBO"
                              ? "Combo"
                              : categoryMeta[service.category].title}
                          </span>
                        </span>
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${selected ? "border-amber-500 bg-amber-500 text-zinc-950" : "border-zinc-700 text-transparent"}`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                  {normalServices.length === 0 && (
                    <p className="p-3 text-sm text-zinc-600">
                      Cadastre serviços individuais antes de criar um combo.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              disabled={saving}
              onClick={save}
              className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir serviço?"
          message={`Deseja excluir ${deleting.name}? Se ele fizer parte de um combo, primeiro remova o serviço desse combo.`}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          confirmLabel="Excluir"
        />
      )}
    </AdminLayout>
  );
}
