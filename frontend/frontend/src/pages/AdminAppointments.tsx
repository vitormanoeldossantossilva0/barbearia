import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Loading } from "../components/Loading";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { appointmentService } from "../services/appointments";
import type { Appointment } from "../types";

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
export function AdminAppointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"TODOS" | "CONFIRMADO" | "CANCELADO">(
    "TODOS",
  );
  const [cancel, setCancel] = useState<Appointment | null>(null);
  const [remove, setRemove] = useState<Appointment | null>(null);
  const load = () =>
    appointmentService
      .list()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(
    () =>
      filter === "TODOS" ? items : items.filter((a) => a.status === filter),
    [items, filter],
  );
  const cancelAppointment = async () => {
    if (!cancel) return;
    try {
      await appointmentService.cancel(cancel.id);
      setCancel(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar.");
    }
  };
  const removeAppointment = async () => {
    if (!remove) return;
    try {
      await appointmentService.remove(remove.id);
      setRemove(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir agendamento.");
    }
  };

  const setStatus = async (
    a: Appointment,
    status: "CONFIRMADO" | "CANCELADO",
  ) => {
    try {
      await appointmentService.updateStatus(a.id, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
    }
  };
  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-black">Agendamentos</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Acompanhe os horários reservados pelos clientes.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {(["TODOS", "CONFIRMADO", "CANCELADO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${filter === f ? "bg-amber-500 text-zinc-950" : "bg-white/5 text-zinc-400"}`}
          >
            {f === "TODOS"
              ? "Todos"
              : f === "CONFIRMADO"
                ? "Confirmados"
                : "Cancelados"}
          </button>
        ))}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {visible.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.status === "CONFIRMADO" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
                    >
                      {a.status}
                    </span>
                    <span className="text-xs text-zinc-600">#{a.id}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{a.customerName}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {a.barber.name} · {fmt.format(new Date(a.schedule.date))} às{" "}
                    <strong className="text-white">{a.schedule.time}</strong>
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {a.customerPhone} ·{" "}
                    {a.services.map((s) => s.service.name).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/admin/appointments/${a.id}`}
                    className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10"
                  >
                    Detalhes
                  </a>
                  {a.status === "CONFIRMADO" ? (
                    <button
                      onClick={() => setCancel(a)}
                      className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300"
                    >
                      Cancelar
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(a, "CONFIRMADO")}
                      className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300"
                    >
                      Reativar
                    </button>
                  )}
                  <button
                    onClick={() => setRemove(a)}
                    className="rounded-lg bg-zinc-700/40 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700/60"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
              Nenhum agendamento nesta categoria.
            </div>
          )}
        </div>
      )}
      {cancel && (
        <ConfirmDialog
          title="Cancelar agendamento?"
          message={`O agendamento de ${cancel.customerName} será marcado como cancelado.`}
          onClose={() => setCancel(null)}
          onConfirm={cancelAppointment}
          confirmLabel="Cancelar"
        />
      )}
      {remove && (
        <ConfirmDialog
          title="Excluir agendamento?"
          message={`O agendamento de ${remove.customerName} será excluído permanentemente. Essa ação não pode ser desfeita.`}
          onClose={() => setRemove(null)}
          onConfirm={removeAppointment}
          confirmLabel="Excluir"
        />
      )}
    </AdminLayout>
  );
}
