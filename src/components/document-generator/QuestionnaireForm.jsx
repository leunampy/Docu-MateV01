
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { callAI } from "@/lib/ai";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Home, Loader2, CheckCircle } from "lucide-react";

const QUESTIONS_BY_TYPE = {
  contratto_affitto: [
    // Sezione 1: Dati del Locatore (proprietario)
    { id: "landlord_name", label: "Nome o Ragione Sociale del Locatore (Proprietario)", type: "text", required: true, section: "Dati del Locatore (Proprietario)" },
    { id: "landlord_fiscal_code", label: "Codice Fiscale o Partita IVA del Locatore", type: "text", required: true },
    { id: "landlord_address", label: "Indirizzo di Residenza o Sede Legale del Locatore", type: "text", required: true },
    { id: "landlord_email", label: "Email o PEC del Locatore", type: "text", required: true },
    { id: "landlord_phone", label: "Numero di Telefono del Locatore", type: "text", required: false },
    { id: "landlord_representative", label: "Legale Rappresentante (se società)", type: "text", required: false },
    
    // Sezione 2: Dati del Conduttore (inquilino)
    { id: "tenant_name", label: "Nome o Ragione Sociale del Conduttore (Inquilino)", type: "text", required: true, section: "Dati del Conduttore (Inquilino)" },
    { id: "tenant_fiscal_code", label: "Codice Fiscale o Partita IVA del Conduttore", type: "text", required: true },
    { id: "tenant_address", label: "Indirizzo di Residenza o Sede Legale del Conduttore", type: "text", required: true },
    { id: "tenant_email", label: "Email o PEC del Conduttore", type: "text", required: true },
    { id: "tenant_phone", label: "Numero di Telefono del Conduttore", type: "text", required: false },
    { id: "tenant_representative", label: "Legale Rappresentante o Firmatario (se società)", type: "text", required: false },
    
    // Sezione 3: Dati dell'Immobile
    { id: "property_address", label: "Indirizzo Completo dell'Immobile (via, numero, CAP, città, provincia)", type: "text", required: true, section: "Dati dell'Immobile" },
    { id: "property_type", label: "Tipologia dell'Immobile", type: "select", required: true, options: [
      { value: "appartamento", label: "Appartamento" },
      { value: "ufficio", label: "Ufficio" },
      { value: "locale_commerciale", label: "Locale Commerciale" },
      { value: "box_garage", label: "Box / Garage" },
      { value: "magazzino", label: "Magazzino" },
      { value: "altro", label: "Altro" }
    ]},
    { id: "property_size", label: "Superficie in Metri Quadrati", type: "number", required: false },
    { id: "property_furnished", label: "L'Immobile è Ammobiliato?", type: "select", required: true, options: [
      { value: "completo", label: "Sì, Completamente Ammobiliato" },
      { value: "parziale", label: "Parzialmente Ammobiliato" },
      { value: "no", label: "No, Non Ammobiliato" }
    ]},
    { id: "property_description", label: "Descrizione Caratteristiche Principali (piano, vani, pertinenze, condizioni)", type: "textarea", required: false },
    
    // Sezione 4: Durata del Contratto
    { id: "start_date", label: "Data di Inizio della Locazione", type: "date", required: true, section: "Durata del Contratto" },
    { id: "end_date_or_duration", label: "Data di Fine o Durata Complessiva (es. 4 anni, 6 mesi)", type: "text", required: true },
    { id: "auto_renewal", label: "Rinnovo Automatico alla Scadenza?", type: "select", required: false, options: [
      { value: "si", label: "Sì, Rinnovo Automatico alle Stesse Condizioni" },
      { value: "no", label: "No, Cessazione Automatica" }
    ]},
    { id: "early_termination", label: "Clausola di Recesso Anticipato?", type: "select", required: false, options: [
      { value: "3mesi", label: "Sì, con Preavviso di 3 Mesi" },
      { value: "6mesi", label: "Sì, con Preavviso di 6 Mesi" },
      { value: "no", label: "No, Non Previsto" }
    ]},
    
    // Sezione 5: Canone di Locazione e Pagamenti
    { id: "monthly_rent", label: "Importo del Canone Mensile (€)", type: "number", required: true, section: "Canone di Locazione e Pagamenti" },
    { id: "currency", label: "Valuta", type: "select", required: true, options: [
      { value: "EUR", label: "EUR - Euro" },
      { value: "USD", label: "USD - Dollaro" },
      { value: "GBP", label: "GBP - Sterlina" }
    ]},
    { id: "payment_method", label: "Modalità di Pagamento", type: "select", required: true, options: [
      { value: "bonifico", label: "Bonifico Bancario" },
      { value: "assegno", label: "Assegno" },
      { value: "contanti", label: "Contanti" },
      { value: "altro", label: "Altro" }
    ]},
    { id: "payment_due_date", label: "Scadenza del Pagamento (es. entro il 5 di ogni mese)", type: "text", required: true },
    { id: "bank_iban", label: "Coordinate Bancarie / IBAN per il Pagamento", type: "text", required: true },
    { id: "account_holder", label: "Intestatario del Conto per il Pagamento", type: "text", required: true },
    { id: "advance_payment", label: "Mensilità Anticipata o Caparra?", type: "select", required: false, options: [
      { value: "una", label: "Sì, Una Mensilità Anticipata" },
      { value: "due", label: "Sì, Due Mensilità Anticipate" },
      { value: "no", label: "No" }
    ]},
    { id: "security_deposit", label: "Deposito Cauzionale?", type: "select", required: true, options: [
      { value: "si", label: "Sì (specificare importo nel campo successivo)" },
      { value: "no", label: "No" }
    ]},
    { id: "security_deposit_amount", label: "Importo Deposito Cauzionale (€) - se applicabile", type: "number", required: false },
    
    // Sezione 6: Spese e Oneri Accessori
    { id: "condominium_fees", label: "Le Spese Condominiali sono a Carico di Chi?", type: "select", required: true, section: "Spese e Oneri Accessori", options: [
      { value: "conduttore", label: "Conduttore" },
      { value: "locatore", label: "Locatore" },
      { value: "ripartite", label: "Ripartite" }
    ]},
    { id: "utilities_responsibility", label: "Chi si Occupa delle Utenze (luce, gas, acqua, rifiuti)?", type: "select", required: true, options: [
      { value: "conduttore", label: "Conduttore" },
      { value: "locatore", label: "Locatore" },
      { value: "ripartite", label: "Ripartite" }
    ]},
    { id: "rent_includes_fees", label: "Il Canone Include o Esclude le Spese Condominiali?", type: "select", required: true, options: [
      { value: "include", label: "Include" },
      { value: "esclude", label: "Esclude" }
    ]},
    
    // Sezione 7: Clausole Aggiuntive
    { id: "istat_adjustment", label: "Adeguamento ISTAT Annuale del Canone?", type: "select", required: false, section: "Clausole Aggiuntive", options: [
      { value: "si", label: "Sì, Secondo Indice ISTAT" },
      { value: "no", label: "No" }
    ]},
    { id: "sublease_prohibition", label: "Divieto di Subaffitto o Cessione del Contratto?", type: "select", required: false, options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" }
    ]},
    { id: "modifications_allowed", label: "Consentire Modifiche o Lavori da Parte del Conduttore?", type: "select", required: false, options: [
      { value: "si_autorizzazione", label: "Sì, Previa Autorizzazione Scritta" },
      { value: "no", label: "No" }
    ]},
    { id: "termination_clause", label: "Clausola di Risoluzione per Inadempienza?", type: "select", required: true, options: [
      { value: "si", label: "Sì, Clausola Risolutiva Espressa" },
      { value: "no", label: "No" }
    ]},
    
    // Sezione 8: Registrazione e Imposte
    { id: "contract_registration", label: "Il Contratto Sarà Registrato all'Agenzia delle Entrate?", type: "select", required: true, section: "Registrazione e Imposte", options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" }
    ]},
    { id: "registration_costs", label: "Chi si Farà Carico delle Spese di Registrazione?", type: "select", required: true, options: [
      { value: "locatore", label: "Locatore" },
      { value: "conduttore", label: "Conduttore" },
      { value: "parita", label: "In Parti Uguali" }
    ]},
    { id: "cedolare_secca", label: "Optare per la Cedolare Secca?", type: "select", required: false, options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" }
    ]},
    
    // Sezione 9: Luogo, Data e Firma
    { id: "place_of_signing", label: "Luogo di Stipula del Contratto", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "landlord_signature", label: "Firma del Locatore (nome e cognome)", type: "text", required: true },
    { id: "tenant_signature", label: "Firma del Conduttore (nome e cognome)", type: "text", required: true },
  ],
  comodato_uso: [
    // Sezione 1: Dati del Comodante
    { id: "lender_name", label: "Nome o Ragione Sociale del Comodante (colui che concede il bene)", type: "text", required: true, section: "Dati del Comodante" },
    { id: "lender_fiscal_code", label: "Codice Fiscale o Partita IVA del Comodante", type: "text", required: true },
    { id: "lender_address", label: "Indirizzo di Residenza o Sede Legale del Comodante", type: "text", required: true },
    { id: "lender_email", label: "Email o PEC del Comodante", type: "text", required: true },
    { id: "lender_phone", label: "Numero di Telefono del Comodante", type: "text", required: false },
    
    // Sezione 2: Dati del Comodatario
    { id: "borrower_name", label: "Nome o Ragione Sociale del Comodatario (colui che riceve il bene)", type: "text", required: true, section: "Dati del Comodatario" },
    { id: "borrower_fiscal_code", label: "Codice Fiscale o Partita IVA del Comodatario", type: "text", required: true },
    { id: "borrower_address", label: "Indirizzo di Residenza o Sede Legale del Comodatario", type: "text", required: true },
    { id: "borrower_email", label: "Email o PEC del Comodatario", type: "text", required: true },
    { id: "borrower_phone", label: "Numero di Telefono del Comodatario", type: "text", required: false },
    
    // Sezione 3: Dati del Bene
    { id: "asset_address", label: "Indirizzo Completo del Bene Oggetto del Comodato (via, numero civico, CAP, città, provincia)", type: "text", required: true, section: "Dati del Bene" },
    { id: "asset_type", label: "Il Bene è Mobile o Immobile?", type: "select", required: true, options: [
      { value: "mobile", label: "Mobile" },
      { value: "immobile", label: "Immobile" }
    ]},
    { id: "asset_description", label: "Descrizione Caratteristiche del Bene (se mobile: marca/modello/numero di serie; se immobile: superficie, piano, vani, pertinenze)", type: "textarea", required: false },
    { id: "usage_purpose", label: "Finalità dell'Uso Consentito al Comodatario (es. uso abitativo, aziendale, personale)", type: "text", required: true },
    
    // Sezione 4: Durata del Comodato
    { id: "duration", label: "Durata del Comodato (specificare dal giorno... al giorno... oppure 'a tempo indeterminato - comodato precario')", type: "text", required: true, section: "Durata del Comodato" },
    { id: "early_return", label: "Possibilità di Restituzione Anticipata", type: "select", required: false, options: [
      { value: "comodante_3mesi", label: "Sì, Comodante può Richiedere con Preavviso di 3 Mesi" },
      { value: "comodante_6mesi", label: "Sì, Comodante può Richiedere con Preavviso di 6 Mesi" },
      { value: "comodatario_libero", label: "Sì, Comodatario può Restituire Liberamente" },
      { value: "no", label: "No, Non Previsto" }
    ]},
    { id: "sublease_allowed", label: "Il Comodatario può Subconcedere o Cedere l'Uso del Bene a Terzi?", type: "select", required: false, options: [
      { value: "si_autorizzazione", label: "Sì, Previa Autorizzazione Scritta" },
      { value: "no", label: "No, Non Consentito" }
    ]},
    
    // Sezione 5: Spese e Obblighi
    { id: "expenses_responsibility", label: "Chi si Farà Carico delle Spese Ordinarie e Straordinarie Relative al Bene?", type: "select", required: true, section: "Spese e Obblighi", options: [
      { value: "comodante", label: "Comodante" },
      { value: "comodatario", label: "Comodatario" },
      { value: "ripartite", label: "Ripartite (specificare modalità)" }
    ]},
    { id: "custody_obligation", label: "Accetti di custodire e restituire il bene nelle condizioni ricevute salvo usura normale?", type: "select", required: true, options: [
      { value: "si", label: "Sì, Accetto l'Obbligo di Custodia e Diligenza" },
      { value: "no", label: "No" }
    ]},
    { id: "damage_responsibility", label: "Responsabilità per Danni o Perimento del Bene", type: "textarea", required: false },
    { id: "modifications_prohibited", label: "Il Comodatario Non Potrà Richiedere la Modifica dello Stato del Bene Senza Consenso del Comodante?", type: "select", required: false, options: [
      { value: "si", label: "Sì, Modifiche Vietate Senza Consenso" },
      { value: "no", label: "No, Modifiche Consentite" }
    ]},
    
    // Sezione 6: Registrazione e Aspetti Fiscali
    { id: "registration_required", label: "Inserire una Clausola di Registrazione del Contratto presso l'Agenzia delle Entrate?", type: "select", required: true, section: "Registrazione e Aspetti Fiscali", options: [
      { value: "si", label: "Sì, Registrare entro 30 Giorni" },
      { value: "no", label: "No / Formato Verbale" }
    ]},
    { id: "tax_benefits", label: "Prevedere Agevolazioni Fiscali (es. per parenti in linea diretta, abitazione principale del comodatario)?", type: "select", required: false, options: [
      { value: "si", label: "Sì, Specificare nel Contratto" },
      { value: "no", label: "No" }
    ]},
    
    // Sezione 7: Luogo, Data e Firma
    { id: "place_of_signing", label: "Luogo di Stipula del Contratto", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula del Contratto", type: "date", required: true },
    { id: "lender_signature", label: "Firma del Comodante (nome e cognome)", type: "text", required: true },
    { id: "borrower_signature", label: "Firma del Comodatario (nome e cognome)", type: "text", required: true },
  ],
  nda: [
    { id: "disclosing_party", label: "Parte Divulgante", type: "text", required: true },
    { id: "receiving_party", label: "Parte Ricevente", type: "text", required: true },
    { id: "purpose", label: "Scopo dell'Accordo", type: "textarea", required: true },
    { id: "duration_years", label: "Durata (Anni)", type: "number", required: true },
    { id: "confidential_info", label: "Descrizione Informazioni Riservate", type: "textarea", required: true },
  ],
  lavoro_indeterminato: [
    { id: "employer_name", label: "Nome Datore di Lavoro", type: "text", required: true },
    { id: "employer_vat", label: "P.IVA Datore di Lavoro", type: "text", required: true },
    { id: "employee_name", label: "Nome Dipendente", type: "text", required: true },
    { id: "employee_cf", label: "Codice Fiscale Dipendente", type: "text", required: true },
    { id: "role", label: "Ruolo/Mansione", type: "text", required: true },
    { id: "salary", label: "Retribuzione Annua Lorda (€)", type: "number", required: true },
    { id: "start_date", label: "Data Inizio Rapporto", type: "date", required: true },
    { id: "working_hours", label: "Ore di Lavoro Settimanali", type: "number", required: true },
    { id: "additional_clauses", label: "Clausole Aggiuntive", type: "textarea", required: false },
  ],
  messa_in_mora: [
    // Sezione 1: Dati del Mittente (creditore)
    { id: "sender_name", label: "Nome o Ragione Sociale del Mittente", type: "text", required: true, section: "Dati del Mittente (Creditore)" },
    { id: "sender_fiscal_code", label: "Codice Fiscale o Partita IVA del Mittente", type: "text", required: true },
    { id: "sender_address", label: "Indirizzo Completo del Mittente (via, numero, CAP, città, provincia)", type: "text", required: true },
    { id: "sender_email", label: "Email o PEC del Mittente", type: "text", required: true },
    { id: "sender_phone", label: "Numero di Telefono del Mittente", type: "text", required: false },
    { id: "sender_representative", label: "Referente o Rappresentante Legale (nome e ruolo)", type: "text", required: false },
    
    // Sezione 2: Dati del Destinatario (debitore)
    { id: "recipient_name", label: "Nome o Ragione Sociale del Destinatario", type: "text", required: true, section: "Dati del Destinatario (Debitore)" },
    { id: "recipient_fiscal_code", label: "Codice Fiscale o Partita IVA del Destinatario", type: "text", required: true },
    { id: "recipient_address", label: "Indirizzo Completo del Destinatario", type: "text", required: true },
    { id: "recipient_email", label: "Email o PEC del Destinatario", type: "text", required: true },
    { id: "recipient_contact", label: "Referente o Contatto Diretto del Destinatario", type: "text", required: false },
    
    // Sezione 3: Dettagli del Rapporto o Documento
    { id: "relationship_type", label: "Tipo di Rapporto che ha Generato il Credito", type: "select", required: true, section: "Dettagli del Rapporto o Documento", options: [
      { value: "fornitura", label: "Contratto di Fornitura" },
      { value: "servizi", label: "Contratto di Servizi" },
      { value: "locazione", label: "Locazione o Affitto" },
      { value: "collaborazione", label: "Collaborazione Professionale" },
      { value: "vendita", label: "Vendita di Beni" },
      { value: "altro", label: "Altro" }
    ]},
    { id: "document_number", label: "Numero del Contratto, Ordine o Fattura", type: "text", required: true },
    { id: "document_date", label: "Data del Contratto, Ordine o Fattura", type: "date", required: true },
    { id: "service_description", label: "Descrizione Breve del Servizio o Bene Fornito", type: "textarea", required: true },
    { id: "legal_reference", label: "Riferimento Normativo o Clausola Contrattuale Specifica", type: "textarea", required: false },
    
    // Sezione 4: Importo Dovuto e Condizioni Economiche
    { id: "total_amount", label: "Importo Totale Dovuto (€)", type: "number", required: true, section: "Importo Dovuto e Condizioni Economiche" },
    { id: "currency", label: "Valuta dell'Importo", type: "select", required: true, options: [
      { value: "EUR", label: "EUR - Euro" },
      { value: "USD", label: "USD - Dollaro" },
      { value: "GBP", label: "GBP - Sterlina" }
    ]},
    { id: "due_date", label: "Data di Scadenza Originaria del Pagamento", type: "date", required: true },
    { id: "partial_payment", label: "Importo Acconti Parziali Ricevuti (se presenti)", type: "number", required: false },
    { id: "remaining_balance", label: "Saldo Residuo Effettivamente Dovuto (€)", type: "number", required: true },
    { id: "interest_type", label: "Applicazione Interessi di Mora", type: "select", required: false, options: [
      { value: "nessuno", label: "Nessun Interesse" },
      { value: "legali", label: "Interessi Legali" },
      { value: "dlgs231", label: "Interessi da D.Lgs. 231/2002" },
      { value: "contrattuali", label: "Interessi Contrattuali (specificare tasso)" }
    ]},
    { id: "interest_rate", label: "Tasso di Interesse Contrattuale (se applicabile, in %)", type: "number", required: false },
    
    // Sezione 5: Nuovo Termine di Pagamento
    { id: "new_deadline", label: "Nuovo Termine per il Pagamento (es. 'entro 7 giorni dal ricevimento' o data precisa)", type: "text", required: true, section: "Nuovo Termine di Pagamento" },
    { id: "payment_method", label: "Modalità di Pagamento", type: "select", required: true, options: [
      { value: "bonifico", label: "Bonifico Bancario" },
      { value: "assegno", label: "Assegno" },
      { value: "contanti", label: "Contanti" },
      { value: "altro", label: "Altra Modalità" }
    ]},
    { id: "bank_iban", label: "Coordinate Bancarie / IBAN (se pagamento tramite bonifico)", type: "text", required: false },
    { id: "account_holder", label: "Intestatario del Conto per il Pagamento", type: "text", required: true },
    
    // Sezione 6: Conseguenze in Caso di Mancato Pagamento
    { id: "legal_warning_type", label: "Tipo di Avviso Legale da Includere", type: "select", required: true, section: "Conseguenze in Caso di Mancato Pagamento", options: [
      { value: "generico", label: "Avviso Generico (mi vedrò costretto ad adire le vie legali)" },
      { value: "specifico", label: "Specifica di Azione (azione in sede civile per recupero credito)" },
      { value: "con_spese", label: "Con Richiesta di Rimborso Spese (spese legali e interessi)" }
    ]},
    { id: "service_suspension", label: "Segnalazione di Sospensione Servizi/Contratti in Corso", type: "textarea", required: false },
    
    // Sezione 7: Luogo, Data e Firma
    { id: "place_of_drafting", label: "Luogo di Redazione della Lettera", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_drafting", label: "Data di Redazione", type: "date", required: true },
    { id: "signature", label: "Firma del Mittente (nome e cognome)", type: "text", required: true },
    { id: "company_stamp", label: "Timbro Aziendale (descrizione o indicazione)", type: "text", required: false },
    
    // Sezione 8: Modalità di Invio
    { id: "sending_method", label: "Modalità di Invio della Lettera", type: "select", required: true, section: "Modalità di Invio", options: [
      { value: "pec", label: "PEC" },
      { value: "raccomandata", label: "Raccomandata A/R" },
      { value: "consegna_mano", label: "Consegna a Mano con Ricevuta" }
    ]},
    { id: "recipient_pec_address", label: "Indirizzo PEC o Postale del Destinatario", type: "text", required: true },
    { id: "receipt_confirmation", label: "Richiesta di Conferma di Ricezione", type: "select", required: false, options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" }
    ]},
    { id: "internal_protocol", label: "Numero di Protocollo Interno o Riferimento", type: "text", required: false },
  ],
  contratto_prestito_privati: [
    { id: "lender_name", label: "Nome e Cognome del Prestatore (chi presta il denaro)", type: "text", required: true, section: "Dati del Prestatore" },
    { id: "lender_fiscal_code", label: "Codice Fiscale o Partita IVA del Prestatore", type: "text", required: true },
    { id: "borrower_name", label: "Nome e Cognome del Beneficiario (chi riceve il prestito)", type: "text", required: true, section: "Dati del Beneficiario" },
    { id: "borrower_fiscal_code", label: "Codice Fiscale del Beneficiario", type: "text", required: true },
    { id: "loan_amount", label: "Importo Totale del Prestito", type: "number", required: true, section: "Dettagli del Prestito" },
    { id: "currency", label: "Valuta del Prestito", type: "select", required: true, options: [
      { value: "EUR", label: "EUR - Euro" },
      { value: "USD", label: "USD - Dollaro" },
      { value: "GBP", label: "GBP - Sterlina" }
    ]},
    { id: "interest_rate", label: "Tasso d'Interesse (%) - se applicabile", type: "number", required: false },
    { id: "disbursement_date", label: "Data di Erogazione del Prestito", type: "date", required: true },
    { id: "repayment_deadline", label: "Durata del Prestito o Data di Restituzione Prevista", type: "text", required: true },
    { id: "repayment_method", label: "Modalità di Restituzione", type: "text", required: true, placeholder: "Es. unica soluzione, rate mensili" },
    { id: "payment_method", label: "Metodo di Pagamento", type: "select", required: false, options: [
      { value: "bonifico", label: "Bonifico Bancario" },
      { value: "contanti", label: "Contanti" },
      { value: "assegno", label: "Assegno" }
    ]},
    { id: "guarantees", label: "Eventuali Garanzie (es. fideiussione, bene in pegno)", type: "textarea", required: false },
    { id: "default_clause", label: "Clausola di Risoluzione in Caso di Mancato Pagamento", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo di Stipula del Contratto", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "lender_signature", label: "Firma del Prestatore", type: "text", required: true },
    { id: "borrower_signature", label: "Firma del Beneficiario", type: "text", required: true },
  ],
  contratto_vendita_privata: [
    { id: "seller_name", label: "Nome o Ragione Sociale del Venditore", type: "text", required: true, section: "Dati delle Parti" },
    { id: "buyer_name", label: "Nome o Ragione Sociale del Compratore", type: "text", required: true },
    { id: "item_description", label: "Descrizione Dettagliata del Bene Oggetto della Vendita", type: "textarea", required: true, section: "Oggetto della Vendita" },
    { id: "sale_price", label: "Valore o Prezzo di Vendita Concordato", type: "number", required: true },
    { id: "currency", label: "Valuta Utilizzata", type: "select", required: true, options: [
      { value: "EUR", label: "EUR - Euro" },
      { value: "USD", label: "USD - Dollaro" },
      { value: "GBP", label: "GBP - Sterlina" }
    ]},
    { id: "deposit", label: "Acconto (se previsto)", type: "number", required: false },
    { id: "payment_method", label: "Modalità di Pagamento", type: "select", required: true, options: [
      { value: "bonifico", label: "Bonifico Bancario" },
      { value: "contanti", label: "Contanti" },
      { value: "assegno", label: "Assegno" }
    ]},
    { id: "delivery_date", label: "Data di Consegna o Trasferimento del Bene", type: "date", required: true },
    { id: "as_is", label: "Il Bene viene Venduto 'Visto e Piaciuto'?", type: "select", required: false, options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" }
    ]},
    { id: "warranty", label: "Garanzia del Venditore sul Bene", type: "textarea", required: false },
    { id: "withdrawal_clause", label: "Clausola di Recesso o Risoluzione del Contratto", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "seller_signature", label: "Firma del Venditore", type: "text", required: true },
    { id: "buyer_signature", label: "Firma del Compratore", type: "text", required: true },
  ],
  contratto_fornitura_servizi: [
    { id: "supplier_name", label: "Nome o Ragione Sociale del Fornitore", type: "text", required: true, section: "Dati delle Parti" },
    { id: "client_name", label: "Nome o Ragione Sociale del Cliente", type: "text", required: true },
    { id: "service_object", label: "Oggetto della Fornitura o del Servizio", type: "textarea", required: true, section: "Dettagli del Contratto" },
    { id: "contract_duration", label: "Durata del Contratto o Data di Scadenza", type: "text", required: true },
    { id: "total_price", label: "Prezzo o Compenso Totale Previsto", type: "number", required: true },
    { id: "payment_terms", label: "Modalità e Tempi di Pagamento", type: "text", required: true },
    { id: "penalties", label: "Penali in Caso di Ritardo o Inadempienza", type: "textarea", required: false },
    { id: "delivery_terms", label: "Termini di Consegna o Collaudo dei Beni/Servizi", type: "textarea", required: false },
    { id: "exclusivity_clause", label: "Clausola di Esclusiva o Non Concorrenza", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "supplier_signature", label: "Firma del Fornitore", type: "text", required: true },
    { id: "client_signature", label: "Firma del Cliente", type: "text", required: true },
  ],
  contratto_collaborazione: [
    { id: "parties_names", label: "Nomi o Ragioni Sociali delle Parti Coinvolte", type: "textarea", required: true, section: "Dati delle Parti" },
    { id: "collaboration_object", label: "Oggetto della Collaborazione o Partnership", type: "textarea", required: true, section: "Dettagli della Collaborazione" },
    { id: "contract_duration", label: "Durata del Contratto", type: "text", required: true },
    { id: "reciprocal_obligations", label: "Obblighi Reciproci delle Parti", type: "textarea", required: true },
    { id: "profit_distribution", label: "Ripartizione dei Profitti o Costi", type: "textarea", required: false },
    { id: "confidentiality_clause", label: "Clausole di Riservatezza o Non Concorrenza", type: "textarea", required: false },
    { id: "ip_ownership", label: "Proprietà dei Risultati o Materiali Prodotti", type: "textarea", required: false },
    { id: "early_termination", label: "Modalità di Recesso Anticipato", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firme delle Parti", type: "textarea", required: true },
  ],
  contratto_licenza: [
    { id: "licensor_name", label: "Nome del Licenziante o Cedente (titolare del diritto)", type: "text", required: true, section: "Dati delle Parti" },
    { id: "licensee_name", label: "Nome del Licenziatario o Cessionario (chi riceve il diritto)", type: "text", required: true },
    { id: "right_nature", label: "Natura del Diritto Ceduto (marchio, brevetto, software, opera)", type: "text", required: true, section: "Dettagli della Licenza" },
    { id: "exclusivity", label: "Licenza Esclusiva o Non Esclusiva?", type: "select", required: true, options: [
      { value: "esclusiva", label: "Esclusiva" },
      { value: "non_esclusiva", label: "Non Esclusiva" }
    ]},
    { id: "license_duration", label: "Durata della Licenza o Cessione", type: "text", required: true },
    { id: "compensation", label: "Compenso o Royalty Concordata", type: "text", required: true },
    { id: "territory", label: "Territorio in cui il Diritto può essere Esercitato", type: "text", required: false },
    { id: "renewal_clause", label: "Clausole di Rinnovo Automatico o Risoluzione Anticipata", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firme delle Parti", type: "textarea", required: true },
  ],
  lavoro_determinato: [
    { id: "employer_name", label: "Nome o Ragione Sociale del Datore di Lavoro", type: "text", required: true, section: "Dati delle Parti" },
    { id: "employee_name", label: "Nome e Cognome del Lavoratore", type: "text", required: true },
    { id: "job_role", label: "Mansione o Ruolo Assegnato", type: "text", required: true, section: "Dettagli del Contratto" },
    { id: "contract_start", label: "Data di Inizio del Contratto", type: "date", required: true },
    { id: "contract_end", label: "Data di Fine del Contratto", type: "date", required: true },
    { id: "gross_salary", label: "Retribuzione Lorda Mensile", type: "number", required: true },
    { id: "working_hours", label: "Orario di Lavoro Previsto", type: "text", required: true },
    { id: "probation_period", label: "Periodo di Prova", type: "text", required: false },
    { id: "benefits", label: "Benefits o Rimborsi Spese", type: "textarea", required: false },
    { id: "confidentiality_clause", label: "Clausola di Riservatezza o Concorrenza", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firma del Datore di Lavoro e del Lavoratore", type: "textarea", required: true },
  ],
  contratto_stage: [
    { id: "host_entity_name", label: "Nome o Ragione Sociale dell'Ente Ospitante", type: "text", required: true, section: "Dati delle Parti" },
    { id: "trainee_name", label: "Nome e Cognome dello Stagista o Tirocinante", type: "text", required: true },
    { id: "internship_start", label: "Data di Inizio dello Stage", type: "date", required: true, section: "Dettagli dello Stage" },
    { id: "internship_end", label: "Data di Fine dello Stage", type: "date", required: true },
    { id: "internship_location", label: "Sede di Svolgimento del Tirocinio", type: "text", required: true },
    { id: "training_objectives", label: "Obiettivi Formativi del Tirocinio", type: "textarea", required: true },
    { id: "reimbursement", label: "Rimborso Spese Previsto", type: "text", required: false },
    { id: "company_tutor", label: "Tutor Aziendale", type: "text", required: true },
    { id: "training_tutor", label: "Tutor Formativo", type: "text", required: true },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firme delle Parti", type: "textarea", required: true },
  ],
  lavoro_autonomo: [
    { id: "client_name", label: "Nome o Ragione Sociale del Committente", type: "text", required: true, section: "Dati delle Parti" },
    { id: "contractor_name", label: "Nome e Cognome del Collaboratore", type: "text", required: true },
    { id: "work_object", label: "Oggetto dell'Incarico o Prestazione", type: "textarea", required: true, section: "Dettagli dell'Incarico" },
    { id: "assignment_duration", label: "Durata Prevista dell'Incarico", type: "text", required: true },
    { id: "compensation", label: "Compenso Pattuito e Modalità di Pagamento", type: "text", required: true },
    { id: "expense_reimbursement", label: "Rimborsi Spese Previsti", type: "text", required: false },
    { id: "confidentiality_clause", label: "Clausola di Riservatezza", type: "textarea", required: false },
    { id: "ip_assignment", label: "Cessione dei Diritti sul Lavoro Svolto", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firme del Committente e del Collaboratore", type: "textarea", required: true },
  ],
  contratto_mutuo: [
    { id: "lender_name", label: "Nome del Mutuante (che concede il prestito)", type: "text", required: true, section: "Dati delle Parti" },
    { id: "borrower_name", label: "Nome del Mutuatario (che riceve la somma)", type: "text", required: true },
    { id: "loan_amount", label: "Importo del Mutuo", type: "number", required: true, section: "Dettagli del Mutuo" },
    { id: "loan_duration", label: "Durata del Mutuo o Numero di Rate", type: "text", required: true },
    { id: "interest_rate", label: "Tasso d'Interesse Applicato (%)", type: "number", required: true },
    { id: "repayment_method", label: "Modalità di Rimborso", type: "text", required: true },
    { id: "guarantees", label: "Eventuali Garanzie (es. ipoteca, fideiussione)", type: "textarea", required: false },
    { id: "early_repayment_clause", label: "Clausola di Estinzione Anticipata", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firme delle Parti", type: "textarea", required: true },
  ],
  contratto_garanzia: [
    { id: "guarantor_name", label: "Nome del Garante", type: "text", required: true, section: "Dati delle Parti" },
    { id: "beneficiary_name", label: "Nome del Beneficiario della Garanzia", type: "text", required: true },
    { id: "guaranteed_obligation", label: "Obbligazione Garantita (importo o contratto di riferimento)", type: "textarea", required: true, section: "Dettagli della Garanzia" },
    { id: "guarantee_duration", label: "Durata della Garanzia", type: "text", required: true },
    { id: "guarantee_type", label: "Tipo di Garanzia", type: "select", required: true, options: [
      { value: "fideiussoria", label: "Fideiussoria" },
      { value: "bancaria", label: "Bancaria" },
      { value: "personale", label: "Personale" }
    ]},
    { id: "revocation_clause", label: "Possibilità di Revoca o Estinzione Anticipata", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firme del Garante e del Beneficiario", type: "textarea", required: true },
  ],
  contratto_assicurativo: [
    { id: "insurance_company", label: "Nome della Compagnia Assicuratrice", type: "text", required: true, section: "Dati delle Parti" },
    { id: "insured_name", label: "Nome dell'Assicurato", type: "text", required: true },
    { id: "coverage_type", label: "Tipo di Copertura", type: "select", required: true, section: "Dettagli della Polizza", options: [
      { value: "vita", label: "Vita" },
      { value: "danni", label: "Danni" },
      { value: "rc", label: "Responsabilità Civile" },
      { value: "altro", label: "Altro" }
    ]},
    { id: "policy_duration", label: "Durata della Polizza", type: "text", required: true },
    { id: "premium", label: "Premio Assicurativo Annuale o Mensile", type: "number", required: true },
    { id: "insured_sum", label: "Somma Assicurata o Massimale di Copertura", type: "number", required: true },
    { id: "additional_clauses", label: "Clausole Aggiuntive (es. franchigia, scoperto, estensioni)", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo e Data di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "parties_signatures", label: "Firma della Compagnia e dell'Assicurato", type: "textarea", required: true },
  ],
  autodichiarazione: [
    { id: "declarant_name", label: "Nome e Cognome del Dichiarante", type: "text", required: true, section: "Dati del Dichiarante" },
    { id: "birth_date", label: "Data di Nascita", type: "date", required: true },
    { id: "birth_place", label: "Luogo di Nascita", type: "text", required: true },
    { id: "fiscal_code", label: "Codice Fiscale", type: "text", required: true },
    { id: "residence_address", label: "Indirizzo di Residenza", type: "text", required: true },
    { id: "declaration_object", label: "Oggetto della Dichiarazione", type: "textarea", required: true, section: "Contenuto della Dichiarazione" },
    { id: "legal_reference", label: "Riferimenti Normativi (es. DPR 445/2000)", type: "text", required: false },
    { id: "place_of_declaration", label: "Luogo di Dichiarazione", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_declaration", label: "Data di Dichiarazione", type: "date", required: true },
    { id: "declarant_signature", label: "Firma del Dichiarante", type: "text", required: true },
  ],
  lettera_formale: [
    { id: "sender_name", label: "Nome o Azienda del Mittente", type: "text", required: true, section: "Dati del Mittente" },
    { id: "recipient_name", label: "Nome o Azienda del Destinatario", type: "text", required: true, section: "Dati del Destinatario" },
    { id: "letter_subject", label: "Oggetto della Comunicazione", type: "text", required: true, section: "Contenuto della Lettera" },
    { id: "letter_body", label: "Testo del Messaggio Principale", type: "textarea", required: true },
    { id: "attachments", label: "Allegati o Riferimenti", type: "textarea", required: false },
    { id: "sending_method", label: "Modalità di Invio", type: "select", required: true, section: "Modalità di Invio", options: [
      { value: "pec", label: "PEC" },
      { value: "raccomandata", label: "Raccomandata" }
    ]},
    { id: "sender_signature", label: "Firma del Mittente", type: "text", required: true, section: "Firma" },
  ],
  dgue: [
    { id: "company_name", label: "Nome dell'Azienda Partecipante", type: "text", required: true, section: "Dati dell'Azienda" },
    { id: "company_fiscal_code", label: "Codice Fiscale o Partita IVA", type: "text", required: true },
    { id: "legal_representative", label: "Rappresentante Legale", type: "text", required: true },
    { id: "tender_reference", label: "CIG, Ente Appaltante e Riferimento Gara/Appalto", type: "textarea", required: true, section: "Riferimento alla Gara" },
    { id: "qualification_docs", label: "Documentazione di Qualificazione (visura, DURC, referenze)", type: "textarea", required: true },
    { id: "additional_declarations", label: "Dichiarazioni Aggiuntive o Requisiti Specifici", type: "textarea", required: false },
    { id: "place_of_signing", label: "Luogo di Stipula", type: "text", required: true, section: "Luogo, Data e Firma" },
    { id: "date_of_signing", label: "Data di Stipula", type: "date", required: true },
    { id: "declarant_signature", label: "Firma del Dichiarante", type: "text", required: true },
  ],
};

// Default questions for document types not yet configured
const DEFAULT_QUESTIONS = [
  { id: "party_a_name", label: "Nome Prima Parte", type: "text", required: true },
  { id: "party_a_cf", label: "CF/P.IVA Prima Parte", type: "text", required: true },
  { id: "party_b_name", label: "Nome Seconda Parte", type: "text", required: true },
  { id: "party_b_cf", label: "CF/P.IVA Seconda Parte", type: "text", required: true },
  { id: "contract_object", label: "Oggetto del Contratto", type: "textarea", required: true },
  { id: "amount", label: "Importo (€)", type: "number", required: false },
  { id: "duration", label: "Durata", type: "text", required: false },
  { id: "start_date", label: "Data Inizio", type: "date", required: true },
  { id: "additional_terms", label: "Condizioni Aggiuntive", type: "textarea", required: false },
];

export default function QuestionnaireForm({ documentType, user, onDocumentGenerated, onError, onBack, onHome }) {
  const questions = QUESTIONS_BY_TYPE[documentType.id] || DEFAULT_QUESTIONS;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [direction, setDirection] = useState(1);

  const currentQuestion = questions[currentStep];

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const value = answers[currentQuestion.id];
    return value && value.toString().trim() !== "";
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      generateDocument();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    onError(null);

    try {
      if (user && user.subscription_type === "free" && user.documents_generated >= 3) {
        onError("Hai raggiunto il limite di documenti gratuiti. Registrati per continuare.");
        setIsGenerating(false);
        return;
      }

      let prompt = `Genera un documento legale professionale: ${documentType.name}, basato sui seguenti dati forniti dall'utente:\n\n`;
      
      Object.entries(answers).forEach(([key, value]) => {
        if (value) {
          const question = questions.find(q => q.id === key);
          prompt += `${question?.label}: ${value}\n`;
        }
      });

      prompt += `\nIl documento deve:\n`;
      prompt += `- Essere formalmente corretto e professionale\n`;
      prompt += `- Includere tutte le clausole legali necessarie per questo tipo di documento\n`;
      prompt += `- Essere ben strutturato con paragrafi, intestazioni e numerazione appropriata\n`;
      prompt += `- Includere spazi per firme e date dove appropriato\n`;
      prompt += `- Rispettare la normativa italiana vigente\n`;
      prompt += `- Essere pronto per la stampa, la firma e l'invio formale\n`;
      
      if (documentType.id === "messa_in_mora") {
        prompt += `\nPer la Messa in Mora, assicurati di:\n`;
        prompt += `- Indicare chiaramente l'importo dovuto e le scadenze\n`;
        prompt += `- Specificare le conseguenze legali in caso di mancato pagamento\n`;
        prompt += `- Utilizzare un tono formale ma fermo\n`;
        prompt += `- Includere tutti i riferimenti ai documenti e contratti citati\n`;
        prompt += `- Formattare il documento in modo professionale per l'invio ufficiale\n`;
      }
      if (documentType.id === "comodato_uso") {
        prompt += `\nPer il Contratto di Comodato d'Uso, assicurati di:\n`;
        prompt += `- Definire chiaramente comodante e comodatario.\n`;
        prompt += `- Descrivere in dettaglio il bene oggetto del comodato.\n`;
        prompt += `- Specificare la durata e le condizioni per l'eventuale restituzione anticipata.\n`;
        prompt += `- Dettagliare gli obblighi e le responsabilità delle parti (spese, custodia, danni).\n`;
        prompt += `- Includere clausole relative a subcomodato e modifiche del bene.\n`;
        prompt += `- Menzionare gli aspetti fiscali e di registrazione, se pertinenti.\n`;
        prompt += `- Essere conforme al Codice Civile italiano (artt. 1803 e ss.).\n`;
      }

      const result = await callAI(prompt);

      // Crea il documento salvato (se base44.entities esiste, altrimenti usa un oggetto mock)
      let savedDoc = null;
      try {
        if (base44.entities && base44.entities.Document) {
          savedDoc = await base44.entities.Document.create({
            document_type: documentType.id,
            answers: answers,
            generated_text: result,
            status: "completed"
          });
        } else {
          // Se base44.entities non esiste, crea un oggetto mock
          savedDoc = {
            id: Date.now().toString(),
            document_type: documentType.id,
            answers: answers,
            generated_text: result,
            status: "completed",
            created_date: new Date().toISOString()
          };
        }
      } catch (saveError) {
        console.warn("⚠️ Impossibile salvare il documento:", saveError);
        // Continua comunque con un documento mock
        savedDoc = {
          id: Date.now().toString(),
          document_type: documentType.id,
          answers: answers,
          generated_text: result,
          status: "completed",
          created_date: new Date().toISOString()
        };
      }

      // Aggiorna il contatore documenti generati (se possibile)
      if (user && base44.auth && base44.auth.updateMe) {
        try {
          await base44.auth.updateMe({
            documents_generated: (user.documents_generated || 0) + 1
          });
        } catch (updateError) {
          console.warn("⚠️ Impossibile aggiornare il contatore:", updateError);
        }
      }

      onDocumentGenerated({
        ...savedDoc,
        text: result,
        type_name: documentType.name
      });
    } catch (error) {
      console.error("❌ Errore completo:", error);
      const errorMessage = error.message || "Errore durante la generazione del documento. Riprova.";
      onError(errorMessage);
    }

    setIsGenerating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {documentType.name}
        </h1>
        <p className="text-gray-600">
          Rispondi alle domande per creare il documento personalizzato
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Domanda {currentStep + 1} di {questions.length}
          </span>
          <span className="text-sm font-semibold text-indigo-600">
            {Math.round(((currentStep + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-600 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Section Header (if present) */}
      {currentQuestion?.section && (currentStep === 0 || questions[currentStep - 1]?.section !== currentQuestion.section) && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border-l-4 border-indigo-600">
            <h3 className="font-bold text-indigo-900">{currentQuestion.section}</h3>
          </div>
        </div>
      )}

      {/* Question Card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Card className="p-8 mb-6">
            <Label className="text-lg font-semibold text-gray-900 mb-4 block">
              {currentQuestion?.label}
              {currentQuestion?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {currentQuestion?.type === "text" && (
              <Input
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Inserisci la risposta..."
                className="text-lg"
                autoFocus
              />
            )}

            {currentQuestion?.type === "number" && (
              <Input
                type="number"
                step="0.01"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Inserisci il valore..."
                className="text-lg"
                autoFocus
              />
            )}

            {currentQuestion?.type === "date" && (
              <Input
                type="date"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                className="text-lg"
                autoFocus
              />
            )}

            {currentQuestion?.type === "textarea" && (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Inserisci la risposta..."
                className="text-lg min-h-32"
                autoFocus
              />
            )}

            {currentQuestion?.type === "select" && (
              <Select
                value={answers[currentQuestion.id] || ""}
                onValueChange={handleAnswer}
              >
                <SelectTrigger className="text-lg">
                  <SelectValue placeholder="Seleziona un'opzione..." />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button onClick={onHome} variant="outline" className="w-32">
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>

        <Button onClick={currentStep === 0 ? onBack : handlePrevious} variant="outline" className="w-32">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Indietro
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || isGenerating}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generazione...
            </>
          ) : currentStep === questions.length - 1 ? (
            <>
              Genera Documento
              <CheckCircle className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Avanti
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
