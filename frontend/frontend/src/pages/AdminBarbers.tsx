import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import type { Barber, BarberAccount } from "../types";

export function AdminBarbers() {
  const [me, setMe] = useState<BarberAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = () =>
    barberService.me()
      .then((barber) => {
        setMe(barber);
        setName(barber.name);
        setDescription(barber.description || "");
        setWhatsapp(barber.whatsapp || "");
        setEmail(barber.user?.email || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setWhatsapp("");
    setEmail("");
    setPassword("");
  };

  const openEdit = () => {
    if (!me) return;
    setName(me.name);
    setDescription(me.description || "");
    setWhatsapp(me.whatsapp || "");
    setEmail(me.user?.email || "");
    setPassword("");
    setMessage("");
    setError("");
    setEditing(true);
  };

  const createAccount = async () => {
    if (name.trim().length < 2 || password.length < 8 || !email.trim()) {
      setError("Informe nome, e-mail e uma senha de pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await barberService.create({
        name: name.trim(),
        description: description.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        password,
      });
      setMessage(`Conta criada para ${name.trim()}. Guarde o e-mail e a senha informados.`);
      setCreating(false);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar conta.");
    } finally {
      setSaving(false);
    }
  };

  const updateAccount = async () => {
    if (!me) return;
    if (name.trim().length < 2 || !email.trim()) {
      setError("Informe nome e e-mail.");
      return;
    }
    if (password && password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await barberService.update(me.id, {
        name: name.trim(),
        description: description.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        ...(password ? { password } : {}),
      });

      setMe({
        ...updated,
        user: { email: email.trim().toLowerCase() },
      });
      setPassword("");
      setEditing(false);
      setMessage("Dados do barbeiro atualizados com sucesso.");
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
          <h2 className="text-2xl font-black">Minha conta</h2>
          <p className="mt-1 text-sm text-zinc-500">Gerencie os dados do barbeiro e da conta administrativa.</p>
        </div>
        <button onClick={() => { setCreating(true); setError(""); setMessage(""); resetForm(); }} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950">
          + Novo barbeiro
        </button>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {message && <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</div>}

      {loading ? <Loading /> : me && (
        <div className="max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600">Barbeiro autenticado</p>
              <h3 className="mt-2 text-2xl font-black">{me.name}</h3>
              <p className="mt-2 text-sm text-zinc-500">{me.description || "Sem descrição."}</p>
            </div>
            <button onClick={openEdit} className="rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm font-black text-amber-400 hover:bg-amber-500/10">
              Editar
            </button>
          </div>

          <div className="mt-5 space-y-2 text-sm text-zinc-400">
            <p><span className="font-bold text-zinc-300">E-mail:</span> {me.user?.email || "—"}</p>
            <p><span className="font-bold text-zinc-300">WhatsApp:</span> {me.whatsapp || "Não configurado"}</p>
          </div>
        </div>
      )}

      {creating && (
        <Modal title="Criar conta de barbeiro" onClose={() => { setCreating(false); resetForm(); }}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">Nome
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Descrição
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">WhatsApp
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(12) 99999-9999" inputMode="tel" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">E-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Senha
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <button disabled={saving} onClick={createAccount} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50">
              {saving ? "Criando..." : "Criar conta"}
            </button>
          </div>
        </Modal>
      )}

      {editing && me && (
        <Modal title="Editar barbeiro" onClose={() => { if (!saving) setEditing(false); }}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">Nome
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Descrição
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">WhatsApp
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(12) 99999-9999" inputMode="tel" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">E-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">Nova senha <span className="font-normal text-zinc-500">(opcional)</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Deixe vazio para manter a atual" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <button disabled={saving} onClick={updateAccount} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
