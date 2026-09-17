import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";
import { SocialLinks } from "../components/SocialLinks";
import { BarberCard } from "../components/BarberCard";
import { SectionTitle } from "../components/SectionTitle";
import { Loading } from "../components/Loading";
import { Modal } from "../components/Modal";
import { barberService } from "../services/barbers";
import { barbershopService } from "../services/barbershop";
import { serviceTopicService } from "../services/serviceTopics";
import type { Barber, Barbershop, ServiceTopic } from "../types";

function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
      {children}
    </div>
  );
}

const topicIcons = ["✂", "⌁", "✦", "◌", "✧", "♢"];

export function Home() {
  const { slug } = useParams();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [topics, setTopics] = useState<ServiceTopic[]>([]);
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<ServiceTopic | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    setSelectedTopic(null);
    setShowAllServices(false);

    if (!slug) {
      setShop(null);
      setBarbers([]);
      setTopics([]);
      setLoading(false);
      return;
    }

    Promise.all([
      barbershopService.public(slug),
      barberService.list(slug),
      serviceTopicService.public(slug),
    ])
      .then(([shopData, barberData, topicData]) => {
        setShop(shopData);
        setBarbers(barberData);
        setTopics(topicData);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar a página."),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  const bookingPath = slug ? `/${encodeURIComponent(slug)}/booking` : "/";
  const homeHref = slug ? `/${encodeURIComponent(slug)}` : "/";
  const serviceCount = useMemo(
    () =>
      topics.reduce((total, topic) => total + (topic.services?.length ?? 0), 0),
    [topics],
  );

  if (!slug) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <PublicHeader isHome />
        <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-20 text-center">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.25em] text-amber-500">
              Agendamento online
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-6xl">
              Acesse o link da sua barbearia.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Cada barbearia possui seu próprio endereço. Use o link recebido
              para visualizar profissionais, serviços e horários disponíveis.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <PublicHeader isHome shopSlug={slug} shopName={shop?.name} />

      <main className="overflow-hidden">
        <section
          id="inicio"
          className="relative isolate min-h-[72vh] overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:pb-24"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/images/home-bg.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-[-2%] h-[104%] w-[104%] scale-105 object-cover object-center blur-[5px]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top_right,rgba(9,9,11,1)_0%,rgba(9,9,11,.9)_24%,rgba(9,9,11,.56)_55%,rgba(9,9,11,.12)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(245,158,11,.14),transparent_38%)]" />
          </div>
          <div className="mx-auto grid min-h-[58vh] max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[.25em] text-amber-500">
                Bem-vindo à sua experiência
              </p>
              <h1 className="mt-5 text-5xl font-black leading-[.96] tracking-tight sm:text-7xl">
                {shop?.name || "Sua barbearia"}{" "}
                <span className="text-amber-500">do seu jeito.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-300">
                {shop?.description ||
                  "Escolha seu barbeiro, encontre um horário e agende em poucos passos."}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={bookingPath}
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-7 py-3.5 font-black text-zinc-950 transition hover:bg-amber-400"
                >
                  Agendar agora
                </a>
                <a
                  href="#servicos"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3.5 font-bold text-zinc-200 transition hover:bg-white/5"
                >
                  Conhecer serviços
                </a>
              </div>
            </div>

            <div className="relative z-10 lg:pl-8">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40">
                <div className="aspect-[4/3] overflow-hidden">
                  {shop?.imageUrl ? (
                    <img
                      src={shop.imageUrl}
                      alt={`Imagem de ${shop.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-8xl">
                      💈
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4 border-t border-white/10 bg-zinc-900/75 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-zinc-500">
                      Barbearia
                    </p>
                    <p className="break-words text-lg font-black leading-tight text-white">
                      {shop?.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-[.16em] text-zinc-400">
                      Nos siga
                    </span>
                    <SocialLinks
                      instagram={shop?.instagram}
                      facebook={shop?.facebook}
                      tiktok={shop?.tiktok}
                      light
                      label=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="servicos"
          className="relative isolate overflow-hidden border-y-2 border-white/10 px-4 py-28 shadow-[0_-30px_70px_rgba(0,0,0,.35)] sm:px-6 lg:py-32"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/images/services-bg.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-105 object-cover blur-[5px]"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/25 via-zinc-950/42 to-zinc-950/62" />
          </div>
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <SectionTitle
                eyebrow="O que fazemos"
                title="Nossos serviços"
                description="Conheça nossos tópicos e encontre o serviço ideal para você."
              />
              {topics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllServices(true)}
                  className="shrink-0 rounded-xl border border-white/20 bg-black/20 px-5 py-3 text-sm font-black text-white transition hover:border-amber-500 hover:text-amber-400"
                >
                  Todos os serviços
                </button>
              )}
            </div>

            {loading ? (
              <Loading />
            ) : error ? (
              <Alert>{error}</Alert>
            ) : topics.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center text-zinc-500 backdrop-blur-sm">
                Os serviços desta barbearia ainda estão sendo configurados.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {topics.map((topic, index) => {
                  const image = topic.imageUrl || "/images/home-bg.png";
                  return (
                    <article
                      key={topic.id}
                      className="group relative rounded-2xl border border-white/10 bg-zinc-950/90 transition hover:-translate-y-1 hover:border-amber-500/40"
                    >
                      <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        <img
                          src={image}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-[-2%] h-[104%] w-[104%] object-cover scale-105 blur-[2px]"
                        />
                        <div className="absolute inset-0 bg-black/58" />
                      </div>
                      <div className="relative min-h-[188px] rounded-b-2xl p-5 pt-12">
                        <div className="absolute left-1/2 top-0 z-20 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-amber-500 text-2xl font-black text-zinc-950 shadow-xl ring-4 ring-zinc-950">
                          {topicIcons[index % topicIcons.length]}
                        </div>
                        <h3 className="text-xl font-black">{topic.name}</h3>
                        <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">
                          {topic.description ||
                            "Conheça os serviços deste tópico."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedTopic(topic)}
                          className="mt-5 font-black text-amber-500 transition hover:text-amber-400"
                        >
                          Saiba mais sobre o tópico
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section id="barbeiros" className="px-4 py-20 sm:px-6 lg:py-24">
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
            ) : barbers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-8 text-center text-zinc-500">
                Nenhum barbeiro cadastrado ainda.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    barber={barber}
                    barbershopSlug={slug}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="relative isolate overflow-hidden px-4 pb-24 sm:px-6">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/images/services-bg.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-105 object-cover opacity-35 blur-[3px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/55 to-transparent" />
          </div>
          <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-8 sm:py-12">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-amber-500">
              Seu horário está esperando por você
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
              Bora marcar seu horário?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-400">
              Escolha seu barbeiro, veja os horários disponíveis e combine o
              próximo corte com a gente.
            </p>
            <a
              href={bookingPath}
              className="mt-8 inline-flex rounded-full bg-amber-500 px-8 py-4 font-black text-zinc-950 transition hover:bg-amber-400"
            >
              Agendar meu horário
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/60 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div>
            <Link to={homeHref} className="text-lg font-black">
              {shop?.name || "BARBEARIA"}
              <span className="text-amber-500">.</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Agendamento online simples para cuidar do seu estilo sem
              complicação.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.2em] text-amber-500">
              Navegação
            </h3>
            <div className="mt-4 space-y-3 text-sm font-bold text-zinc-400">
              <a href="#inicio" className="block hover:text-white">
                Início
              </a>
              <a href="#servicos" className="block hover:text-white">
                Serviços
              </a>
              <a href="#barbeiros" className="block hover:text-white">
                Barbeiros
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.2em] text-amber-500">
              Contatos
            </h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-400">
              {shop?.whatsapp ? (
                <a
                  href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-white"
                >
                  WhatsApp: {shop.whatsapp}
                </a>
              ) : (
                <p>Nenhum contato cadastrado.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.2em] text-amber-500">
              Redes sociais
            </h3>
            <div className="mt-4">
              <SocialLinks
                instagram={shop?.instagram}
                facebook={shop?.facebook}
                tiktok={shop?.tiktok}
                label=""
              />
              {!shop?.instagram && !shop?.facebook && !shop?.tiktok && (
                <p className="mt-3 text-sm text-zinc-500">
                  Nenhuma rede social cadastrada.
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>

      {selectedTopic && (
        <Modal
          title={selectedTopic.name}
          onClose={() => setSelectedTopic(null)}
        >
          <p className="mb-5 text-sm leading-6 text-zinc-400">
            {selectedTopic.description || "Serviços disponíveis neste tópico."}
          </p>
          <div className="space-y-3">
            {(selectedTopic.services ?? []).map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4"
              >
                <div>
                  <p className="font-black text-white">{service.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Disponível com os profissionais da barbearia.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-black text-amber-500">
                  R$ {service.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}
            {(selectedTopic.services ?? []).length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                Nenhum serviço cadastrado neste tópico.
              </div>
            )}
          </div>
          <a
            href={bookingPath}
            className="mt-5 block rounded-xl bg-amber-500 py-3 text-center font-black text-zinc-950 hover:bg-amber-400"
          >
            Agendar horário
          </a>
        </Modal>
      )}

      {showAllServices && (
        <Modal
          title={`Todos os serviços${serviceCount ? ` · ${serviceCount}` : ""}`}
          onClose={() => setShowAllServices(false)}
        >
          <div className="space-y-6">
            {topics.map((topic) => (
              <section key={topic.id}>
                <div className="mb-3">
                  <h3 className="font-black text-white">{topic.name}</h3>
                  {topic.description && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {topic.description}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {(topic.services ?? []).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-950 p-3"
                    >
                      <span className="font-bold text-zinc-200">
                        {service.name}
                      </span>
                      <span className="shrink-0 text-sm font-black text-amber-500">
                        R$ {service.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <a
            href={bookingPath}
            className="mt-5 block rounded-xl bg-amber-500 py-3 text-center font-black text-zinc-950 hover:bg-amber-400"
          >
            Agendar horário
          </a>
        </Modal>
      )}
    </div>
  );
}
