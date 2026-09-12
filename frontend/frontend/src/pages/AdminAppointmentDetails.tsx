import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Loading } from "../components/Loading";
import { appointmentService } from "../services/appointments";
import type { Appointment } from "../types";

const fmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
export function AdminAppointmentDetails() {
  const id = window.location.pathname.split("/").filter(Boolean).pop();
  const [item, setItem] = useState<Appointment>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    appointmentService
      .get(Number(id))
      .then(setItem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);
  return (
    <AdminLayout>
      <a
        href="/admin/appointments"
        className="text-sm text-zinc-500 hover:text-white"
      >
        ← Voltar aos agendamentos
      </a>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : (
        item && (
          <div className="mt-6 max-w-3xl">
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-600">
                    Agendamento #{item.id}
                  </p>
                  <h2 className="mt-1 text-3xl font-black">
                    {item.customerName}
                  </h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${item.status === "CONFIRMADO" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  ["Barbeiro", item.barber.name],
                  ["Telefone", item.customerPhone],
                  ["Data", fmt.format(new Date(item.schedule.date))],
                  ["Horário", item.schedule.time],
                  [
                    "Serviços",
                    item.services.map((s) => s.service.name).join(", "),
                  ],
                  [
                    "Criado em",
                    new Date(item.createdAt).toLocaleString("pt-BR"),
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-zinc-950 p-4">
                    <p className="text-xs text-zinc-600">{k}</p>
                    <p className="mt-1 text-sm font-bold text-white">{v}</p>
                  </div>
                ))}
              </div>
              {item.description && (
                <div className="mt-5 rounded-2xl border border-white/5 bg-white/[.02] p-4">
                  <p className="text-xs text-zinc-600">Observação</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </AdminLayout>
  );
}
