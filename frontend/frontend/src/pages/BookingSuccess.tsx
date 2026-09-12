import { PublicHeader } from "../components/PublicHeader";

export function BookingSuccess() {
  const params = new URLSearchParams(window.location.search);
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
          <a
            href="/"
            className="mt-8 inline-block rounded-full bg-amber-500 px-7 py-3.5 font-black text-zinc-950 hover:bg-amber-400"
          >
            Voltar para o início
          </a>
        </div>
      </main>
    </>
  );
}
