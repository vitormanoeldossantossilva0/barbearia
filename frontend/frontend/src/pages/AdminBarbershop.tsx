import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Loading } from "../components/Loading";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { barbershopService } from "../services/barbershop";
import type { Barbershop } from "../types";
import { formatPhone } from "../utils/phone";

export function AdminBarbershop() {
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    whatsapp: "",
    imageUrl: "",
    instagram: "",
    facebook: "",
    tiktok: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    barbershopService
      .mine()
      .then((data) => {
        setShop(data);
        setForm({
          name: data.name,
          description: data.description || "",
          whatsapp: formatPhone(data.whatsapp || ""),
          imageUrl: data.imageUrl || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          tiktok: data.tiktok || "",
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar."),
      )
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await barbershopService.updateMine(form);
      setShop(updated);
      setForm({
        name: updated.name,
        description: updated.description,
        whatsapp: formatPhone(updated.whatsapp || ""),
        imageUrl: updated.imageUrl || "",
        instagram: updated.instagram || "",
        facebook: updated.facebook || "",
        tiktok: updated.tiktok || "",
      });
      setMessage("Dados da barbearia atualizados com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-black">Minha barbearia</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Altere as informações e a imagem que aparecem no site público.
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="space-y-5">
            <label className="block text-sm font-bold">
              Nome
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>

            <label className="block text-sm font-bold">
              Descrição
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>

            <label className="block text-sm font-bold">
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    whatsapp: formatPhone(e.target.value),
                  }))
                }
                placeholder="(12) 99999-9999"
                inputMode="tel"
                maxLength={15}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
              />
            </label>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <p className="text-sm font-bold">
                Redes sociais{" "}
                <span className="font-normal text-zinc-500">(opcional)</span>
              </p>
              <label className="block text-xs font-bold text-zinc-400">
                Instagram
                <input
                  value={form.instagram}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      instagram: e.target.value,
                    }))
                  }
                  placeholder="https://instagram.com/suabarbearia"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                Facebook
                <input
                  value={form.facebook}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      facebook: e.target.value,
                    }))
                  }
                  placeholder="https://facebook.com/suabarbearia"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                TikTok
                <input
                  value={form.tiktok}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      tiktok: e.target.value,
                    }))
                  }
                  placeholder="https://tiktok.com/@suabarbearia"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Imagem da barbearia</p>
              <ImageUploadButton
                value={form.imageUrl}
                onChange={(value) =>
                  setForm((current) => ({ ...current, imageUrl: value }))
                }
                label="Adicionar imagem da barbearia"
                errorMessage={setError}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {message}
              </div>
            )}

            <button
              disabled={saving || !shop}
              onClick={save}
              className="w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
