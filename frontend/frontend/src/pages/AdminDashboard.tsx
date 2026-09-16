import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Link, useParams } from "react-router-dom";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import { serviceService } from "../services/services";
import { scheduleService } from "../services/schedules";
import { appointmentService } from "../services/appointments";
import type { Appointment } from "../types";

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today = getLocalDate();
const todayLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export function AdminDashboard() {
  const { slug = "" } = useParams();
  const shopSlug = slug;
  const adminPath = (path: string) => `/${encodeURIComponent(shopSlug)}${path}`;

  const [data, setData] = useState({
    barbers: 0,
    services: 0,
    schedules: 0,
    appointments: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      barberService.list(),
      serviceService.mine(),
      scheduleService.mine(),
      appointmentService.listByDate(today),
    ])
      .then(([b, s, sc, a]) => {
        setData({
          barbers: b.length,
          services: s.length,
          schedules: sc.length,
          appointments: a.filter((item) => item.status === "CONFIRMADO").length,
        });
        setTodayAppointments(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      {loading ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Barbeiros", data.barbers, adminPath("/admin/barbers")],
              ["Meus serviços", data.services, adminPath("/admin/services")],
              ["Horários livres", data.schedules, adminPath("/admin/schedules")],
              ["Agendamentos de hoje", data.appointments, adminPath("/admin/appointments")],
            ].map(([label, value, to]) => (
              <Link
                key={String(to)}
                to={String(to)}
                className="rounded-2xl border border-white/10 bg-zinc-900 p-5 hover:border-amber-500/30"
              >
                <p className="text-sm text-zinc-500">{label}</p>
                <p className="mt-2 text-4xl font-black">{value}</p>
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">Agenda rápida</p>
                <h2 className="mt-1 text-2xl font-black">Agendamentos de hoje</h2>
              </div>
              <p className="text-sm capitalize text-zinc-500">
                {todayLabel.format(new Date(`${today}T12:00:00`))}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {todayAppointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  to={adminPath(`/admin/appointments/${appointment.id}`)}
                  className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-zinc-950 p-4 transition hover:border-amber-500/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-white">{appointment.schedule.time}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          appointment.status === "CONFIRMADO"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-red-500/10 text-red-300"
                        }`}
                      >
                        {appointment.status === "CONFIRMADO" ? "Confirmado" : "Cancelado"}
                      </span>
                    </div>
                    <p className="mt-1 font-bold text-zinc-200">{appointment.customerName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {appointment.services.map((item) => item.service.name).join(" + ")}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-zinc-500">Ver detalhes →</span>
                </Link>
              ))}
              {todayAppointments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <p className="font-bold text-zinc-300">Nenhum agendamento para hoje.</p>
                  <p className="mt-1 text-sm text-zinc-600">Quando um cliente reservar um horário, ele aparecerá aqui.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
