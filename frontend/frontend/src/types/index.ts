export type AppointmentStatus = "CONFIRMADO" | "CANCELADO";

export interface Barber {
  id: number;
  name: string;
  description: string;
  slug: string;
  whatsapp?: string | null;
  schedules?: Schedule[];
}

export interface BarberAccount extends Barber {
  user?: { email: string; role?: "ADMIN" | "BARBER" };
}

export interface AuthResponse {
  token: string;
  barber: BarberAccount;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  barberId?: number | null;
}

export interface Schedule {
  id: number;
  date: string;
  time: string;
  barberId: number;
  barber?: Barber;
  appointment?: Appointment | null;
  available?: boolean;
  templateId?: number | null;
}

export interface ScheduleTemplate {
  id: number;
  time: string;
  barberId: number;
}

export interface AppointmentService {
  appointmentId: number;
  serviceId: number;
  price: number;
  service: Service;
}

export interface Appointment {
  id: number;
  customerName: string;
  customerPhone: string;
  description?: string | null;
  status: AppointmentStatus;
  barberId: number;
  scheduleId: number;
  createdAt: string;
  barber: Barber;
  schedule: Schedule;
  services: AppointmentService[];
}

export interface CreateAppointmentPayload {
  customerName: string;
  customerPhone: string;
  description?: string;
  barberId: number;
  scheduleId?: number;
  scheduleTemplateId?: number;
  appointmentDate: string;
  serviceIds: number[];
}
