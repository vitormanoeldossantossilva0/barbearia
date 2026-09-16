import { api } from "./api";
import type { Service, ServiceCategory } from "../types";

export interface SaveServicePayload {
  name: string;
  price: number;
  category: ServiceCategory;
  topicId: number;
  includedServiceIds?: number[];
}

export const serviceService = {
  list: (barberId?: number, barbershopSlug?: string) => {
    const params = new URLSearchParams();
    if (barberId) params.set("barberId", String(barberId));
    if (barbershopSlug) params.set("barbershopSlug", barbershopSlug);
    const query = params.toString();
    return api.get<Service[]>(query ? `/services?${query}` : "/services");
  },
  mine: () => api.get<Service[]>("/services/mine"),
  get: (id: number) => api.get<Service>(`/services/${id}`),
  create: (data: SaveServicePayload) => api.post<Service>("/services", data),
  update: (id: number, data: SaveServicePayload) =>
    api.put<Service>(`/services/${id}`, data),
  remove: (id: number) => api.delete(`/services/${id}`),
};
