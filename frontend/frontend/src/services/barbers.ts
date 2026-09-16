import { api } from "./api";
import type { Barber, BarberAccount } from "../types";

export const barberService = {
  list: (barbershopSlug?: string) => api.get<Barber[]>(barbershopSlug ? `/barbers?barbershopSlug=${encodeURIComponent(barbershopSlug)}` : "/barbers"),
  me: () => api.get<BarberAccount>("/barbers/me"),
  manage: () => api.get<BarberAccount[]>("/barbers/manage"),
  create: (
    data: Pick<Barber, "name" | "description"> & {
      email: string;
      password: string;
      whatsapp?: string;
      imageUrl?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    },
  ) => api.post<{ barber: Barber; email: string }>("/barbers", data),
  update: (
    id: number,
    data: Pick<Barber, "name" | "description"> & {
      whatsapp?: string;
      email: string;
      password?: string;
      imageUrl?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    },
  ) => api.put<Barber>(`/barbers/${id}`, data),
  remove: (id: number) => api.delete(`/barbers/${id}`),
};
