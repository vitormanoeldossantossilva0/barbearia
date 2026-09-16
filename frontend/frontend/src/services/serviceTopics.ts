import { api } from "./api";
import type { ServiceTopic } from "../types";

export type SaveServiceTopicPayload = {
  name: string;
  description?: string;
  imageUrl?: string | null;
};

export const serviceTopicService = {
  public: (slug: string) =>
    api.get<ServiceTopic[]>(`/service-topics/public/${encodeURIComponent(slug)}`),
  mine: () => api.get<ServiceTopic[]>("/service-topics/mine"),
  create: (data: SaveServiceTopicPayload) =>
    api.post<ServiceTopic>("/service-topics", data),
  update: (id: number, data: SaveServiceTopicPayload) =>
    api.put<ServiceTopic>(`/service-topics/${id}`, data),
  remove: (id: number) => api.delete(`/service-topics/${id}`),
};
