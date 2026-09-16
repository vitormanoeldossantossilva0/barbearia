import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MasterLayout } from "../components/MasterLayout";
import { Loading } from "../components/Loading";
import { barbershopService } from "../services/barbershop";
import type { MasterBarbershop } from "../types";
export function MasterDashboard() {
  const [items, setItems] = useState<MasterBarbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    barbershopService
      .masterList()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <MasterLayout>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-amber-500">
          Plataforma
        </p>
        <h2 className="mt-2 text-3xl font-black">Visão geral</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Gerencie as barbearias cadastradas sem alterar o código do sistema.
        </p>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">Barbearias</p>
              <p className="mt-2 text-3xl font-black">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">Barbeiros</p>
              <p className="mt-2 text-3xl font-black">
                {items.reduce((n, s) => n + (s._count?.barbers ?? 0), 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">Acesso</p>
              <p className="mt-2 text-lg font-black text-emerald-400">Ativo</p>
            </div>
          </div>
          <Link
            to="/master/barbearias"
            className="mt-6 inline-flex rounded-xl bg-amber-500 px-5 py-3 font-black text-zinc-950"
          >
            Gerenciar barbearias
          </Link>
        </>
      )}
    </MasterLayout>
  );
}
