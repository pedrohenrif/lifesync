import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "./layouts/AuthLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { Home } from "./pages/Home";
import { Goals } from "./pages/Goals";
import { Habits } from "./pages/Habits";
import { Finance } from "./pages/Finance";
import { Vault } from "./pages/Vault";
import { Agenda } from "./pages/Agenda";
import { Trips } from "./pages/Trips";
import { TripLayout } from "./pages/TripLayout";
import { TripPacking } from "./pages/TripPacking";
import { TripChecklist } from "./pages/TripChecklist";
import { TripReservations } from "./pages/TripReservations";
import { TripItinerary } from "./pages/TripItinerary";
import { TripExpenses } from "./pages/TripExpenses";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Landing } from "./pages/Landing";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Onboarding } from "./pages/Onboarding";
import { LandingLayout } from "./layouts/LandingLayout";

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
        </Route>

        {/* Fora dos layouts: precisa abrir com ou sem sessão, inclusive para a revisão do Google. */}
        <Route path="/privacidade" element={<PrivacyPolicy />} />

        <Route element={<AuthLayout />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/agenda" element={<Agenda />} />

          {/* Contexto de viagens: as seções só existem dentro de uma viagem. */}
          <Route path="/viagens" element={<Trips />} />
          <Route path="/viagens/:tripId" element={<TripLayout />}>
            <Route index element={<Navigate to="bagagem" replace />} />
            <Route path="bagagem" element={<TripPacking />} />
            <Route path="pendencias" element={<TripChecklist />} />
            <Route path="reservas" element={<TripReservations />} />
            <Route path="roteiro" element={<TripItinerary />} />
            <Route path="gastos" element={<TripExpenses />} />
          </Route>

          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster theme="dark" position="bottom-right" richColors />
    </BrowserRouter>
  );
}
