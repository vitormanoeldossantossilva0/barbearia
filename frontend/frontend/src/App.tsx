import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { BarberDetails } from "./pages/BarberDetails";
import { Booking } from "./pages/Booking";
import { BookingSuccess } from "./pages/BookingSuccess";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { ResetPassword } from "./pages/ResetPassword";
import { AdminBarbers } from "./pages/AdminBarbers";
import { AdminServices } from "./pages/AdminServices";
import { AdminSchedules } from "./pages/AdminSchedules";
import { AdminAppointments } from "./pages/AdminAppointments";
import { AdminAppointmentDetails } from "./pages/AdminAppointmentDetails";
import { AdminBarbershop } from "./pages/AdminBarbershop";
import { MasterDashboard } from "./pages/MasterDashboard";
import { MasterBarbershops } from "./pages/MasterBarbershops";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:slug/barbers/:id" element={<BarberDetails />} />
      <Route path="/:slug/booking" element={<Booking />} />
      <Route path="/:slug/booking/success" element={<BookingSuccess />} />
      <Route path="/:slug" element={<Home />} />

      {/* Endereços antigos não carregam mais dados de outra barbearia. */}
      <Route path="/barbers/:id" element={<Navigate to="/" replace />} />
      <Route path="/booking/success" element={<Navigate to="/" replace />} />
      <Route path="/booking" element={<Navigate to="/" replace />} />

      <Route path="/master/login" element={<AdminLogin />} />
      <Route path="/master" element={<MasterDashboard />} />
      <Route path="/master/barbearias" element={<MasterBarbershops />} />

      {/* O painel de cada barbearia tem a própria slug. */}
      <Route path="/:slug/admin/login" element={<AdminLogin />} />
      <Route path="/:slug/admin/redefinir-senha" element={<ResetPassword />} />
      <Route path="/:slug/admin" element={<AdminDashboard />} />
      <Route path="/:slug/admin/barbers" element={<AdminBarbers />} />
      <Route path="/:slug/admin/services" element={<AdminServices />} />
      <Route path="/:slug/admin/schedules" element={<AdminSchedules />} />
      <Route path="/:slug/admin/appointments" element={<AdminAppointments />} />
      <Route path="/:slug/admin/barbershop" element={<AdminBarbershop />} />
      <Route
        path="/:slug/admin/appointments/:id"
        element={<AdminAppointmentDetails />}
      />

      {/* Rotas antigas não abrem mais o último usuário conectado. */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
