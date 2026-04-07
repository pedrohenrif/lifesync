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
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/vault" element={<Vault />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster theme="dark" position="bottom-right" richColors />
    </BrowserRouter>
  );
}
