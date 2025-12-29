import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Loader2 } from "lucide-react";

export default function PersonalProfileModal({ onClose, onSave, existingProfile = null }) {
  const [profileData, setProfileData] = useState(existingProfile || {
    profile_name: "",
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (existingProfile) {
        const { data: updated, error } = await supabase
          .from('user_profiles')
          .update(data)
          .eq('id', existingProfile.id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('user_profiles')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      onSave();
    },
  });

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveProfileMutation.mutate(profileData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {existingProfile ? "Modifica Profilo Personale" : "Nuovo Profilo Personale"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <div>
              <Label>Nome Profilo *</Label>
              <Input
                value={profileData.profile_name || ""}
                onChange={(e) => handleChange("profile_name", e.target.value)}
                placeholder="Es. Mio Profilo, Profilo Familiare"
              />
              <p className="text-xs text-gray-500 mt-1">
                Un nome identificativo per questo profilo personale
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Anagrafici</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={profileData.nome || ""}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Nome"
                  />
                </div>
                <div>
                  <Label>Cognome</Label>
                  <Input
                    value={profileData.cognome || ""}
                    onChange={(e) => handleChange("cognome", e.target.value)}
                    placeholder="Cognome"
                  />
                </div>
                <div>
                  <Label>Data di Nascita</Label>
                  <Input
                    type="date"
                    value={profileData.data_nascita || ""}
                    onChange={(e) => handleChange("data_nascita", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Luogo di Nascita</Label>
                  <Input
                    value={profileData.luogo_nascita || ""}
                    onChange={(e) => handleChange("luogo_nascita", e.target.value)}
                    placeholder="Città"
                  />
                </div>
                <div>
                  <Label>Provincia di Nascita</Label>
                  <Input
                    value={profileData.provincia_nascita || ""}
                    onChange={(e) => handleChange("provincia_nascita", e.target.value)}
                    placeholder="PR"
                  />
                </div>
                <div>
                  <Label>Codice Fiscale</Label>
                  <Input
                    value={profileData.codice_fiscale || ""}
                    onChange={(e) => handleChange("codice_fiscale", e.target.value.toUpperCase())}
                    placeholder="RSSMRA80A01H501Z"
                  />
                </div>
                <div>
                  <Label>Sesso</Label>
                  <Select
                    value={profileData.sesso || ""}
                    onValueChange={(value) => handleChange("sesso", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschile</SelectItem>
                      <SelectItem value="F">Femminile</SelectItem>
                      <SelectItem value="Altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cittadinanza</Label>
                  <Input
                    value={profileData.cittadinanza || ""}
                    onChange={(e) => handleChange("cittadinanza", e.target.value)}
                    placeholder="Italiana"
                  />
                </div>
                <div>
                  <Label>Stato Civile</Label>
                  <Select
                    value={profileData.stato_civile || ""}
                    onValueChange={(value) => handleChange("stato_civile", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Celibe/Nubile">Celibe/Nubile</SelectItem>
                      <SelectItem value="Coniugato/a">Coniugato/a</SelectItem>
                      <SelectItem value="Divorziato/a">Divorziato/a</SelectItem>
                      <SelectItem value="Vedovo/a">Vedovo/a</SelectItem>
                      <SelectItem value="Separato/a">Separato/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Regime Patrimoniale</Label>
                  <Select
                    value={profileData.regime_patrimoniale || ""}
                    onValueChange={(value) => handleChange("regime_patrimoniale", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comunione dei beni">Comunione dei beni</SelectItem>
                      <SelectItem value="Separazione dei beni">Separazione dei beni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Residenza</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Indirizzo</Label>
                  <Input
                    value={profileData.residenza_indirizzo || ""}
                    onChange={(e) => handleChange("residenza_indirizzo", e.target.value)}
                    placeholder="Via/Piazza"
                  />
                </div>
                <div>
                  <Label>Numero Civico</Label>
                  <Input
                    value={profileData.residenza_numero_civico || ""}
                    onChange={(e) => handleChange("residenza_numero_civico", e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input
                    value={profileData.residenza_cap || ""}
                    onChange={(e) => handleChange("residenza_cap", e.target.value)}
                    placeholder="00100"
                  />
                </div>
                <div>
                  <Label>Città</Label>
                  <Input
                    value={profileData.residenza_citta || ""}
                    onChange={(e) => handleChange("residenza_citta", e.target.value)}
                    placeholder="Roma"
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    value={profileData.residenza_provincia || ""}
                    onChange={(e) => handleChange("residenza_provincia", e.target.value)}
                    placeholder="RM"
                  />
                </div>
                <div>
                  <Label>Regione</Label>
                  <Input
                    value={profileData.residenza_regione || ""}
                    onChange={(e) => handleChange("residenza_regione", e.target.value)}
                    placeholder="Lazio"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Domicilio</h3>
              <p className="text-sm text-gray-600 mb-4">Compila solo se diverso dalla residenza</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Indirizzo</Label>
                  <Input
                    value={profileData.domicilio_indirizzo || ""}
                    onChange={(e) => handleChange("domicilio_indirizzo", e.target.value)}
                    placeholder="Via/Piazza"
                  />
                </div>
                <div>
                  <Label>Numero Civico</Label>
                  <Input
                    value={profileData.domicilio_numero_civico || ""}
                    onChange={(e) => handleChange("domicilio_numero_civico", e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input
                    value={profileData.domicilio_cap || ""}
                    onChange={(e) => handleChange("domicilio_cap", e.target.value)}
                    placeholder="00100"
                  />
                </div>
                <div>
                  <Label>Città</Label>
                  <Input
                    value={profileData.domicilio_citta || ""}
                    onChange={(e) => handleChange("domicilio_citta", e.target.value)}
                    placeholder="Milano"
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    value={profileData.domicilio_provincia || ""}
                    onChange={(e) => handleChange("domicilio_provincia", e.target.value)}
                    placeholder="MI"
                  />
                </div>
                <div>
                  <Label>Regione</Label>
                  <Input
                    value={profileData.domicilio_regione || ""}
                    onChange={(e) => handleChange("domicilio_regione", e.target.value)}
                    placeholder="Lombardia"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Contatti</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={profileData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@esempio.it"
                  />
                </div>
                <div>
                  <Label>Cellulare</Label>
                  <Input
                    value={profileData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+39 ..."
                  />
                </div>
                <div>
                  <Label>Telefono Fisso</Label>
                  <Input
                    value={profileData.telefono_fisso || ""}
                    onChange={(e) => handleChange("telefono_fisso", e.target.value)}
                    placeholder="+39 ..."
                  />
                </div>
                <div>
                  <Label>PEC</Label>
                  <Input
                    value={profileData.pec || ""}
                    onChange={(e) => handleChange("pec", e.target.value)}
                    placeholder="nome@pec.it"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Documento d'Identità</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo Documento</Label>
                  <Select
                    value={profileData.tipo_documento || ""}
                    onValueChange={(value) => handleChange("tipo_documento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carta d'Identità">Carta d'Identità</SelectItem>
                      <SelectItem value="Patente">Patente</SelectItem>
                      <SelectItem value="Passaporto">Passaporto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Numero Documento</Label>
                  <Input
                    value={profileData.numero_documento || ""}
                    onChange={(e) => handleChange("numero_documento", e.target.value)}
                    placeholder="Numero"
                  />
                </div>
                <div>
                  <Label>Rilasciato da</Label>
                  <Input
                    value={profileData.rilasciato_da || ""}
                    onChange={(e) => handleChange("rilasciato_da", e.target.value)}
                    placeholder="Es. Comune di Roma"
                  />
                </div>
                <div>
                  <Label>Luogo di Rilascio</Label>
                  <Input
                    value={profileData.luogo_rilascio || ""}
                    onChange={(e) => handleChange("luogo_rilascio", e.target.value)}
                    placeholder="Città"
                  />
                </div>
                <div>
                  <Label>Data di Rilascio</Label>
                  <Input
                    type="date"
                    value={profileData.data_rilascio || ""}
                    onChange={(e) => handleChange("data_rilascio", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data di Scadenza</Label>
                  <Input
                    type="date"
                    value={profileData.data_scadenza_documento || ""}
                    onChange={(e) => handleChange("data_scadenza_documento", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Bancari Personali</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={profileData.iban_personale || ""}
                    onChange={(e) => handleChange("iban_personale", e.target.value.toUpperCase())}
                    placeholder="IT..."
                  />
                </div>
                <div>
                  <Label>Banca</Label>
                  <Input
                    value={profileData.banca_personale || ""}
                    onChange={(e) => handleChange("banca_personale", e.target.value)}
                    placeholder="Nome banca"
                  />
                </div>
                <div>
                  <Label>Filiale</Label>
                  <Input
                    value={profileData.filiale_personale || ""}
                    onChange={(e) => handleChange("filiale_personale", e.target.value)}
                    placeholder="Nome filiale"
                  />
                </div>
                <div>
                  <Label>Intestatario</Label>
                  <Input
                    value={profileData.intestatario_conto || ""}
                    onChange={(e) => handleChange("intestatario_conto", e.target.value)}
                    placeholder="Nome e cognome"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Professionali</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Qualifica Professionale</Label>
                  <Input
                    value={profileData.qualifica_professionale || ""}
                    onChange={(e) => handleChange("qualifica_professionale", e.target.value)}
                    placeholder="Es. Avvocato, Ingegnere"
                  />
                </div>
                <div>
                  <Label>Ordine Professionale</Label>
                  <Input
                    value={profileData.ordine_professionale || ""}
                    onChange={(e) => handleChange("ordine_professionale", e.target.value)}
                    placeholder="Es. Ordine degli Avvocati"
                  />
                </div>
                <div>
                  <Label>Numero Iscrizione</Label>
                  <Input
                    value={profileData.numero_iscrizione_ordine || ""}
                    onChange={(e) => handleChange("numero_iscrizione_ordine", e.target.value)}
                    placeholder="Numero"
                  />
                </div>
                <div>
                  <Label>Data Iscrizione</Label>
                  <Input
                    type="date"
                    value={profileData.data_iscrizione_ordine || ""}
                    onChange={(e) => handleChange("data_iscrizione_ordine", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Provincia Ordine</Label>
                  <Input
                    value={profileData.provincia_ordine || ""}
                    onChange={(e) => handleChange("provincia_ordine", e.target.value)}
                    placeholder="RM"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveProfileMutation.isPending || !profileData.profile_name}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
          >
            {saveProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salva Profilo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}