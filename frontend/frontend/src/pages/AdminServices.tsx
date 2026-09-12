import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Loading } from "../components/Loading";
import { serviceService } from "../services/services";
import type { Service } from "../types";

export function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    serviceService.mine()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const open = (service?: Service) => {
    setEditing(service ?? { id: 0, name: "", price: 0 });
    setName(service?.name ?? "");
    setPrice(service ? String(service.price) : "");
    setError("");
  };

  const save = async () => {
    const value = Number(price.replace(",", "."));
    if (name.trim().length < 2 || !Number.isFinite(value) || value < 0) {
      setError("Informe nome e preço válidos.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editing?.id) {
        await serviceService.update(editing.id, name.trim(), value);
      } else {
        await serviceService.create(name.trim(), value);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await serviceService.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Serviços</h2>
          <p className="mt-1 text-sm text-zinc-500">Gerencie seus serviços e preços.</p>
        </div>
        <button onClick={() => open()} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-zinc-950">
          + Novo serviço
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? <Loading /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900 p-4">
              <div>
                <p className="font-bold">{s.name}</p>
                <p className="mt-1 text-sm font-bold text-amber-500">
                  R$ {s.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => open(s)} className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold">
                  Editar
                </button>
                <button onClick={() => setDeleting(s)} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
              Nenhum serviço cadastrado.
            </div>
          )}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Editar serviço" : "Novo serviço"} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <label className="block text-sm font-bold">
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <label className="block text-sm font-bold">
              Preço
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="30,00" className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500" />
            </label>
            <button disabled={saving} onClick={save} className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir serviço?"
          message={`Deseja excluir ${deleting.name}?`}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          confirmLabel="Excluir"
        />
      )}
    </AdminLayout>
  );
}
