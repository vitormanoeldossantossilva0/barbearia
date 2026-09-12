import { api } from "./api";
import type { Appointment, AppointmentStatus, CreateAppointmentPayload } from "../types";

export const appointmentService = {
  list: () => api.get<Appointment[]>("/appointments/mine"),
  get: (id: number) => api.get<Appointment>(`/appointments/${id}`),
  create: (data: CreateAppointmentPayload) => api.post<Appointment>("/appointments", data),
  updateStatus: (id: number, status: AppointmentStatus) =>
    api.patch<Appointment>(`/appointments/${id}/status`, { status }),
  cancel: (id: number) => api.delete<Appointment>(`/appointments/${id}`),
  remove: (id: number) => api.delete(`/appointments/${id}/permanent`),
};
