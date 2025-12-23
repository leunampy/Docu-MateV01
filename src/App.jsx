import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import AuthPage from "@/pages/AuthPage";

export default function App() {
  return (
    <Routes>
      {/* 🔹 Pagina di login/registrazione (fuori dal layout) */}
      <Route path="/auth" element={<AuthPage />} />

      {/* 🔹 Tutte le altre pagine dentro il layout */}
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

