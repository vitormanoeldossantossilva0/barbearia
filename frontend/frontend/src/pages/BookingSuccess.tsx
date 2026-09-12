import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";

type WhatsappData = { phone: string; message: string };

export function BookingSuccess() {
  const params = new URLSearchParams(window.location.search);
  const [whatsapp, setWhatsapp] = useState<WhatsappData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("barbearia:lastBookingWhatsapp");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as WhatsappData;
      if (data.phone && data.message) setWhatsapp(data);
    } catch {
      sessionStorage.removeItem("barbearia:lastBookingWhatsapp");
    }
  }, []);

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.message)}`
    : "";

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
            número <strong className="text-white">#{params.get("id") || "—"}</strong>{" "}
            para referência.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {whatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-emerald-500 px-7 py-3.5 font-black text-zinc-950 hover:bg-emerald-400"
              >
                📱 Enviar agendamento pelo WhatsApp
              </a>
            )}
            <Link
              to="/"
              className="rounded-full bg-amber-500 px-7 py-3.5 font-black text-zinc-950 hover:bg-amber-400"
            >
              Voltar para o início
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
