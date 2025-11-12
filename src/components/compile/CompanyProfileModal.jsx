
import React, { useState } from "react";
import { companyProfilesApi } from "@/api/companyProfilesApi";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";

export default function CompanyProfileModal({ onClose, onSave, existingProfile = null }) {
  const [profileData, setProfileData] = useState(existingProfile || {
    profile_name: "",
    // Dati Societari
    company_name: "",
    forma_giuridica: "",
    company_vat: "",
    company_codice_fiscale: "",
    data_costituzione: "",
    capitale_sociale: "",
    numero_rea: "",
    camera_commercio: "",
    provincia_cciaa: "",
    // Sede Legale
    company_address: "",
    sede_legale_numero_civico: "",
    sede_legale_cap: "",
    sede_legale_citta: "",
    sede_legale_provincia: "",
    sede_legale_regione: "",
    sede_legale_paese: "Italia",
    // Sede Operativa
    sede_operativa_indirizzo: "",
    sede_operativa_numero_civico: "",
    sede_operativa_cap: "",
    sede_operativa_citta: "",
    sede_operativa_provincia: "",
    sede_operativa_regione: "",
    sede_operativa_paese: "",
    // Contatti
    company_phone: "",
    company_fax: "",
    company_email: "",
    company_pec: "",
    company_website: "",
    // Rappresentante Legale
    rappresentante_nome: "",
    rappresentante_cognome: "",
    rappresentante_cf: "",
    rappresentante_data_nascita: "",
    rappresentante_luogo_nascita: "",
    rappresentante_provincia_nascita: "",
    rappresentante_carica: "",
    rappresentante_data_nomina: "",
    rappresentante_poteri: "Tutti i poteri di ordinaria e straordinaria amministrazione",
    // Titolare Effettivo e Soggetti Art. 94
    titolare_effettivo: "",
    soggetti_art_94_co_3: "",
    // Dati Bancari
    iban_aziendale: "",
    banca_aziendale: "",
    filiale_aziendale: "",
    swift_bic: "",
    intestatario_conto_aziendale: "",
    // Certificazioni ISO 9001
    iso_9001: false,
    iso_9001_numero: "",
    iso_9001_ente: "",
    iso_9001_rilascio: "",
    iso_9001_scadenza: "",
    // Certificazioni ISO 14001
    iso_14001: false,
    iso_14001_numero: "",
    iso_14001_ente: "",
    iso_14001_rilascio: "",
    iso_14001_scadenza: "",
    // Certificazioni ISO 45001
    iso_45001: false,
    iso_45001_numero: "",
    iso_45001_ente: "",
    iso_45001_rilascio: "",
    iso_45001_scadenza: "",
    // Certificazione SOA
    soa: false,
    soa_numero: "",
    soa_categorie: "",
    soa_classifiche: "",
    soa_ente: "",
    soa_rilascio: "",
    soa_scadenza: "",
    // Altre Certificazioni
    altre_certificazioni: "",
    // Dati Fiscali e ATECO
    regime_fiscale: "",
    codice_ateco_primario: "",
    codici_ateco_secondari: "",
    descrizione_attivita: "",
    posizione_inps: "",
    posizione_inail: "",
    cassa_edile: "",
    // Fatturazione Elettronica
    codice_destinatario: "",
    pec_fatturazione: "",
    regime_iva: "",
    esigibilita_iva: "Immediata",
    split_payment: false,
    // White List e Rating
    white_list_iscritto: false,
    white_list_numero: "",
    white_list_prefettura: "",
    white_list_data: "",
    casellario_anac: "",
    rating_legalita: false,
    rating_stelle: "",
    rating_data: "",
    // Regolarità Contributiva e Fiscale
    durc_regolare: false,
    pendenze_inps: false,
    pendenze_inail: false,
    procedure_concorsuali: false,
    concordato_preventivo: false,
    carichi_pendenti: false,
    protesti: false,
    // Organico e Risorse Umane
    numero_dipendenti: "",
    numero_collaboratori: "",
    contratto_collettivo: "",
    organico_medio_triennio: "",
    // Assicurazioni - RC Professionale
    rc_professionale: false,
    rc_professionale_compagnia: "",
    rc_professionale_polizza: "",
    rc_professionale_massimale: "",
    rc_professionale_scadenza: "",
    // Assicurazioni - RC Generale
    rc_generale: false,
    rc_generale_compagnia: "",
    rc_generale_polizza: "",
    rc_generale_massimale: "",
    rc_generale_scadenza: "",
    // Assicurazioni - All Risks
    all_risks: false,
    all_risks_compagnia: "",
    all_risks_polizza: "",
    all_risks_massimale: "",
    all_risks_scadenza: "",
    // Dati Economici
    fatturato_anno_corrente: "",
    fatturato_anno_precedente: "",
    fatturato_due_anni_fa: "",
    fatturato_tre_anni_fa: "",
    patrimonio_netto: "",
    capitale_circolante: "",
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        return await companyProfilesApi.update(existingProfile.id, data);
      }
      return await companyProfilesApi.create(data);
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
            {existingProfile ? "Modifica Profilo Aziendale" : "Nuovo Profilo Aziendale"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <div>
              <Label>Nome Profilo *</Label>
              <Input
                value={profileData.profile_name || ""}
                onChange={(e) => handleChange("profile_name", e.target.value)}
                placeholder="Es. Azienda Principale"
              />
              <p className="text-xs text-gray-500 mt-1">
                Un nome identificativo per questo profilo aziendale
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Societari</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Ragione Sociale</Label>
                  <Input
                    value={profileData.company_name || ""}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    placeholder="Nome Azienda S.r.l."
                  />
                </div>
                <div>
                  <Label>Forma Giuridica</Label>
                  <Select
                    value={profileData.forma_giuridica || ""}
                    onValueChange={(value) => handleChange("forma_giuridica", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S.r.l.">S.r.l.</SelectItem>
                      <SelectItem value="S.p.A.">S.p.A.</SelectItem>
                      <SelectItem value="S.a.s.">S.a.s.</SelectItem>
                      <SelectItem value="S.n.c.">S.n.c.</SelectItem>
                      <SelectItem value="Ditta Individuale">Ditta Individuale</SelectItem>
                      <SelectItem value="Società Cooperativa">Società Cooperativa</SelectItem>
                      <SelectItem value="Altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Partita IVA</Label>
                  <Input
                    value={profileData.company_vat || ""}
                    onChange={(e) => handleChange("company_vat", e.target.value)}
                    placeholder="IT..."
                  />
                </div>
                <div>
                  <Label>Codice Fiscale</Label>
                  <Input
                    value={profileData.company_codice_fiscale || ""}
                    onChange={(e) => handleChange("company_codice_fiscale", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data Costituzione</Label>
                  <Input
                    type="date"
                    value={profileData.data_costituzione || ""}
                    onChange={(e) => handleChange("data_costituzione", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Capitale Sociale</Label>
                  <Input
                    value={profileData.capitale_sociale || ""}
                    onChange={(e) => handleChange("capitale_sociale", e.target.value)}
                    placeholder="Es. 10.000,00 €"
                  />
                </div>
                <div>
                  <Label>Numero REA</Label>
                  <Input
                    value={profileData.numero_rea || ""}
                    onChange={(e) => handleChange("numero_rea", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Camera di Commercio</Label>
                  <Input
                    value={profileData.camera_commercio || ""}
                    onChange={(e) => handleChange("camera_commercio", e.target.value)}
                    placeholder="Es. Roma"
                  />
                </div>
                <div>
                  <Label>Provincia CCIAA</Label>
                  <Input
                    value={profileData.provincia_cciaa || ""}
                    onChange={(e) => handleChange("provincia_cciaa", e.target.value)}
                    placeholder="RM"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Sede Legale</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Indirizzo</Label>
                  <Input
                    value={profileData.company_address || ""}
                    onChange={(e) => handleChange("company_address", e.target.value)}
                    placeholder="Via/Piazza"
                  />
                </div>
                <div>
                  <Label>Numero Civico</Label>
                  <Input
                    value={profileData.sede_legale_numero_civico || ""}
                    onChange={(e) => handleChange("sede_legale_numero_civico", e.target.value)}
                  />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input
                    value={profileData.sede_legale_cap || ""}
                    onChange={(e) => handleChange("sede_legale_cap", e.target.value)}
                    placeholder="00100"
                  />
                </div>
                <div>
                  <Label>Città</Label>
                  <Input
                    value={profileData.sede_legale_citta || ""}
                    onChange={(e) => handleChange("sede_legale_citta", e.target.value)}
                    placeholder="Roma"
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    value={profileData.sede_legale_provincia || ""}
                    onChange={(e) => handleChange("sede_legale_provincia", e.target.value)}
                    placeholder="RM"
                  />
                </div>
                <div>
                  <Label>Regione</Label>
                  <Input
                    value={profileData.sede_legale_regione || ""}
                    onChange={(e) => handleChange("sede_legale_regione", e.target.value)}
                    placeholder="Lazio"
                  />
                </div>
                <div>
                  <Label>Paese</Label>
                  <Input
                    value={profileData.sede_legale_paese || "Italia"}
                    onChange={(e) => handleChange("sede_legale_paese", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Sede Operativa (se diversa)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Indirizzo</Label>
                  <Input
                    value={profileData.sede_operativa_indirizzo || ""}
                    onChange={(e) => handleChange("sede_operativa_indirizzo", e.target.value)}
                    placeholder="Via/Piazza"
                  />
                </div>
                <div>
                  <Label>Numero Civico</Label>
                  <Input
                    value={profileData.sede_operativa_numero_civico || ""}
                    onChange={(e) => handleChange("sede_operativa_numero_civico", e.target.value)}
                  />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input
                    value={profileData.sede_operativa_cap || ""}
                    onChange={(e) => handleChange("sede_operativa_cap", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Città</Label>
                  <Input
                    value={profileData.sede_operativa_citta || ""}
                    onChange={(e) => handleChange("sede_operativa_citta", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    value={profileData.sede_operativa_provincia || ""}
                    onChange={(e) => handleChange("sede_operativa_provincia", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Regione</Label>
                  <Input
                    value={profileData.sede_operativa_regione || ""}
                    onChange={(e) => handleChange("sede_operativa_regione", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Paese</Label>
                  <Input
                    value={profileData.sede_operativa_paese || ""}
                    onChange={(e) => handleChange("sede_operativa_paese", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Contatti</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Telefono</Label>
                  <Input
                    value={profileData.company_phone || ""}
                    onChange={(e) => handleChange("company_phone", e.target.value)}
                    placeholder="+39 ..."
                  />
                </div>
                <div>
                  <Label>Fax</Label>
                  <Input
                    value={profileData.company_fax || ""}
                    onChange={(e) => handleChange("company_fax", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={profileData.company_email || ""}
                    onChange={(e) => handleChange("company_email", e.target.value)}
                    placeholder="info@azienda.it"
                  />
                </div>
                <div>
                  <Label>PEC</Label>
                  <Input
                    value={profileData.company_pec || ""}
                    onChange={(e) => handleChange("company_pec", e.target.value)}
                    placeholder="azienda@pec.it"
                  />
                </div>
                <div>
                  <Label>Sito Web</Label>
                  <Input
                    value={profileData.company_website || ""}
                    onChange={(e) => handleChange("company_website", e.target.value)}
                    placeholder="www.azienda.it"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Rappresentante Legale</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={profileData.rappresentante_nome || ""}
                    onChange={(e) => handleChange("rappresentante_nome", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cognome</Label>
                  <Input
                    value={profileData.rappresentante_cognome || ""}
                    onChange={(e) => handleChange("rappresentante_cognome", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Codice Fiscale</Label>
                  <Input
                    value={profileData.rappresentante_cf || ""}
                    onChange={(e) => handleChange("rappresentante_cf", e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label>Data di Nascita</Label>
                  <Input
                    type="date"
                    value={profileData.rappresentante_data_nascita || ""}
                    onChange={(e) => handleChange("rappresentante_data_nascita", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Luogo di Nascita</Label>
                  <Input
                    value={profileData.rappresentante_luogo_nascita || ""}
                    onChange={(e) => handleChange("rappresentante_luogo_nascita", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Provincia di Nascita</Label>
                  <Input
                    value={profileData.rappresentante_provincia_nascita || ""}
                    onChange={(e) => handleChange("rappresentante_provincia_nascita", e.target.value)}
                    placeholder="RM"
                  />
                </div>
                <div>
                  <Label>Carica</Label>
                  <Input
                    value={profileData.rappresentante_carica || ""}
                    onChange={(e) => handleChange("rappresentante_carica", e.target.value)}
                    placeholder="Amministratore Unico"
                  />
                </div>
                <div>
                  <Label>Data Nomina</Label>
                  <Input
                    type="date"
                    value={profileData.rappresentante_data_nomina || ""}
                    onChange={(e) => handleChange("rappresentante_data_nomina", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Poteri</Label>
                  <Input
                    value={profileData.rappresentante_poteri || "Tutti i poteri di ordinaria e straordinaria amministrazione"}
                    onChange={(e) => handleChange("rappresentante_poteri", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Titolare Effettivo e Soggetti Art. 94</h3>
              <div className="space-y-4">
                <div>
                  <Label>Titolare Effettivo</Label>
                  <Input
                    value={profileData.titolare_effettivo || ""}
                    onChange={(e) => handleChange("titolare_effettivo", e.target.value)}
                    placeholder="Nome e Cognome del Titolare Effettivo"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Persona fisica che possiede o controlla l'ente
                  </p>
                </div>
                <div>
                  <Label>Soggetti Art. 94 co. 3 D.Lgs. 36/2023</Label>
                  <Textarea
                    value={profileData.soggetti_art_94_co_3 || ""}
                    onChange={(e) => handleChange("soggetti_art_94_co_3", e.target.value)}
                    placeholder="Elenco dei soggetti cessati dalla carica nell'anno antecedente la data di pubblicazione del bando di gara (amministratori, direttori tecnici, soci, procuratori, ecc.)"
                    className="min-h-24"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Indicare nome, cognome, data di nascita e carica ricoperti
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Bancari</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={profileData.iban_aziendale || ""}
                    onChange={(e) => handleChange("iban_aziendale", e.target.value.toUpperCase())}
                    placeholder="IT..."
                  />
                </div>
                <div>
                  <Label>Banca</Label>
                  <Input
                    value={profileData.banca_aziendale || ""}
                    onChange={(e) => handleChange("banca_aziendale", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Filiale</Label>
                  <Input
                    value={profileData.filiale_aziendale || ""}
                    onChange={(e) => handleChange("filiale_aziendale", e.target.value)}
                  />
                </div>
                <div>
                  <Label>SWIFT/BIC</Label>
                  <Input
                    value={profileData.swift_bic || ""}
                    onChange={(e) => handleChange("swift_bic", e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label>Intestatario Conto</Label>
                  <Input
                    value={profileData.intestatario_conto_aziendale || ""}
                    onChange={(e) => handleChange("intestatario_conto_aziendale", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Certificazioni ISO 9001</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="iso_9001"
                  checked={profileData.iso_9001 || false}
                  onCheckedChange={(checked) => handleChange("iso_9001", checked)}
                />
                <Label htmlFor="iso_9001" className="cursor-pointer">Certificazione ISO 9001</Label>
              </div>
              {profileData.iso_9001 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Numero Certificato</Label>
                    <Input
                      value={profileData.iso_9001_numero || ""}
                      onChange={(e) => handleChange("iso_9001_numero", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ente Certificatore</Label>
                    <Input
                      value={profileData.iso_9001_ente || ""}
                      onChange={(e) => handleChange("iso_9001_ente", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Rilascio</Label>
                    <Input
                      type="date"
                      value={profileData.iso_9001_rilascio || ""}
                      onChange={(e) => handleChange("iso_9001_rilascio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.iso_9001_scadenza || ""}
                      onChange={(e) => handleChange("iso_9001_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Certificazioni ISO 14001</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="iso_14001"
                  checked={profileData.iso_14001 || false}
                  onCheckedChange={(checked) => handleChange("iso_14001", checked)}
                />
                <Label htmlFor="iso_14001" className="cursor-pointer">Certificazione ISO 14001</Label>
              </div>
              {profileData.iso_14001 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Numero Certificato</Label>
                    <Input
                      value={profileData.iso_14001_numero || ""}
                      onChange={(e) => handleChange("iso_14001_numero", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ente Certificatore</Label>
                    <Input
                      value={profileData.iso_14001_ente || ""}
                      onChange={(e) => handleChange("iso_14001_ente", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Rilascio</Label>
                    <Input
                      type="date"
                      value={profileData.iso_14001_rilascio || ""}
                      onChange={(e) => handleChange("iso_14001_rilascio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.iso_14001_scadenza || ""}
                      onChange={(e) => handleChange("iso_14001_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Certificazioni ISO 45001</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="iso_45001"
                  checked={profileData.iso_45001 || false}
                  onCheckedChange={(checked) => handleChange("iso_45001", checked)}
                />
                <Label htmlFor="iso_45001" className="cursor-pointer">Certificazione ISO 45001</Label>
              </div>
              {profileData.iso_45001 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Numero Certificato</Label>
                    <Input
                      value={profileData.iso_45001_numero || ""}
                      onChange={(e) => handleChange("iso_45001_numero", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Ente Certificatore</Label>
                    <Input
                      value={profileData.iso_45001_ente || ""}
                      onChange={(e) => handleChange("iso_45001_ente", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Rilascio</Label>
                    <Input
                      type="date"
                      value={profileData.iso_45001_rilascio || ""}
                      onChange={(e) => handleChange("iso_45001_rilascio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.iso_45001_scadenza || ""}
                      onChange={(e) => handleChange("iso_45001_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Certificazione SOA</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="soa"
                  checked={profileData.soa || false}
                  onCheckedChange={(checked) => handleChange("soa", checked)}
                />
                <Label htmlFor="soa" className="cursor-pointer">Certificazione SOA</Label>
              </div>
              {profileData.soa && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Numero Certificato</Label>
                    <Input
                      value={profileData.soa_numero || ""}
                      onChange={(e) => handleChange("soa_numero", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Categorie SOA</Label>
                    <Input
                      value={profileData.soa_categorie || ""}
                      onChange={(e) => handleChange("soa_categorie", e.target.value)}
                      placeholder="Es. OG1, OG3"
                    />
                  </div>
                  <div>
                    <Label>Classifiche SOA</Label>
                    <Input
                      value={profileData.soa_classifiche || ""}
                      onChange={(e) => handleChange("soa_classifiche", e.target.value)}
                      placeholder="Es. I, II, III"
                    />
                  </div>
                  <div>
                    <Label>Ente Certificatore</Label>
                    <Input
                      value={profileData.soa_ente || ""}
                      onChange={(e) => handleChange("soa_ente", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Rilascio</Label>
                    <Input
                      type="date"
                      value={profileData.soa_rilascio || ""}
                      onChange={(e) => handleChange("soa_rilascio", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.soa_scadenza || ""}
                      onChange={(e) => handleChange("soa_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Altre Certificazioni</h3>
              <Textarea
                value={profileData.altre_certificazioni || ""}
                onChange={(e) => handleChange("altre_certificazioni", e.target.value)}
                placeholder="Descrivi altre certificazioni possedute"
                className="min-h-20"
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Fiscali e ATECO</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Regime Fiscale</Label>
                  <Input
                    value={profileData.regime_fiscale || ""}
                    onChange={(e) => handleChange("regime_fiscale", e.target.value)}
                    placeholder="Es. Ordinario"
                  />
                </div>
                <div>
                  <Label>Codice ATECO Primario</Label>
                  <Input
                    value={profileData.codice_ateco_primario || ""}
                    onChange={(e) => handleChange("codice_ateco_primario", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Codici ATECO Secondari</Label>
                  <Input
                    value={profileData.codici_ateco_secondari || ""}
                    onChange={(e) => handleChange("codici_ateco_secondari", e.target.value)}
                    placeholder="Separati da virgola"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Descrizione Attività</Label>
                  <Textarea
                    value={profileData.descrizione_attivita || ""}
                    onChange={(e) => handleChange("descrizione_attivita", e.target.value)}
                    className="min-h-20"
                  />
                </div>
                <div>
                  <Label>Posizione INPS</Label>
                  <Input
                    value={profileData.posizione_inps || ""}
                    onChange={(e) => handleChange("posizione_inps", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Posizione INAIL</Label>
                  <Input
                    value={profileData.posizione_inail || ""}
                    onChange={(e) => handleChange("posizione_inail", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cassa Edile</Label>
                  <Input
                    value={profileData.cassa_edile || ""}
                    onChange={(e) => handleChange("cassa_edile", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Fatturazione Elettronica</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Codice Destinatario</Label>
                  <Input
                    value={profileData.codice_destinatario || ""}
                    onChange={(e) => handleChange("codice_destinatario", e.target.value.toUpperCase())}
                    placeholder="7 caratteri"
                  />
                </div>
                <div>
                  <Label>PEC Fatturazione</Label>
                  <Input
                    value={profileData.pec_fatturazione || ""}
                    onChange={(e) => handleChange("pec_fatturazione", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Regime IVA</Label>
                  <Input
                    value={profileData.regime_iva || ""}
                    onChange={(e) => handleChange("regime_iva", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Esigibilità IVA</Label>
                  <Input
                    value={profileData.esigibilita_iva || "Immediata"}
                    onChange={(e) => handleChange("esigibilita_iva", e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="split_payment"
                    checked={profileData.split_payment || false}
                    onCheckedChange={(checked) => handleChange("split_payment", checked)}
                  />
                  <Label htmlFor="split_payment" className="cursor-pointer">Split Payment</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">White List e Rating</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="white_list"
                    checked={profileData.white_list_iscritto || false}
                    onCheckedChange={(checked) => handleChange("white_list_iscritto", checked)}
                  />
                  <Label htmlFor="white_list" className="cursor-pointer">Iscritto White List</Label>
                </div>
                {profileData.white_list_iscritto && (
                  <>
                    <div>
                      <Label>Numero Iscrizione</Label>
                      <Input
                        value={profileData.white_list_numero || ""}
                        onChange={(e) => handleChange("white_list_numero", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Prefettura</Label>
                      <Input
                        value={profileData.white_list_prefettura || ""}
                        onChange={(e) => handleChange("white_list_prefettura", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data Iscrizione</Label>
                      <Input
                        type="date"
                        value={profileData.white_list_data || ""}
                        onChange={(e) => handleChange("white_list_data", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label>Casellario ANAC</Label>
                  <Input
                    value={profileData.casellario_anac || ""}
                    onChange={(e) => handleChange("casellario_anac", e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rating_legalita"
                    checked={profileData.rating_legalita || false}
                    onCheckedChange={(checked) => handleChange("rating_legalita", checked)}
                  />
                  <Label htmlFor="rating_legalita" className="cursor-pointer">Rating di Legalità</Label>
                </div>
                {profileData.rating_legalita && (
                  <>
                    <div>
                      <Label>Numero Stelle</Label>
                      <Input
                        type="number"
                        min="1"
                        max="3"
                        value={profileData.rating_stelle || ""}
                        onChange={(e) => handleChange("rating_stelle", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data Rilascio</Label>
                      <Input
                        type="date"
                        value={profileData.rating_data || ""}
                        onChange={(e) => handleChange("rating_data", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Regolarità Contributiva e Fiscale</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="durc_regolare"
                    checked={profileData.durc_regolare !== false}
                    onCheckedChange={(checked) => handleChange("durc_regolare", checked)}
                  />
                  <Label htmlFor="durc_regolare" className="cursor-pointer">DURC Regolare</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pendenze_inps"
                    checked={profileData.pendenze_inps || false}
                    onCheckedChange={(checked) => handleChange("pendenze_inps", checked)}
                  />
                  <Label htmlFor="pendenze_inps" className="cursor-pointer">Pendenze INPS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pendenze_inail"
                    checked={profileData.pendenze_inail || false}
                    onCheckedChange={(checked) => handleChange("pendenze_inail", checked)}
                  />
                  <Label htmlFor="pendenze_inail" className="cursor-pointer">Pendenze INAIL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="procedure_concorsuali"
                    checked={profileData.procedure_concorsuali || false}
                    onCheckedChange={(checked) => handleChange("procedure_concorsuali", checked)}
                  />
                  <Label htmlFor="procedure_concorsuali" className="cursor-pointer">Procedure Concorsuali</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concordato_preventivo"
                    checked={profileData.concordato_preventivo || false}
                    onCheckedChange={(checked) => handleChange("concordato_preventivo", checked)}
                  />
                  <Label htmlFor="concordato_preventivo" className="cursor-pointer">Concordato Preventivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="carichi_pendenti"
                    checked={profileData.carichi_pendenti || false}
                    onCheckedChange={(checked) => handleChange("carichi_pendenti", checked)}
                  />
                  <Label htmlFor="carichi_pendenti" className="cursor-pointer">Carichi Pendenti</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="protesti"
                    checked={profileData.protesti || false}
                    onCheckedChange={(checked) => handleChange("protesti", checked)}
                  />
                  <Label htmlFor="protesti" className="cursor-pointer">Protesti</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Organico e Risorse Umane</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Numero Dipendenti</Label>
                  <Input
                    type="number"
                    value={profileData.numero_dipendenti || ""}
                    onChange={(e) => handleChange("numero_dipendenti", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Numero Collaboratori</Label>
                  <Input
                    type="number"
                    value={profileData.numero_collaboratori || ""}
                    onChange={(e) => handleChange("numero_collaboratori", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Contratto Collettivo Applicato</Label>
                  <Input
                    value={profileData.contratto_collettivo || ""}
                    onChange={(e) => handleChange("contratto_collettivo", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Organico Medio Triennio</Label>
                  <Input
                    type="number"
                    value={profileData.organico_medio_triennio || ""}
                    onChange={(e) => handleChange("organico_medio_triennio", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Assicurazioni - RC Professionale</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="rc_professionale"
                  checked={profileData.rc_professionale || false}
                  onCheckedChange={(checked) => handleChange("rc_professionale", checked)}
                />
                <Label htmlFor="rc_professionale" className="cursor-pointer">RC Professionale</Label>
              </div>
              {profileData.rc_professionale && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Compagnia</Label>
                    <Input
                      value={profileData.rc_professionale_compagnia || ""}
                      onChange={(e) => handleChange("rc_professionale_compagnia", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Numero Polizza</Label>
                    <Input
                      value={profileData.rc_professionale_polizza || ""}
                      onChange={(e) => handleChange("rc_professionale_polizza", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Massimale</Label>
                    <Input
                      value={profileData.rc_professionale_massimale || ""}
                      onChange={(e) => handleChange("rc_professionale_massimale", e.target.value)}
                      placeholder="Es. 1.000.000 €"
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.rc_professionale_scadenza || ""}
                      onChange={(e) => handleChange("rc_professionale_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Assicurazioni - RC Generale</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="rc_generale"
                  checked={profileData.rc_generale || false}
                  onCheckedChange={(checked) => handleChange("rc_generale", checked)}
                />
                <Label htmlFor="rc_generale" className="cursor-pointer">RC Generale</Label>
              </div>
              {profileData.rc_generale && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Compagnia</Label>
                    <Input
                      value={profileData.rc_generale_compagnia || ""}
                      onChange={(e) => handleChange("rc_generale_compagnia", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Numero Polizza</Label>
                    <Input
                      value={profileData.rc_generale_polizza || ""}
                      onChange={(e) => handleChange("rc_generale_polizza", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Massimale</Label>
                    <Input
                      value={profileData.rc_generale_massimale || ""}
                      onChange={(e) => handleChange("rc_generale_massimale", e.target.value)}
                      placeholder="Es. 2.000.000 €"
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.rc_generale_scadenza || ""}
                      onChange={(e) => handleChange("rc_generale_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Assicurazioni - All Risks</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="all_risks"
                  checked={profileData.all_risks || false}
                  onCheckedChange={(checked) => handleChange("all_risks", checked)}
                />
                <Label htmlFor="all_risks" className="cursor-pointer">All Risks</Label>
              </div>
              {profileData.all_risks && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Compagnia</Label>
                    <Input
                      value={profileData.all_risks_compagnia || ""}
                      onChange={(e) => handleChange("all_risks_compagnia", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Numero Polizza</Label>
                    <Input
                      value={profileData.all_risks_polizza || ""}
                      onChange={(e) => handleChange("all_risks_polizza", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Massimale</Label>
                    <Input
                      value={profileData.all_risks_massimale || ""}
                      onChange={(e) => handleChange("all_risks_massimale", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Scadenza</Label>
                    <Input
                      type="date"
                      value={profileData.all_risks_scadenza || ""}
                      onChange={(e) => handleChange("all_risks_scadenza", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Economici</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Fatturato Anno Corrente</Label>
                  <Input
                    value={profileData.fatturato_anno_corrente || ""}
                    onChange={(e) => handleChange("fatturato_anno_corrente", e.target.value)}
                    placeholder="Es. 500.000 €"
                  />
                </div>
                <div>
                  <Label>Fatturato Anno Precedente</Label>
                  <Input
                    value={profileData.fatturato_anno_precedente || ""}
                    onChange={(e) => handleChange("fatturato_anno_precedente", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fatturato Due Anni Fa</Label>
                  <Input
                    value={profileData.fatturato_due_anni_fa || ""}
                    onChange={(e) => handleChange("fatturato_due_anni_fa", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fatturato Tre Anni Fa</Label>
                  <Input
                    value={profileData.fatturato_tre_anni_fa || ""}
                    onChange={(e) => handleChange("fatturato_tre_anni_fa", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Patrimonio Netto</Label>
                  <Input
                    value={profileData.patrimonio_netto || ""}
                    onChange={(e) => handleChange("patrimonio_netto", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Capitale Circolante</Label>
                  <Input
                    value={profileData.capitale_circolante || ""}
                    onChange={(e) => handleChange("capitale_circolante", e.target.value)}
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
