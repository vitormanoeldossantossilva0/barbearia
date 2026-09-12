import { api } from "./api";
import type { AuthResponse, BarberAccount } from "../types";

export const authService = {
  login: async (email: string, password: string) => {
    const result = await api.post<AuthResponse>("/auth/login", { email, password });
    localStorage.setItem("barbearia_token", result.token);
    localStorage.setItem("barbearia_barber", JSON.stringify(result.barber));
    return result;
  },
  me: () => api.get<{ barber: BarberAccount }>("/auth/me"),
  logout: () => {
    localStorage.removeItem("barbearia_token");
    localStorage.removeItem("barbearia_barber");
  },
  isAuthenticated: () => Boolean(localStorage.getItem("barbearia_token")),
};
