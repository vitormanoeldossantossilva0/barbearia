import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService } from "../services/auth";

export function AdminLogin() {
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const shopSlug = slug;
  const isMasterLogin = !shopSlug;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated(shopSlug)) return;

    authService
      .me()
      .then((data) => {
        if (isMasterLogin && data.user.role === "MASTER") {
          navigate("/master", { replace: true });
          return;
        }

        if (!isMasterLogin && data.user.role === "MASTER") {
          authService.logout();
          return;
        }

        if (!isMasterLogin) {
          const currentShop = data.barbershop?.slug || "";
          if (currentShop === shopSlug) {
            navigate(`/${encodeURIComponent(shopSlug)}/admin`, {
              replace: true,
            });
          }
        }
      })
      .catch(() => {
        authService.logout(shopSlug);
      });
  }, [navigate, shopSlug]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const result = await authService.login(email.trim(), password, shopSlug);
      if (result.user.role === "MASTER") {
        if (isMasterLogin) {
          navigate("/master", { replace: true });
          return;
        }
        authService.logout();
        setError("A conta Master deve entrar pelo acesso Master.");
        return;
      }

      if (isMasterLogin) {
        setError(
          "Esta é a área Master. Use a conta de administrador da plataforma.",
        );
        return;
      }

      const loggedShop = result.barbershop?.slug || "";
      if (loggedShop !== shopSlug) {
        authService.logout(shopSlug);
        setError(
          "Esta conta pertence a outra barbearia. Use a conta vinculada a esta slug.",
        );
        return;
      }

      navigate(`/${encodeURIComponent(shopSlug)}/admin`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-7 sm:p-9"
      >
        <p className="text-sm font-bold uppercase tracking-[.2em] text-amber-500">
          {isMasterLogin ? "Área Master" : "Área administrativa"}
        </p>
        <h1 className="mt-2 text-3xl font-black">
          {isMasterLogin ? "Entrar no painel Master" : "Entrar no painel"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isMasterLogin
            ? "Acesso exclusivo para administrar a plataforma e suas barbearias."
            : "Use a conta da barbearia para acessar o painel correspondente ao link escolhido."}
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="mt-6 block text-sm font-bold">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Senha
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 hover:text-white mt-0.5"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </label>

        <button
          disabled={sending}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50"
        >
          {sending ? "Entrando..." : "Entrar"}
        </button>

        {!isMasterLogin && (
          <a
            href={`/${encodeURIComponent(shopSlug)}/admin/redefinir-senha`}
            className="mt-4 block text-center text-sm text-amber-500 hover:text-amber-400"
          >
            Esqueci minha senha
          </a>
        )}

        <a
          href={isMasterLogin ? "/" : `/${encodeURIComponent(shopSlug)}`}
          className="mt-4 block text-center text-sm text-zinc-500 hover:text-white"
        >
          ← Voltar para o site
        </a>
      </form>
    </main>
  );
}
