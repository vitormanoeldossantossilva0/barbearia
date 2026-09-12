import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import type { BarberAccount } from "../types";

type ManagedBarber = BarberAccount;

const emptyForm = { name: "", description: "", whatsapp: "", email: "", password: "" };

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

  useEffect(() => { void load(); }, []);

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
      whatsapp: barber.whatsapp || "",
      email: barber.user?.email || "",
      password: "",
    });
    setError("");
    setMessage("");
    setEditing(barber);
  };

  const createAccount = async () => {
    if (form.name.trim().length < 2 || form.password.length < 8 || !form.email.trim()) {
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

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{isAdmin ? "Barbeiros" : "Minha conta"}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isAdmin
              ? "Gerencie os dados e acessos de cada barbeiro."
              : "Gerencie seus dados profissionais e sua conta."}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950"
          >
            + Novo barbeiro
          </button>
        )}
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {message && <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</div>}

      {loading ? <Loading /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((barber) => (
            <article key={barber.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-600">
                    {barber.user?.role === "ADMIN" ? "Administrador" : "Barbeiro"}
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{barber.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500">{barber.description || "Sem descrição."}</p>
                </div>
                <button
                  onClick={() => openEdit(barber)}
                  className="rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm font-black text-amber-400 hover:bg-amber-500/10"
                >
                  Editar
                </button>
              </div>
              <div className="mt-5 space-y-2 text-sm text-zinc-400">
                <p><span className="font-bold text-zinc-300">E-mail:</span> {barber.user?.email || "—"}</p>
                <p><span className="font-bold text-zinc-300">WhatsApp:</span> {barber.whatsapp || "Não configurado"}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && (
        <Modal title="Criar conta de barbeiro" onClose={() => !saving && setCreating(false)}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">Nome<input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">Descrição<textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">WhatsApp<input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="(12) 99999-9999" inputMode="tel" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">E-mail<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">Senha<input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Mínimo 8 caracteres" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <button disabled={saving} onClick={createAccount} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50">{saving ? "Criando..." : "Criar conta"}</button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={`Editar ${editing.name}`} onClose={() => !saving && setEditing(null)}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">Nome<input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">Descrição<textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">WhatsApp<input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="(12) 99999-9999" inputMode="tel" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">E-mail<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <label className="block text-sm font-bold">Nova senha <span className="font-normal text-zinc-500">(opcional)</span><input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Deixe vazio para manter a atual" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" /></label>
            <button disabled={saving} onClick={updateAccount} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50">{saving ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
