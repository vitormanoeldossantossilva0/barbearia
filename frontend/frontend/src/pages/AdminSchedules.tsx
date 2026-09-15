import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Loading } from "../components/Loading";
import { scheduleService } from "../services/schedules";
import type { ScheduleTemplate } from "../types";

function Alert({
  children,
  type = "error",
}: {
  children: ReactNode;
  type?: "error" | "success";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}
    >
      {children}
    </div>
  );
}

export function AdminSchedules() {
  const [items, setItems] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState<ScheduleTemplate | null>(null);
  const [time, setTime] = useState("");

  const load = async () => {
    setError("");
    try {
      setItems(await scheduleService.mine());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar horários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!time) {
      setError("Informe o horário.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await scheduleService.create(time);
      setTime("");
      setSuccess(
        "Horário criado com sucesso. O cliente poderá escolher o dia.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar horário.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await scheduleService.remove(deleting.id);
      setDeleting(null);
      setSuccess("Horário excluído.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir horário.");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-black">Horários</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Cadastre somente os horários. O cliente escolhe o dia no momento do
          agendamento.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <h3 className="font-black">Novo horário</h3>
        <div className="mt-4 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-bold">
            Horário
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal text-white outline-none focus:border-amber-500"
            />
          </label>
          <button
            disabled={saving}
            onClick={create}
            className="rounded-xl bg-amber-500 px-5 py-3 font-black text-zinc-950 disabled:opacity-50"
          >
            {saving ? "Criando..." : "+ Criar horário"}
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[.02] text-zinc-500">
              <tr>
                <th className="px-5 py-4">Horário</th>
                <th className="px-5 py-4">Disponibilidade</th>
                <th className="px-5 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 text-lg font-black">{item.time}</td>
                  <td className="px-5 py-4 text-zinc-400">
                    Disponível para os dias escolhidos pelos clientes
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setDeleting(item)}
                      className="text-xs font-bold text-red-300 hover:text-red-200"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500">
              Nenhum horário cadastrado.
            </div>
          )}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir horário?"
          message="Esse horário deixará de aparecer para novos agendamentos."
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          confirmLabel="Excluir"
        />
      )}
    </AdminLayout>
  );
}
