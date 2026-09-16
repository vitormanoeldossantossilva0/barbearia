import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { Loading } from "../components/Loading";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { barberService } from "../services/barbers";
import type { BarberAccount } from "../types";
import { formatPhone } from "../utils/phone";

type ManagedBarber = BarberAccount;

const emptyForm = {
  name: "",
  description: "",
  whatsapp: "",
  email: "",
  password: "",
  imageUrl: "",
  instagram: "",
  facebook: "",
  tiktok: "",
};

export function AdminBarbers() {
  const [me, setMe] = useState<BarberAccount | null>(null);
  const [items, setItems] = useState<ManagedBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedBarber | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = me?.user?.role === "ADMIN";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const account = await barberService.me();
      setMe(account);
      if (account.user?.role === "ADMIN") {
        setItems(await barberService.manage());
      } else {
        setItems([account]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar barbeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setError("");
    setMessage("");
    setCreating(true);
  };

  const openEdit = (barber: ManagedBarber) => {
    setForm({
      name: barber.name,
      description: barber.description || "",
      whatsapp: formatPhone(barber.whatsapp || ""),
      email: barber.user?.email || "",
      password: "",
      imageUrl: barber.imageUrl || "",
      instagram: barber.instagram || "",
      facebook: barber.facebook || "",
      tiktok: barber.tiktok || "",
    });
    setError("");
    setMessage("");
    setEditing(barber);
  };

  const createAccount = async () => {
    if (
      form.name.trim().length < 2 ||
      form.password.length < 8 ||
      !form.email.trim()
    ) {
      setError("Informe nome, e-mail e uma senha de pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await barberService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        password: form.password,
        imageUrl: form.imageUrl,
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        tiktok: form.tiktok.trim(),
      });
      setCreating(false);
      setMessage(`Barbeiro ${form.name.trim()} criado com sucesso.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar barbeiro.");
    } finally {
      setSaving(false);
    }
  };

  const updateAccount = async () => {
    if (!editing) return;
    if (form.name.trim().length < 2 || !form.email.trim()) {
      setError("Informe nome e e-mail.");
      return;
    }
    if (form.password && form.password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await barberService.update(editing.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        ...(form.password ? { password: form.password } : {}),
        imageUrl: form.imageUrl,
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        tiktok: form.tiktok.trim(),
      });
      setEditing(null);
      setMessage("Dados do barbeiro atualizados com sucesso.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar barbeiro.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBarber = async () => {
    if (!editing || !isAdmin || editing.id === me?.id) return;

    const confirmed = window.confirm(
      `Excluir o barbeiro ${editing.name}? Essa ação também removerá os horários e agendamentos vinculados a ele.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await barberService.remove(editing.id);
      setEditing(null);
      setMessage(`Barbeiro ${editing.name} excluído com sucesso.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir barbeiro.");
    } finally {
      setDeleting(false);
    }
  };

  const imageError = (message: string) => setError(message);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">
            {isAdmin ? "Barbeiros" : "Minha conta"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isAdmin
              ? "Gerencie os dados e acessos de cada barbeiro."
              : "Gerencie seus dados profissionais e sua conta."}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
          >
            + Novo barbeiro
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
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
          {items.map((barber) => (
            <article
              key={barber.id}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                {barber.imageUrl ? (
                  <img
                    src={barber.imageUrl}
                    alt={barber.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-widest text-zinc-600">
                    {barber.user?.role === "ADMIN"
                      ? "Administrador"
                      : "Barbeiro"}
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{barber.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    {barber.description || "Sem descrição."}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(barber)}
                  className="shrink-0 rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm font-black text-amber-400 transition hover:bg-amber-500/10"
                >
                  Editar
                </button>
              </div>
              <div className="mt-5 space-y-2 text-sm text-zinc-400">
                <p>
                  <span className="font-bold text-zinc-300">E-mail:</span>{" "}
                  {barber.user?.email || "—"}
                </p>
                <p>
                  <span className="font-bold text-zinc-300">WhatsApp:</span>{" "}
                  {barber.whatsapp
                    ? formatPhone(barber.whatsapp)
                    : "Não configurado"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && (
        <Modal
          title="Criar conta de barbeiro"
          onClose={() => !saving && setCreating(false)}
        >
          <div className="space-y-4">
            <label className="block text-sm font-bold">
              Nome
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              Descrição
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(e) =>
                  updateField("whatsapp", formatPhone(e.target.value))
                }
                placeholder="(12) 99999-9999"
                inputMode="tel"
                maxLength={15}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              Senha
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <p className="text-sm font-bold">
                Redes sociais{" "}
                <span className="font-normal text-zinc-500">(opcional)</span>
              </p>
              <label className="block text-xs font-bold text-zinc-400">
                Instagram
                <input
                  value={form.instagram}
                  onChange={(e) => updateField("instagram", e.target.value)}
                  placeholder="https://instagram.com/seuperfil"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                Facebook
                <input
                  value={form.facebook}
                  onChange={(e) => updateField("facebook", e.target.value)}
                  placeholder="https://facebook.com/seuperfil"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                TikTok
                <input
                  value={form.tiktok}
                  onChange={(e) => updateField("tiktok", e.target.value)}
                  placeholder="https://tiktok.com/@seuperfil"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Foto do barbeiro</p>
              <ImageUploadButton
                value={form.imageUrl}
                onChange={(value) => updateField("imageUrl", value)}
                label="Adicionar imagem do barbeiro"
                errorMessage={imageError}
              />
            </div>
            <button
              disabled={saving}
              onClick={createAccount}
              className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? "Criando..." : "Criar conta"}
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title={`Editar ${editing.name}`}
          onClose={() => !saving && !deleting && setEditing(null)}
        >
          <div className="space-y-4">
            <label className="block text-sm font-bold">
              Nome
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              Descrição
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(e) =>
                  updateField("whatsapp", formatPhone(e.target.value))
                }
                placeholder="(12) 99999-9999"
                inputMode="tel"
                maxLength={15}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-bold">
              Nova senha{" "}
              <span className="font-normal text-zinc-500">(opcional)</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Deixe vazio para manter a atual"
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <p className="text-sm font-bold">
                Redes sociais{" "}
                <span className="font-normal text-zinc-500">(opcional)</span>
              </p>
              <label className="block text-xs font-bold text-zinc-400">
                Instagram
                <input
                  value={form.instagram}
                  onChange={(e) => updateField("instagram", e.target.value)}
                  placeholder="https://instagram.com/seuperfil"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                Facebook
                <input
                  value={form.facebook}
                  onChange={(e) => updateField("facebook", e.target.value)}
                  placeholder="https://facebook.com/seuperfil"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                TikTok
                <input
                  value={form.tiktok}
                  onChange={(e) => updateField("tiktok", e.target.value)}
                  placeholder="https://tiktok.com/@seuperfil"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Foto do barbeiro</p>
              <ImageUploadButton
                value={form.imageUrl}
                onChange={(value) => updateField("imageUrl", value)}
                label="Adicionar imagem do barbeiro"
                errorMessage={imageError}
              />
            </div>

            <button
              disabled={saving || deleting}
              onClick={updateAccount}
              className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>

            {isAdmin &&
              editing.id !== me?.id &&
              editing.user?.role === "BARBER" && (
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={deleteBarber}
                  className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deleting ? "Excluindo..." : "Excluir barbeiro"}
                </button>
              )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
