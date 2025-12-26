import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import AuthPage from "@/pages/AuthPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

export default function App() {
  return (
    <Routes>
      {/* 🔹 Pagina di login/registrazione (fuori dal layout) */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* 🔹 Tutte le altre pagine dentro il layout */}
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

