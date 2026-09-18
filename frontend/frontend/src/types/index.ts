export type AppointmentStatus = "CONFIRMADO" | "CANCELADO";
export type ServiceCategory =
  | "CORTE"
  | "BARBA"
  | "SOBRANCELHA"
  | "PINTURA"
  | "COMBO";

export interface Barbershop {
  id: number;
  name: string;
  slug: string;
  description: string;
  whatsapp?: string | null;
  imageUrl?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  createdAt?: string;
  barbers?: Barber[];
  serviceTopics?: ServiceTopic[];
}

export interface Barber {
  id: number;
  name: string;
  description: string;
  slug: string;
  whatsapp?: string | null;
  imageUrl?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  barbershopId?: number;
  schedules?: Schedule[];
}

export interface BarberAccount extends Barber {
  user?: { email: string; role?: "MASTER" | "ADMIN" | "BARBER" };
}

export interface AuthUser {
  id: number;
  email: string;
  role: "MASTER" | "ADMIN" | "BARBER";
  barbershopId?: number | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  barber: BarberAccount | null;
  barbershop: Barbershop | null;
}

export interface MasterBarbershop extends Barbershop {
  _count?: { barbers: number };
}

export interface ServiceComboItem {
  comboId: number;
  serviceId: number;
  service: Service;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  barberId?: number | null;
  category: ServiceCategory;
  topicId?: number | null;
  topic?: ServiceTopic | null;
  comboItems?: ServiceComboItem[];
}

export interface ServiceTopic {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
  barbershopId?: number;
  services?: Service[];
  _count?: { services: number };
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
