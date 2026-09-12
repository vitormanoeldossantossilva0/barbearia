import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Link } from "react-router-dom";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import { serviceService } from "../services/services";
import { scheduleService } from "../services/schedules";
import { appointmentService } from "../services/appointments";

export function AdminDashboard() {
  const [data, setData] = useState({
    barbers: 0,
    services: 0,
    schedules: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      barberService.list(),
      serviceService.list(),
      scheduleService.mine(),
      appointmentService.list(),
    ])
      .then(([b, s, sc, a]) =>
        setData({
          barbers: b.length,
          services: s.length,
          schedules: sc.length,
          appointments: a.filter((x) => x.status === "CONFIRMADO").length,
        }),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <AdminLayout>
      {loading ? (
        <Loading />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400"
        >
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Barbeiros", data.barbers, "/admin/barbers"],
              ["Serviços", data.services, "/admin/services"],
              ["Horários livres", data.schedules, "/admin/schedules"],
              ["Agendamentos ativos", data.appointments, "/admin/appointments"],
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
          <div className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
            <p className="font-bold text-amber-500">Fluxo recomendado</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Cadastre seus serviços e os horários em que atende. O cliente
              escolhe a data no site e você acompanha os agendamentos por aqui.
            </p>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
