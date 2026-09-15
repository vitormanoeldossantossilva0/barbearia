import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";
import { Modal } from "../components/Modal";
import { Loading } from "../components/Loading";
import { barberService } from "../services/barbers";
import { serviceService } from "../services/services";
import { scheduleService } from "../services/schedules";
import { appointmentService } from "../services/appointments";
import type { Barber, Schedule, Service, ServiceCategory } from "../types";

const steps = ["Barbeiro", "Serviços", "Horário", "Seus dados", "Revisão"];
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

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
      {children}
    </div>
  );
}
function PublicFooter() {
  return (
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
      © {new Date().getFullYear()} Barbearia. Todos os direitos reservados.
    </footer>
  );
}

const categoryLabel: Record<ServiceCategory, string> = {
  CORTE: "Corte",
  BARBA: "Barba",
  SOBRANCELHA: "Sobrancelha",
  PINTURA: "Pintura",
  COMBO: "Combo",
};

const normalCategoryGroups: Array<{ title: string; description: string; categories: ServiceCategory[] }> = [
  {
    title: "Cortes e cuidados",
    description: "Escolha uma opção de cada tipo. Assim você não precisa marcar dois estilos de corte ao mesmo tempo.",
    categories: ["CORTE", "BARBA", "SOBRANCELHA"],
  },
  {
    title: "Pinturas",
    description: "Platinado, luzes, pintura e outras técnicas ficam em uma categoria própria.",
    categories: ["PINTURA"],
  },
];

export function Booking() {
  const params = new URLSearchParams(window.location.search);
  const initialBarberId = Number(params.get("barber")) || 0;
  const initialScheduleId = Number(params.get("schedule")) || 0;
  const initialTemplateId = Number(params.get("template")) || 0;
  const initialDate = params.get("date") || today;

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  // Quando o cliente vem da tela de horários, o barbeiro e o horário
  // já estão definidos. O próximo passo deve ser Serviços.
  const [step, setStep] = useState(initialBarberId ? 1 : 0);
  const [barberId, setBarberId] = useState(initialBarberId);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [scheduleId, setScheduleId] = useState(initialScheduleId);
  const [scheduleTemplateId, setScheduleTemplateId] =
    useState(initialTemplateId);
  const [appointmentDate, setAppointmentDate] = useState(initialDate);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [barberToConfirm, setBarberToConfirm] = useState<Barber | null>(null);

  useEffect(() => {
    barberService
      .list()
      .then(setBarbers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!barberId) {
      setServices([]);
      return;
    }
    setLoadingServices(true);
    setError("");
    serviceService
      .list(barberId)
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingServices(false));
  }, [barberId]);

  useEffect(() => {
    if (!barberId || !appointmentDate) {
      setSchedules([]);
      return;
    }
    setLoadingSchedules(true);
    setError("");
    scheduleService
      .list(barberId, appointmentDate)
      .then((items) => {
        setSchedules(items);
        if (
          initialScheduleId &&
          items.some((s) => s.id === initialScheduleId && s.available !== false)
        ) {
          setScheduleId(initialScheduleId);
        }
        if (
          initialTemplateId &&
          items.some((s) => s.templateId === initialTemplateId && s.available !== false)
        ) {
          setScheduleTemplateId(initialTemplateId);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSchedules(false));
  }, [barberId, appointmentDate]);

  const selectedBarber = barbers.find((b) => b.id === barberId);
  const selectedSchedule =
    schedules.find((s) => s.available !== false && s.id === scheduleId && !s.templateId) ??
    schedules.find((s) => s.available !== false && s.templateId === scheduleTemplateId);
  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const selectedCombo = selectedServices.find((service) => service.category === "COMBO");
  const comboCategories = new Set(
    selectedCombo?.comboItems?.map((item) => item.service.category) ?? [],
  );
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const toggleService = (service: Service) => {
    setError("");
    const isSelected = serviceIds.includes(service.id);

    if (isSelected) {
      setServiceIds((ids) => ids.filter((id) => id !== service.id));
      return;
    }

    if (service.category === "COMBO") {
      const componentCategories = new Set(
        service.comboItems?.map((item) => item.service.category) ?? [],
      );
      setServiceIds((ids) => [
        ...ids.filter((id) => {
          const existing = services.find((item) => item.id === id);
          if (!existing || existing.category === "COMBO") return false;
          return !componentCategories.has(existing.category);
        }),
        service.id,
      ]);
      return;
    }

    setServiceIds((ids) => {
      const next = ids.filter((id) => {
        const existing = services.find((item) => item.id === id);
        if (!existing) return false;
        if (existing.category === service.category) return false;
        if (existing.category === "COMBO" && existing.comboItems?.some((item) => item.service.category === service.category)) return false;
        return true;
      });
      return [...next, service.id];
    });
  };

  const canNext =
    step === 0
      ? !!barberId
      : step === 1
        ? serviceIds.length > 0
        : step === 2
          ? !!selectedSchedule
          : step === 3
            ? customerName.trim().length >= 2 &&
              customerPhone.trim().length >= 8
            : true;

  const chooseSchedule = (s: Schedule) => {
    setScheduleId(s.id || 0);
    setScheduleTemplateId(s.templateId || 0);
  };

  const submit = async () => {
    setError("");
    setSending(true);
    try {
      const appointment = await appointmentService.create({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        description: description.trim() || undefined,
        barberId,
        scheduleId: scheduleId || undefined,
        scheduleTemplateId: scheduleTemplateId || undefined,
        appointmentDate,
        serviceIds,
      });
      const whatsapp = appointment.barber.whatsapp?.replace(/\D/g, "") || "";
      const whatsappMessage = [
        `Olá, ${appointment.barber.name}! Gostaria de confirmar meu agendamento.`,
        "",
        `👤 Cliente: ${appointment.customerName}`,
        `📅 Data: ${dateFormatter.format(new Date(`${appointmentDate}T12:00:00`))}`,
        `🕐 Horário: ${appointment.schedule.time}`,
        `✂️ Serviços: ${appointment.services.map((item) => item.service.name).join(", ")}`,
        `💰 Total: R$ ${appointment.services
          .reduce((sum, item) => sum + item.price, 0)
          .toFixed(2)
          .replace(".", ",")}`,
        `📱 Telefone: ${appointment.customerPhone}`,
        ...(appointment.description
          ? [`📝 Observação: ${appointment.description}`]
          : []),
      ].join("\n");

      sessionStorage.setItem(
        "barbearia:lastBookingWhatsapp",
        JSON.stringify({ phone: whatsapp, message: whatsappMessage }),
      );

      window.location.assign(`/booking/success?id=${appointment.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível realizar o agendamento.",
      );
    } finally {
      setSending(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    let formatted = numbers;

    if (numbers.length > 2) {
      formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    if (numbers.length > 7) {
      formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    setCustomerPhone(formatted);
  };

  if (loading)
    return (
      <>
        <PublicHeader />
        <Loading text="Preparando seu agendamento..." />
        <PublicFooter />
      </>
    );

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-amber-500">
            Agendamento
          </p>
          <h1 className="mt-2 text-4xl font-black">Seu próximo horário</h1>
          <div className="mt-7 grid grid-cols-5 gap-2">
            {steps.map((label, i) => (
              <div
                key={label}
                className={`rounded-full px-2 py-2 text-center text-xs font-bold ${i <= step ? "bg-amber-500 text-zinc-950" : "bg-zinc-900 text-zinc-600"}`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>
        </div>
        {error && (
          <div className="mb-5">
            <Alert>{error}</Alert>
          </div>
        )}
        <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-black text-white">
                Escolha o barbeiro
              </h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBarberToConfirm(b)}
                    className={`rounded-2xl border p-4 text-left ${barberId === b.id ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-zinc-950"} hover:cursor-pointer`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-800 text-2xl">
                        💈
                      </span>
                      <div>
                        <h3 className="font-bold text-white">{b.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black text-white">
                O que você quer fazer?
              </h2>
              <p className="mt-2 text-zinc-300">
                Serviços de {selectedBarber?.name}. Escolha as opções que realmente fazem sentido juntas.
              </p>
              {loadingServices ? (
                <Loading text="Carregando serviços..." />
              ) : services.length === 0 ? (
                <div className="mt-7">
                  <Alert>Este barbeiro ainda não possui serviços cadastrados.</Alert>
                </div>
              ) : (
                <div className="mt-7 space-y-8">
                  {normalCategoryGroups.map((group) => (
                    <section key={group.title}>
                      <h3 className="text-lg font-black text-white">{group.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{group.description}</p>

                      <div className="mt-5 space-y-6">
                        {group.categories.map((category) => {
                          const categoryServices = services.filter((service) => service.category === category);
                          if (categoryServices.length === 0) return null;
                          const categorySelected = selectedServices.some((service) => service.category === category);

                          return (
                            <div key={category}>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-zinc-300">{categoryLabel[category]}</p>
                                {categorySelected && (
                                  <span className="text-xs font-bold text-amber-500">1 opção selecionada</span>
                                )}
                              </div>
                              <div className="grid gap-3">
                                {categoryServices.map((service) => {
                                  const selected = serviceIds.includes(service.id);
                                  const blockedByCombo = !selected && comboCategories.has(category);
                                  const blockedByCategory = !selected && categorySelected;
                                  const disabled = blockedByCombo || blockedByCategory;
                                  return (
                                    <button
                                      key={service.id}
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => toggleService(service)}
                                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                                        selected
                                          ? "border-amber-500 bg-amber-500/10"
                                          : disabled
                                            ? "cursor-not-allowed border-white/5 bg-zinc-950/50 opacity-45"
                                            : "border-white/10 bg-zinc-950 hover:border-amber-500/50"
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <span className="block font-bold text-white">{service.name}</span>
                                        {disabled && (
                                          <span className="mt-1 block text-xs text-zinc-600">
                                            {blockedByCombo ? "Já incluído no combo selecionado" : "Outra opção desta categoria já foi escolhida"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex shrink-0 items-center gap-3">
                                        <span className="text-sm font-bold text-amber-500">
                                          R$ {service.price.toFixed(2).replace(".", ",")}
                                        </span>
                                        <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${selected ? "border-amber-500 bg-amber-500 text-zinc-950" : "border-zinc-700 text-transparent"}`}>
                                          ✓
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {services.filter((service) => service.category === "COMBO").length > 0 && (
                    <section>
                      <h3 className="text-lg font-black text-white">Combos</h3>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        Um combo substitui os serviços que fazem parte dele. Você ainda pode adicionar outras categorias que não estejam incluídas.
                      </p>
                      <div className="mt-5 grid gap-3">
                        {services.filter((service) => service.category === "COMBO").map((service) => {
                          const selected = serviceIds.includes(service.id);
                          const anotherComboSelected = Boolean(selectedCombo && !selected);
                          return (
                            <button
                              key={service.id}
                              type="button"
                              disabled={anotherComboSelected}
                              onClick={() => toggleService(service)}
                              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-amber-500 bg-amber-500/10"
                                  : anotherComboSelected
                                    ? "cursor-not-allowed border-white/5 bg-zinc-950/50 opacity-45"
                                    : "border-white/10 bg-zinc-950 hover:border-amber-500/50"
                              }`}
                            >
                              <div>
                                <span className="block font-bold text-white">{service.name}</span>
                                <span className="mt-1 block text-xs leading-5 text-zinc-500">
                                  {service.comboItems?.map((item) => item.service.name).join(" + ") || "Combo sem itens"}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-sm font-bold text-amber-500">
                                  R$ {service.price.toFixed(2).replace(".", ",")}
                                </span>
                                <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${selected ? "border-amber-500 bg-amber-500 text-zinc-950" : "border-zinc-700 text-transparent"}`}>✓</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black text-white">
                Escolha o dia e o horário
              </h2>
              <p className="mt-2 text-zinc-300">
                O barbeiro mantém os horários disponíveis; você escolhe o dia.
              </p>
              <label className="mt-6 block max-w-xs text-sm font-bold text-white">
                Dia do atendimento
                <input
                  type="date"
                  min={today}
                  value={appointmentDate}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value);
                    setScheduleId(0);
                    setScheduleTemplateId(0);
                  }}
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
                <div className="mt-7">
                  <Alert>
                    Não há horários disponíveis para este dia. Escolha outra
                    data.
                  </Alert>
                </div>
              ) : (
                <div className="mt-7">
                  <p className="mb-3 font-bold capitalize text-zinc-300">
                    {dateFormatter.format(
                      new Date(`${appointmentDate}T12:00:00`),
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {schedules.map((s) => {
                      const unavailable = s.available === false;
                      const selected =
                        !unavailable &&
                        ((s.templateId && scheduleTemplateId === s.templateId) ||
                          (!s.templateId && scheduleId === s.id));
                      return (
                        <button
                          key={`${s.templateId || "schedule"}-${s.id}-${s.time}`}
                          disabled={unavailable}
                          onClick={() => !unavailable && chooseSchedule(s)}
                          className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                            unavailable
                              ? "cursor-not-allowed border-white/5 bg-zinc-950/60 text-zinc-600"
                              : selected
                                ? "border-amber-500 bg-amber-500 text-zinc-950"
                                : "border-white/10 bg-zinc-950 text-zinc-300 hover:border-amber-500/50"
                          }`}
                        >
                          {s.time} {unavailable ? "· Indisponível" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-black text-white">Quase lá.</h2>
              <p className="mt-2 text-zinc-300">
                Informe seus dados para confirmar o horário.
              </p>
              <div className="mt-7 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white">
                    Nome
                  </span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={32}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white">
                    Telefone
                  </span>
                  <input
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white">
                    Observação{" "}
                    <span className="font-normal text-zinc-400">
                      (opcional)
                    </span>
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Alguma preferência ou observação?"
                    maxLength={150}
                    rows={4}
                    className="w-full resize-y rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  />
                </label>
              </div>
              <p className="mt-4 text-xs text-zinc-600">
                Esses dados são usados somente neste agendamento.
              </p>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-black text-white">
                Revise antes de confirmar
              </h2>
              <p className="mt-2 text-zinc-300">
                Confira tudo o que você escolheu.
              </p>
              <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                {[
                  ["Barbeiro", selectedBarber?.name || "Não selecionado"],
                  [
                    "Serviços",
                    selectedServices
                      .map(
                        (s) =>
                          `${s.name} — R$ ${s.price.toFixed(2).replace(".", ",")}`,
                      )
                      .join(" · ") || "Nenhum",
                  ],
                  [
                    "Data",
                    dateFormatter.format(
                      new Date(`${appointmentDate}T12:00:00`),
                    ),
                  ],
                  ["Horário", selectedSchedule?.time || "Não selecionado"],
                  ["Nome", customerName || "Não informado"],
                  ["Telefone", customerPhone || "Não informado"],
                  ["Observação", description.trim() || "Sem observação"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex flex-col gap-1 border-b border-white/10 p-4 last:border-b-0 sm:flex-row sm:justify-between"
                  >
                    <span className="text-sm text-zinc-300">{k}</span>
                    <span className="text-sm font-bold text-white sm:max-w-[70%] sm:text-right">
                      {v}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between bg-amber-500/5 p-4">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-black text-amber-500">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border border-white/10 px-5 py-3 font-bold text-zinc-300 hover:cursor-pointer"
              >
                Voltar
              </button>
            ) : (
              <Link
                to="/"
                className="rounded-xl border border-white/10 px-5 py-3 text-center font-bold text-zinc-300"
              >
                Cancelar
              </Link>
            )}
            {step < 4 ? (
              <button
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-amber-500 px-6 py-3 font-black text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 hover:cursor-pointer"
              >
                Continuar
              </button>
            ) : (
              <button
                disabled={sending}
                onClick={submit}
                className="rounded-xl bg-amber-500 px-6 py-3 font-black text-zinc-950 disabled:opacity-50 hover:cursor-pointer"
              >
                {sending ? "Agendando..." : "Confirmar agendamento"}
              </button>
            )}
          </div>
        </section>
      </main>

      {barberToConfirm && (
        <Modal title="É este o barbeiro?" onClose={() => setBarberToConfirm(null)}>
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-4xl">
              💈
            </div>
            <h2 className="mt-5 text-2xl font-black text-white">{barberToConfirm.name}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Você quer continuar o agendamento com este barbeiro?
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setBarberToConfirm(null)}
                className="rounded-xl border border-white/10 px-4 py-3 font-bold text-zinc-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setBarberId(barberToConfirm.id);
                  setServiceIds([]);
                  setScheduleId(0);
                  setScheduleTemplateId(0);
                  setBarberToConfirm(null);
                  setStep(1);
                }}
                className="rounded-xl bg-amber-500 px-4 py-3 font-black text-zinc-950 hover:bg-amber-400"
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PublicFooter />
    </>
  );
}
