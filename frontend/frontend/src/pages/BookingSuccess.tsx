import { useEffect, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";

export function BookingSuccess() {
  const params = new URLSearchParams(window.location.search);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("barbearia:lastBookingWhatsapp");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { phone?: string; message?: string };
      if (data.phone && data.message) {
        const phone = data.phone.startsWith("55") ? data.phone : `55${data.phone}`;
        setWhatsappUrl(`https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`);
      }
    } catch {
      sessionStorage.removeItem("barbearia:lastBookingWhatsapp");
    }
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-16 text-center sm:px-6">
        <div className="w-full rounded-3xl border border-emerald-500/20 bg-zinc-900 p-8 sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-4xl text-emerald-400">
            ✓
          </div>
          <p className="mt-7 text-sm font-bold uppercase tracking-[.2em] text-emerald-400">
            Agendamento confirmado
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">
            Seu horário está reservado.
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-400">
            Tudo certo! Seu agendamento foi registrado com sucesso. Guarde o
            número{" "}
            <strong className="text-white">#{params.get("id") || "—"}</strong>{" "}
            para referência.
          </p>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 font-black text-white hover:bg-emerald-400"
            >
              <span className="text-xl">☏</span>
              Enviar agendamento pelo WhatsApp
            </a>
          ) : (
            <p className="mx-auto mt-8 max-w-md rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-500">
              O WhatsApp deste barbeiro ainda não foi configurado.
            </p>
          )}

          <a
            href="/"
            className="mt-3 inline-block rounded-full border border-white/10 px-7 py-3.5 font-black text-zinc-300 hover:border-white/20 hover:text-white"
          >
            Voltar para o início
          </a>
        </div>
      </main>
    </>
  );
}
