import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      await authService.login(email.trim(), password);
      navigate("/admin", { replace: true });
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
          Área do barbeiro
        </p>
        <h1 className="mt-2 text-3xl font-black">Entrar no painel</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Use a conta do barbeiro para acessar seus dados.
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
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <button
          disabled={sending}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50"
        >
          {sending ? "Entrando..." : "Entrar"}
        </button>

        <a href="/" className="mt-4 block text-center text-sm text-zinc-500 hover:text-white">
          ← Voltar para o site
        </a>
      </form>
    </main>
  );
}
