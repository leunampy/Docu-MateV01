// src/components/questionnaire/CompanySelector.jsx
import React from "react";

export default function CompanySelector({ companies, selected, onChange }) {
  return (
    <select
      className="w-full border rounded-lg px-3 py-2 mt-2"
      value={selected || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— Seleziona azienda —</option>
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.ragione_sociale} ({c.forma_giuridica})
        </option>
      ))}
    </select>
  );
}
