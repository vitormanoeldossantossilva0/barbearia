import { api } from "./api";
import type { Schedule, ScheduleTemplate } from "../types";

export const scheduleService = {
  list: (barberId?: number, date?: string) => {
    const params = new URLSearchParams();
    if (barberId) params.set("barberId", String(barberId));
    if (date) params.set("date", date);
    const query = params.toString();
    return api.get<Schedule[]>(query ? `/schedules?${query}` : "/schedules");
  },
  mine: () => api.get<ScheduleTemplate[]>("/schedules/mine"),
  create: (time: string) =>
    api.post<ScheduleTemplate>("/schedules", { time }),
  remove: (id: number) => api.delete(`/schedules/${id}`),
};
