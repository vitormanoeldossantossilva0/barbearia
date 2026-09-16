import { useEffect, useState } from "react";
import { MasterLayout } from "../components/MasterLayout";
import { Modal } from "../components/Modal";
import { Loading } from "../components/Loading";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { barbershopService } from "../services/barbershop";
import type { MasterBarbershop } from "../types";
import { formatPhone } from "../utils/phone";

const empty = {
  name: "",
  ownerName: "",
  email: "",
  password: "",
  slug: "",
  description: "",
  whatsapp: "",
  imageUrl: "",
};

export function MasterBarbershops() {
  const [items, setItems] = useState<MasterBarbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<MasterBarbershop | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    barbershopService
      .masterList()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const field = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(empty);
    setError("");
    setMessage("");
    setCreating(true);
  };

  const openEdit = (shop: MasterBarbershop) => {
    setEditing(shop);
    setForm({
      name: shop.name,
      ownerName: "",
      email: "",
      password: "",
      slug: shop.slug,
      description: shop.description,
      whatsapp: formatPhone(shop.whatsapp || ""),
      imageUrl: shop.imageUrl || "",
    });
    setError("");
  };

  const create = async () => {
    if (
      form.name.trim().length < 2 ||
      form.ownerName.trim().length < 2 ||
      !form.email.trim() ||
      form.password.length < 8
    ) {
      setError("Preencha barbearia, responsável, e-mail e senha de pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await barbershopService.masterCreate({
        ...form,
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        slug: form.slug.trim(),
      });
      setCreating(false);
      setMessage("Barbearia criada. O responsável já pode entrar pelo /slug/admin.");
      setForm(empty);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar barbearia.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (shop: MasterBarbershop) => {
    const confirmed = window.confirm(
      `Excluir a barbearia "${shop.name}"? Esta ação excluirá também os barbeiros, serviços, horários e agendamentos vinculados a ela e não poderá ser desfeita.`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await barbershopService.masterDelete(shop.id);
      setMessage(`Barbearia "${shop.name}" excluída com sucesso.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir barbearia.");
    }
  };

  const update = async () => {
    if (!editing) return;
    if (form.name.trim().length < 2) {
      setError("Informe um nome válido para a barbearia.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await barbershopService.masterUpdate(editing.id, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        whatsapp: form.whatsapp.trim(),
        imageUrl: form.imageUrl,
      });
      setEditing(null);
      setMessage("Barbearia atualizada com sucesso.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar barbearia.");
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <Modal
      title={editing ? `Editar ${editing.name}` : "Nova barbearia"}
      onClose={() => !saving && (editing ? setEditing(null) : setCreating(false))}
    >
      <div className="space-y-4">
        {!editing && (
          <label className="block text-sm font-bold">
            Responsável
            <input
              value={form.ownerName}
              onChange={(e) => field("ownerName", e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
            />
          </label>
        )}

        <label className="block text-sm font-bold">
          Nome da barbearia
          <input
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <label className="block text-sm font-bold">
          Slug
          <input
            value={form.slug}
            onChange={(e) => field("slug", e.target.value)}
            placeholder="ex.: pedro"
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        {!editing && (
          <>
            <label className="block text-sm font-bold">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              Senha inicial
              <input
                type="password"
                value={form.password}
                onChange={(e) => field("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
          </>
        )}

        <label className="block text-sm font-bold">
          Descrição
          <textarea
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <label className="block text-sm font-bold">
          WhatsApp
          <input
            value={form.whatsapp}
            onChange={(e) => field("whatsapp", formatPhone(e.target.value))}
            placeholder="(12) 99999-9999"
            inputMode="tel"
            maxLength={15}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-bold">Imagem da barbearia</p>
          <ImageUploadButton
            value={form.imageUrl}
            onChange={(value) => field("imageUrl", value)}
            label="Adicionar imagem da barbearia"
            errorMessage={setError}
          />
        </div>

        <button
          disabled={saving}
          onClick={editing ? update : create}
          className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar barbearia"}
        </button>
      </div>
    </Modal>
  );

  return (
    <MasterLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Barbearias</h2>
          <p className="mt-1 text-sm text-zinc-500">Crie clientes novos sem duplicar o projeto.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
        >
          + Nova barbearia
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((shop) => (
            <article
              key={shop.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
            >
              {shop.imageUrl ? (
                <img src={shop.imageUrl} alt={shop.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="grid h-40 place-items-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-7xl">
                  💈
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black">{shop.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">/{shop.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(shop)}
                      className="rounded-xl border border-amber-500/40 px-3 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-500/10"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(shop)}
                      className="rounded-xl border border-red-500/40 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-sm text-zinc-400">{shop._count?.barbers ?? 0} barbeiro(s)</p>
                <p className="mt-1 text-xs text-zinc-600">Link público: /{shop.slug}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && modal}
      {editing && modal}
    </MasterLayout>
  );
}
