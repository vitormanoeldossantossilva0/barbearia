import { PublicHeader } from "../components/PublicHeader";
import { BarberCard } from "../components/BarberCard";
import { ServiceCard } from "../components/ServiceCard";
import { SectionTitle } from "../components/SectionTitle";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import { serviceService } from "../services/services";
import { useEffect, useState } from "react";
import type { Barber, Service } from "../types";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
      {children}
    </div>
  );
}

export function Home() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([barberService.list(), serviceService.list()])
      .then(([b, s]) => {
        setBarbers(b);
        setServices(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <PublicHeader />
      <main>
        <section id="inicio" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(245,158,11,.16),transparent_35%)]" />
          <div className="mx-auto grid min-h-[680px] max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
            <div className="animate-fade-up">
              <p className="mb-5 text-sm font-bold uppercase tracking-[.25em] text-amber-500">
                Seu estilo começa aqui
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-[.95] tracking-tight text-black sm:text-7xl ">
                Corte bom é aquele que{" "}
                <span className="text-amber-500">combina com você.</span>
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-zinc-400">
                Escolha seu barbeiro, encontre um horário e agende em poucos
                passos. Sem complicação.
              </p>
              <div className="relative z-10 mt-9 flex flex-wrap gap-3">
                <Link
                  to="/booking"
                  className="cursor-pointer rounded-full bg-amber-500 px-7 py-3.5 font-black text-zinc-950 transition hover:bg-amber-400"
                >
                  Agendar agora
                </Link>

                <a
                  href="#barbeiros"
                  className="cursor-pointer rounded-full border border-white/15 px-7 py-3.5 font-bold text-zinc-600 transition hover:bg-white/5"
                >
                  Conhecer barbeiros
                </a>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="mx-auto grid aspect-square max-w-md place-items-center rounded-[3rem] border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-950 text-[12rem] shadow-2xl shadow-amber-950/20">
                💈
              </div>
              <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-zinc-500">foco no seu estilo</p>
              </div>
            </div>
          </div>
        </section>
        <section
          id="servicos"
          className="border-y border-white/10 bg-zinc-900/40 px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Serviços"
              title="Escolha seu cuidado"
              description="Serviços selecionados para deixar seu visual em dia."
            />
            {loading ? (
              <Loading />
            ) : error ? (
              <Alert>{error}</Alert>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            )}
          </div>
        </section>
        <section id="barbeiros" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              eyebrow="Profissionais"
              title="Conheça nossos barbeiros"
              description="Escolha quem vai cuidar do seu próximo visual."
            />
            {loading ? (
              <Loading />
            ) : error ? (
              <Alert>{error}</Alert>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {barbers.map((b) => (
                  <BarberCard key={b.id} barber={b} />
                ))}
              </div>
            )}
            <div className="mt-10 text-center">
              <Link
                to="/booking"
                className="inline-flex rounded-full bg-amber-500 px-7 py-3.5 font-black text-zinc-950 hover:bg-amber-400"
              >
                Encontrar um horário
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
