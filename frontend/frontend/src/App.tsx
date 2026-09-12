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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/barbers/:id" element={<BarberDetails />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/booking/success" element={<BookingSuccess />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/redefinir-senha" element={<ResetPassword />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/barbers" element={<AdminBarbers />} />
      <Route path="/admin/services" element={<AdminServices />} />
      <Route path="/admin/schedules" element={<AdminSchedules />} />
      <Route path="/admin/appointments" element={<AdminAppointments />} />
      <Route
        path="/admin/appointments/:id"
        element={<AdminAppointmentDetails />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
