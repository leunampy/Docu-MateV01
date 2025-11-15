// src/components/questionnaire/UseSavedDataBox.jsx
import React from "react";
import { Switch } from "@/components/ui/switch";

export default function UseSavedDataBox({ enabled, onToggle }) {
  return (
    <div className="mt-3 flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
      <Switch checked={enabled} onCheckedChange={onToggle} />
      <span className="text-sm text-gray-700">
        Usa dati da profilo salvato
      </span>
    </div>
  );
}
