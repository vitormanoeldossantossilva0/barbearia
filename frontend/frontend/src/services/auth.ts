import { api } from "./api";
import type { AuthResponse, BarberAccount } from "../types";

const MASTER_TOKEN_KEY = "barbearia_token_master";
const legacyTokenKey = "barbearia_token";
const legacyBarberKey = "barbearia_barber";

const normalizeSlug = (slug: string) => decodeURIComponent(slug).trim().toLowerCase();
const tokenKey = (slug?: string) => {
  const normalized = normalizeSlug(slug || "");
  return normalized ? `barbearia_token_${normalized}` : MASTER_TOKEN_KEY;
};
const barberKey = (slug?: string) => {
  const normalized = normalizeSlug(slug || "");
  return normalized ? `barbearia_barber_${normalized}` : "barbearia_barber_master";
};

export const authService = {
  login: async (email: string, password: string, slug?: string) => {
    const result = await api.post<AuthResponse>("/auth/login", { email, password });
    const key = result.user.role === "MASTER" ? MASTER_TOKEN_KEY : tokenKey(slug);
    const userBarberKey = result.user.role === "MASTER" ? "barbearia_barber_master" : barberKey(slug);

    localStorage.setItem(key, result.token);
    localStorage.setItem(userBarberKey, JSON.stringify(result.barber));

    // Remove the old global session format so it cannot interfere with legacy code.
    localStorage.removeItem(legacyTokenKey);
    localStorage.removeItem(legacyBarberKey);

    return result;
  },
  resetPassword: (code: string, newPassword: string) =>
    api.post<{ mensagem: string }>("/auth/reset-password", { code, newPassword }),
  me: () =>
    api.get<{
      user: { id: number; email: string; role: "MASTER" | "ADMIN" | "BARBER"; barbershopId?: number | null };
      barber: BarberAccount | null;
      barbershop: import("../types").Barbershop | null;
    }>("/auth/me"),
  logout: (slug?: string) => {
    if (slug) {
      localStorage.removeItem(tokenKey(slug));
      localStorage.removeItem(barberKey(slug));
      return;
    }
    localStorage.removeItem(MASTER_TOKEN_KEY);
    localStorage.removeItem("barbearia_barber_master");
    localStorage.removeItem(legacyTokenKey);
    localStorage.removeItem(legacyBarberKey);
  },
  isAuthenticated: (slug?: string) => Boolean(localStorage.getItem(tokenKey(slug))),
};
