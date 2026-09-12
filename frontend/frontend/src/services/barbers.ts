import { api } from "./api";
import type { Barber, BarberAccount } from "../types";

export const barberService = {
  list: () => api.get<Barber[]>("/barbers"),
  me: () => api.get<BarberAccount>("/barbers/me"),
  create: (
    data: Pick<Barber, "name" | "description"> & {
      email: string;
      password: string;
      whatsapp?: string;
    },
  ) => api.post<{ barber: Barber; email: string }>("/barbers", data),
  update: (
    id: number,
    data: Pick<Barber, "name" | "description"> & {
      whatsapp?: string;
      email: string;
      password?: string;
    },
  ) => api.put<Barber>(`/barbers/${id}`, data),
  remove: (id: number) => api.delete(`/barbers/${id}`),
};
