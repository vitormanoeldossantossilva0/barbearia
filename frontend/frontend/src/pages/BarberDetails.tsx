import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import { scheduleService } from "../services/schedules";
import type { Barber, Schedule } from "../types";

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const today = getLocalDate();
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export function BarberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const barberId = Number(id);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(barberId) || barberId <= 0) {
      setError("Barbeiro inválido.");
      setLoading(false);
      return;
    }

    barberService
      .list()
      .then((barbers) => {
        const foundBarber = barbers.find((item) => item.id === barberId);

        if (!foundBarber) {
          throw new Error("Barbeiro não encontrado.");
        }

        setBarber(foundBarber);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [barberId]);
  useEffect(() => {
    if (!barberId || !date) return;
    setLoadingSchedules(true);
    scheduleService
      .list(barberId, date)
      .then(setSchedules)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSchedules(false));
  }, [barberId, date]);

  if (loading)
    return (
      <>
        <PublicHeader />
        <Loading />
        <main />
      </>
    );
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-zinc-500 hover:text-black cursor-pointer"
        >
          ← Voltar
        </button>
        {error ? (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        ) : (
          barber && (
            <div className="mt-8 grid gap-8 md:grid-cols-[.8fr_1.2fr]">
              <section className="rounded-3xl border border-white/10 bg-zinc-900 p-7">
                <div className="grid h-44 place-items-center rounded-2xl bg-zinc-950 text-7xl">
                  💈
                </div>
                <h1 className="mt-7 text-3xl font-black text-white">{barber.name}</h1>
                <p className="mt-3 leading-7 text-zinc-400">
                  {barber.description}
                </p>
                <button
                  onClick={() => navigate(`/booking?barber=${barber.id}`)}
                  className="mt-7 block w-full rounded-xl bg-amber-500 px-5 py-3 text-center font-black text-zinc-950 hover:cursor-pointer"
                >
                  Agendar com {barber.name.split(" ")[0]}
                </button>
              </section>
              <section>
                <p className="text-sm font-bold uppercase tracking-[.2em] text-amber-500">
                  Disponibilidade
                </p>
                <h2 className="mt-2 text-3xl font-black text-black">
                  Horários de {barber.name}
                </h2>
                <label className="mt-6 block max-w-xs text-sm font-bold text-zinc-600">
                  Escolha o dia
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    aria-label="Escolha o dia do atendimento"
                    className="mt-2 w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  />
                </label>
                {loadingSchedules ? (
                  <div className="mt-7">
                    <Loading text="Buscando horários..." />
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="mt-7 rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-400">
                    Não há horários disponíveis para este dia. Escolha outra
                    data.
                  </div>
                ) : (
                  <div className="mt-7">
                    <p className="mb-3 font-bold capitalize text-zinc-600">
                      {dateFormatter.format(new Date(`${date}T12:00:00`))}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {schedules.map((s) => (
                        <button
                          key={`${s.templateId || s.id}-${s.time}`}
                          disabled={s.available === false}
                          onClick={() => {
                            if (s.available === false) return;
                            navigate(
                              `/booking?barber=${barber.id}&schedule=${s.id || 0}&template=${s.templateId || 0}&date=${date}`,
                            );
                          }}
                          className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                            s.available === false
                              ? "cursor-not-allowed border-white/5 bg-zinc-900/60 text-zinc-600"
                              : "border-white/10 bg-zinc-950 text-zinc-300 hover:border-amber-500 hover:text-amber-500"
                          }`}
                        >
                          {s.time} {s.available === false ? "· Indisponível" : "· Agendar"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )
        )}
      </main>
    </>
  );
}
