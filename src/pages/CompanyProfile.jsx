import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Factory } from "lucide-react";
import CompanyProfileModal from "@/components/compile/CompanyProfileModal";
import { useAuth } from "@/contexts/AuthContext";

export default function CompanyProfilePage() {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  // FETCH PROFILI AZIENDALI
  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Errore caricamento profili:", error);
    } else {
      setProfiles(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (user?.id) loadProfiles();
  }, [user]);

  // CREAZIONE PROFILO
  function openCreateModal() {
    setEditingProfile(null);
    setOpenModal(true);
  }

  // MODIFICA PROFILO
  function openEditModal(profile) {
    setEditingProfile(profile);
    setOpenModal(true);
  }

  // ELIMINAZIONE PROFILO
  async function deleteProfile(profileId) {
    if (!confirm("Sei sicuro di voler eliminare questo profilo aziendale?")) return;

    const { error } = await supabase
      .from("company_profiles")
      .delete()
      .eq("id", profileId);

    if (error) {
      alert("Errore durante l'eliminazione");
      console.error(error);
      return;
    }

    loadProfiles();
  }

  // SALVATAGGIO DA MODAL
  function handleModalSaved() {
    setOpenModal(false);
    loadProfiles();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Factory className="w-8 h-8 text-indigo-600" />
            Profili Aziendali
          </h1>
          <p className="text-gray-600 mt-1">
            Gestisci le tue aziende per la generazione automatica dei documenti.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuovo Profilo Aziendale
        </Button>
      </div>

      {/* LISTA PROFILI */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Nessun profilo aziendale presente.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className="shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    {profile.ragione_sociale || "Profilo senza nome"}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-gray-700">
                <p>
                  <strong>P.IVA:</strong> {profile.partita_iva || "—"}
                </p>
                <p>
                  <strong>C.Fiscale:</strong> {profile.codice_fiscale || "—"}
                </p>
                <p>
                  <strong>Indirizzo:</strong> {profile.indirizzo}, {profile.citta}
                </p>
                <p>
                  <strong>Rappresentante:</strong>{" "}
                  {profile.rappresentante_nome} {profile.rappresentante_cognome}
                </p>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    variant="outline"
                    onClick={() => openEditModal(profile)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Modifica
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => deleteProfile(profile.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Elimina
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL */}
      <CompanyProfileModal
        open={openModal}
        onOpenChange={setOpenModal}
        existingProfile={editingProfile}
        onSaved={handleModalSaved}
      />
    </div>
  );
}
