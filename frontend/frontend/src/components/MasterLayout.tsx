import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { authService } from "../services/auth";

const links = [["/master", "Dashboard"], ["/master/barbearias", "Barbearias"]];
export function MasterLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate(); const location = useLocation(); const [email, setEmail] = useState("");
  useEffect(() => { if (!authService.isAuthenticated()) { navigate("/master/login", { replace: true }); return; } authService.me().then(({user}) => { if (user.role !== "MASTER") throw new Error(); setEmail(user.email); }).catch(() => { authService.logout(); navigate("/master/login", { replace: true }); }); }, [navigate]);
  const logout = () => { authService.logout(); navigate("/master/login", { replace: true }); };
  return <div className="min-h-screen bg-zinc-950 text-white">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-zinc-900/70 p-5 lg:block"><Logo /><div className="mt-7 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><p className="text-xs text-zinc-500">Administrador da plataforma</p><p className="mt-1 truncate text-sm font-bold text-white">{email}</p></div><p className="mt-7 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600">Master</p><nav className="mt-3 space-y-1">{links.map(([to,label]) => <NavLink key={to} to={to} end={to === "/master"} className={({isActive}) => `block rounded-xl px-3 py-3 text-sm font-medium ${isActive ? "bg-amber-500 font-bold text-zinc-950" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>{label}</NavLink>)}</nav><button onClick={logout} className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 px-3 py-3 text-left text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white">Sair</button></aside>
    <main className="min-h-screen lg:pl-64"><header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center justify-between"><div><p className="text-xs text-zinc-500">Painel master</p><h1 className="font-bold">{links.find(([to]) => to === location.pathname)?.[1] ?? "Detalhes"}</h1></div><div className="flex gap-4"><button onClick={logout} className="text-sm font-medium text-zinc-400 hover:text-white">Sair</button><NavLink to="/" className="text-sm font-medium text-zinc-400 hover:text-white">← Site público</NavLink></div></div><nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">{links.map(([to,label]) => <NavLink key={to} to={to} end={to === "/master"} className={({isActive}) => `whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${isActive ? "bg-amber-500 font-bold text-zinc-950" : "bg-white/5 text-zinc-400"}`}>{label}</NavLink>)}</nav></header><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div></main>
  </div>;
}
