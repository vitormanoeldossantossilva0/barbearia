import { api } from "./api";
import type { Service } from "../types";

export const serviceService = {
  list: (barberId?: number) =>
    api.get<Service[]>(
      barberId ? `/services?barberId=${barberId}` : "/services",
    ),
  mine: () => api.get<Service[]>("/services/mine"),
  get: (id: number) => api.get<Service>(`/services/${id}`),
  create: (name: string, price: number) =>
    api.post<Service>("/services", { name, price }),
  update: (id: number, name: string, price: number) =>
    api.put<Service>(`/services/${id}`, { name, price }),
  remove: (id: number) => api.delete(`/services/${id}`),
};
