import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth";

export function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setSending(true);
    try {
      const result = await authService.resetPassword(email.trim(), code.trim(), password);
      setSuccess(result.mensagem);
      setTimeout(() => navigate("/admin/login", { replace: true }), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível redefinir a senha.");
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
        <h1 className="mt-2 text-3xl font-black">Redefinir senha</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Informe seus dados para criar uma nova senha.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {success} Redirecionando para o login...
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
          Código de redefinição
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Nova senha
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Confirmar nova senha
          <input
            type="password"
            required
            minLength={6}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 font-normal outline-none focus:border-amber-500"
          />
        </label>

        <button
          disabled={sending}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-black text-zinc-950 disabled:opacity-50"
        >
          {sending ? "Redefinindo..." : "Redefinir senha"}
        </button>

        <Link
          to="/admin/login"
          className="mt-4 block text-center text-sm text-zinc-500 hover:text-white"
        >
          ← Voltar para o login
        </Link>
      </form>
    </main>
  );
}
