import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { Loading } from "../components/Loading";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { serviceService } from "../services/services";
import { serviceTopicService } from "../services/serviceTopics";
import { authService } from "../services/auth";
import type { Service, ServiceCategory, ServiceTopic } from "../types";

const categoryLabels: Record<ServiceCategory, string> = {
  CORTE: "Corte",
  BARBA: "Barba",
  SOBRANCELHA: "Sobrancelha",
  PINTURA: "Pintura",
  COMBO: "Combo",
};

const emptyTopicForm = { name: "", description: "", imageUrl: "" };

export function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [topics, setTopics] = useState<ServiceTopic[]>([]);
  const [canManageTopics, setCanManageTopics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("CORTE");
  const [topicId, setTopicId] = useState<number | "">("");
  const [includedServiceIds, setIncludedServiceIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [topicModal, setTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ServiceTopic | null>(null);
  const [topicForm, setTopicForm] = useState(emptyTopicForm);
  const [savingTopic, setSavingTopic] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [services, serviceTopics, account] = await Promise.all([
        serviceService.mine(),
        serviceTopicService.mine(),
        authService.me(),
      ]);
      setItems(services);
      setTopics(serviceTopics);
      setCanManageTopics(account.user.role === "ADMIN");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const normalServices = useMemo(() => items.filter((service) => service.category !== "COMBO"), [items]);
  const combos = useMemo(() => items.filter((service) => service.category === "COMBO"), [items]);

  const openService = (service?: Service, forcedTopicId?: number) => {
    const nextTopic = forcedTopicId ?? service?.topicId ?? topics[0]?.id ?? "";
    setEditing(service ?? { id: 0, name: "", price: 0, category: "CORTE", topicId: typeof nextTopic === "number" ? nextTopic : null });
    setName(service?.name ?? "");
    setPrice(service ? String(service.price) : "");
    setCategory(service?.category ?? "CORTE");
    setTopicId(nextTopic);
    setIncludedServiceIds(service?.comboItems?.map((item) => item.serviceId) ?? []);
    setError("");
  };

  const toggleIncluded = (serviceId: number) => {
    setIncludedServiceIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  };

  const saveService = async () => {
    const value = Number(price.replace(",", "."));
    if (name.trim().length < 2 || !Number.isFinite(value) || value < 0) {
      setError("Informe nome e preço válidos.");
      return;
    }
    if (!topicId) {
      setError("Selecione o tópico que deve aparecer na Home.");
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
        topicId: Number(topicId),
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

  const removeService = async () => {
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

  const openTopic = (topic?: ServiceTopic) => {
    setEditingTopic(topic ?? null);
    setTopicForm({ name: topic?.name ?? "", description: topic?.description ?? "", imageUrl: topic?.imageUrl ?? "" });
    setTopicModal(true);
    setError("");
  };

  const saveTopic = async () => {
    if (topicForm.name.trim().length < 2) {
      setError("Informe um nome válido para o tópico.");
      return;
    }
    setSavingTopic(true);
    setError("");
    try {
      if (editingTopic) {
        await serviceTopicService.update(editingTopic.id, topicForm);
        setMessage("Tópico atualizado com sucesso.");
      } else {
        await serviceTopicService.create(topicForm);
        setMessage("Tópico criado com sucesso.");
      }
      setTopicModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar tópico.");
    } finally {
      setSavingTopic(false);
    }
  };

  const removeTopic = async (topic: ServiceTopic) => {
    const confirmed = window.confirm(
      topic._count?.services
        ? `Excluir o tópico ${topic.name}? Os serviços continuarão cadastrados, mas ficarão sem tópico até serem reclassificados.`
        : `Excluir o tópico ${topic.name}?`,
    );
    if (!confirmed) return;
    try {
      await serviceTopicService.remove(topic.id);
      setMessage("Tópico excluído.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir tópico.");
    }
  };

  const serviceCard = (service: Service) => (
    <article key={service.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">{service.name}</p>
          <p className="mt-1 text-xs text-zinc-600">{categoryLabels[service.category]}</p>
        </div>
        <p className="whitespace-nowrap text-sm font-black text-amber-500">R$ {service.price.toFixed(2).replace(".", ",")}</p>
      </div>
      {service.category === "COMBO" && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {service.comboItems?.map((item) => item.service.name).join(" + ") || "Sem itens"}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => openService(service)} className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/10">Editar</button>
        <button type="button" onClick={() => setDeleting(service)} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/15">Excluir</button>
      </div>
    </article>
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black">Serviços</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
            Crie os tópicos que aparecerão na Home e coloque cada serviço dentro do tópico certo. Os preços continuam exclusivos de cada barbeiro.
          </p>
        </div>
        {canManageTopics && (
          <button type="button" onClick={() => openTopic()} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950 hover:bg-amber-400">+ Novo tópico</button>
        )}
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {message && <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>}

      {loading ? <Loading /> : (
        <div className="space-y-8">
          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">Tópicos da Home</p>
              <h3 className="mt-1 text-xl font-black">Organização dos serviços</h3>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {topics.map((topic) => {
                const topicServices = normalServices.filter((service) => service.topicId === topic.id);
                const topicCombos = combos.filter((service) => service.topicId === topic.id);
                return (
                  <section key={topic.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                    <div className="relative mb-4 h-28 overflow-hidden rounded-xl border border-white/10">
                      <img src={topic.imageUrl || "/images/barbershop-bg.png"} alt="" className="h-full w-full object-cover opacity-70" />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black">{topic.name}</h4>
                        <p className="mt-1 text-sm text-zinc-500">{topic.description || "Sem descrição."}</p>
                      </div>
                      {canManageTopics && (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openTopic(topic)} className="rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white">Editar</button>
                          <button type="button" onClick={() => removeTopic(topic)} className="rounded-lg px-2.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10">Excluir</button>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => openService(undefined, topic.id)} className="mt-4 w-full rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 py-2.5 text-sm font-black text-amber-400 hover:bg-amber-500/10">+ Adicionar serviço neste tópico</button>
                    <div className="mt-4 grid gap-3">
                      {topicServices.map(serviceCard)}
                      {topicCombos.map(serviceCard)}
                      {topicServices.length === 0 && topicCombos.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-600">Nenhum serviço neste tópico.</div>}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          {items.some((service) => !service.topicId) && (
            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="font-black text-amber-400">Serviços sem tópico</h3>
              <p className="mt-1 text-sm text-zinc-400">Edite estes serviços e escolha em qual tópico eles devem aparecer na Home.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.filter((service) => !service.topicId).map(serviceCard)}
              </div>
            </section>
          )}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? `Editar ${editing.name}` : "Novo serviço"} onClose={() => !saving && setEditing(null)}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">Nome
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Corte degradê" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Preço
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="30,00" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Tópico da Home
              <select value={topicId} onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-white outline-none focus:border-amber-500">
                <option value="">Selecione um tópico</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold">Categoria técnica
              <select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-white outline-none focus:border-amber-500">
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            {category === "COMBO" && (
              <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
                <p className="text-sm font-bold">Serviços incluídos</p>
                <div className="mt-3 space-y-2">
                  {normalServices.length === 0 && <p className="text-sm text-zinc-500">Cadastre serviços individuais antes de criar um combo.</p>}
                  {normalServices.map((service) => (
                    <label key={service.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-950 p-3 text-sm text-zinc-300">
                      <input type="checkbox" checked={includedServiceIds.includes(service.id)} onChange={() => toggleIncluded(service.id)} className="accent-amber-500" />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="button" disabled={saving} onClick={saveService} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 hover:bg-amber-400 disabled:opacity-50">{saving ? "Salvando..." : "Salvar serviço"}</button>
          </div>
        </Modal>
      )}

      {topicModal && (
        <Modal title={editingTopic ? `Editar ${editingTopic.name}` : "Novo tópico"} onClose={() => !savingTopic && setTopicModal(false)}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">Nome do tópico
              <input value={topicForm.name} onChange={(e) => setTopicForm((current) => ({ ...current, name: e.target.value }))} placeholder="Ex.: Cortes masculinos" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Descrição <span className="font-normal text-zinc-500">(opcional)</span>
              <textarea value={topicForm.description} onChange={(e) => setTopicForm((current) => ({ ...current, description: e.target.value }))} rows={3} placeholder="Uma breve descrição que aparecerá na Home." className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <div>
              <p className="mb-2 text-sm font-bold">Imagem do tópico <span className="font-normal text-zinc-500">(opcional)</span></p>
              <ImageUploadButton value={topicForm.imageUrl} onChange={(value) => setTopicForm((current) => ({ ...current, imageUrl: value }))} label="Escolher imagem do tópico" errorMessage={setError} />
              {topicForm.imageUrl && <button type="button" onClick={() => setTopicForm((current) => ({ ...current, imageUrl: "" }))} className="mt-2 text-xs font-bold text-zinc-500 hover:text-red-300">Remover imagem</button>}
            </div>
            <button type="button" disabled={savingTopic} onClick={saveTopic} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 hover:bg-amber-400 disabled:opacity-50">{savingTopic ? "Salvando..." : "Salvar tópico"}</button>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Excluir serviço" onClose={() => setDeleting(null)}>
          <p className="text-sm leading-6 text-zinc-400">Tem certeza que deseja excluir <strong className="text-white">{deleting.name}</strong>? Essa ação não poderá ser desfeita.</p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setDeleting(null)} className="flex-1 rounded-xl border border-white/10 py-3 font-bold text-zinc-300 hover:bg-white/5">Cancelar</button>
            <button type="button" onClick={removeService} className="flex-1 rounded-xl bg-red-500 py-3 font-black text-white hover:bg-red-400">Excluir</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
