import { api } from "./api";
import type { Barbershop, MasterBarbershop } from "../types";

export const barbershopService = {
  public: (slug: string) => api.get<Barbershop>(`/barbershop/public/${encodeURIComponent(slug)}`),
  publicDefault: () => api.get<Barbershop>("/barbershop/public-default"),
  mine: () => api.get<Barbershop>("/barbershop/mine"),
  updateMine: (data: Record<string, unknown>) => api.put<Barbershop>("/barbershop/mine", data),
  masterList: () => api.get<MasterBarbershop[]>("/barbershop/master"),
  masterCreate: (data: Record<string, unknown>) => api.post("/barbershop/master", data),
  masterUpdate: (id: number, data: Record<string, unknown>) => api.put<Barbershop>(`/barbershop/master/${id}`, data),
  masterDelete: (id: number) => api.delete(`/barbershop/master/${id}`),
};
