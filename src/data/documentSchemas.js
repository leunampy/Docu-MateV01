// src/data/documentSchemas.js

export const DOCUMENT_SCHEMAS = {
  // 🏢 1. Contratto di Affitto / Locazione
  contratto_affitto: {
    fields: [
      {
        id: "locatore_nome",
        label: "Nome / Ragione Sociale del Locatore",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "locatore_codice_fiscale",
        label: "Codice Fiscale / Partita IVA del Locatore",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "codice_fiscale",
        mapsToPersonal: "codice_fiscale",
      },
      {
        id: "locatario_nome",
        label: "Nome / Ragione Sociale del Locatario",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "locatario_codice_fiscale",
        label: "Codice Fiscale / Partita IVA del Locatario",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "codice_fiscale",
        mapsToPersonal: "codice_fiscale",
      },
      {
        id: "immobile_indirizzo",
        label: "Indirizzo dell'immobile",
        type: "text",
        required: true,
      },
      {
        id: "immobile_citta",
        label: "Città dell'immobile",
        type: "text",
        required: true,
      },
      {
        id: "immobile_provincia",
        label: "Provincia dell'immobile",
        type: "text",
        required: true,
      },

      {
        id: "immobile_cap",
        label: "CAP dell'immobile",
        type: "text",
        required: true,
      },
      {
        id: "canone_importo",
        label: "Importo del canone mensile",
        type: "number",
        required: true,

      },
      {
        id: "canone_valuta",
        label: "Valuta del canone",
        type: "text",
        required: false,
      },
      {
        id: "durata_mesi",
        label: "Durata del contratto (mesi)",
        type: "number",
        required: true,
      },
      {
        id: "data_inizio",
        label: "Data di inizio del contratto",
        type: "date",
        required: true,
      },
      {
        id: "uso_azienda",
        label: "L'immobile è destinato ad uso aziendale?",
        type: "choice",
        required: false,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },

  // 💸 2. Contratto di Prestito tra Privati
  prestito_privati: {
    fields: [
      {
        id: "prestatore_nome",
        label: "Nome completo del Prestatore",
        type: "text",
        required: true,
        usePersonal: true,
        mapsToPersonal: "nome",
      },
      {
        id: "prestatore_codice_fiscale",
        label: "Codice Fiscale del Prestatore",
        type: "text",
        required: true,
        usePersonal: true,
        mapsToPersonal: "codice_fiscale",
      },
      {
        id: "beneficiario_nome",
        label: "Nome completo del Beneficiario",
        type: "text",
        required: true,
      },
      {
        id: "beneficiario_codice_fiscale",
        label: "Codice Fiscale del Beneficiario",
        type: "text",
        required: true,
      },
      {
        id: "importo",
        label: "Importo del prestito",
        type: "number",
        required: true,
      },
      {
        id: "valuta",
        label: "Valuta",
        type: "text",
        required: false,
      },
      {
        id: "tasso_interesse_choice",
        label: "Il prestito prevede un tasso di interesse?",
        type: "choice",
        required: true,
        options: [
          { value: "nessuno", label: "Nessuno" },
          { value: "fisso", label: "Fisso" },
        ],
      },
      {
        id: "tasso_interesse",
        label: "Tasso di interesse annuo (%)",
        type: "number",
        required: false,
        dependsOn: { field: "tasso_interesse_choice", value: "fisso" },
      },
      {
        id: "data_erogazione",
        label: "Data di erogazione del prestito",
        type: "date",
        required: true,
      },
      {
        id: "data_restituzione",
        label: "Data prevista per la restituzione",
        type: "date",
        required: true,
      },
      {
        id: "modalita_restituzione",
        label: "Modalità di restituzione (es. unica soluzione, rateale)",
        type: "text",
        required: true,
      },
      {
        id: "metodo_pagamento",
        label: "Metodo di pagamento",
        type: "text",
        required: true,
      },
      {
        id: "garanzie",
        label: "Garanzie previste (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "clausola_risoluzione",
        label: "Clausola di risoluzione anticipata (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "luogo_stipula",
        label: "Luogo di stipula del contratto",
        type: "text",
        required: true,
      },
      {
        id: "data_stipula",
        label: "Data di stipula del contratto",
        type: "date",
        required: true,
      },
      {
        id: "firma_prestatore",
        label: "Firma del Prestatore",
        type: "text",
        required: true,
      },
      {
        id: "firma_beneficiario",
        label: "Firma del Beneficiario",
        type: "text",
        required: true,
      },
    ],
  },

  // 🛒 3. Contratto di Vendita Privata
  vendita_privata: {
    fields: [
      {
        id: "venditore_nome",
        label: "Nome / Ragione Sociale del Venditore",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "compratore_nome",
        label: "Nome / Ragione Sociale del Compratore",
        type: "text",
        required: true,
      },
      {
        id: "descrizione_bene",
        label: "Descrizione dettagliata del bene venduto",
        type: "text",
        required: true,
      },
      {
        id: "prezzo",
        label: "Prezzo di vendita",
        type: "number",
        required: true,
      },
      {
        id: "valuta",
        label: "Valuta",
        type: "text",
        required: false,
      },
      {
        id: "acconto_choice",
        label: "È previsto un acconto?",
        type: "choice",
        required: true,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "acconto_importo",
        label: "Importo dell'acconto",
        type: "number",
        required: false,
        dependsOn: { field: "acconto_choice", value: "si" },
      },
      {
        id: "modalita_pagamento",
        label: "Modalità di pagamento",
        type: "text",
        required: true,
      },
      {
        id: "data_consegna",
        label: "Data prevista per la consegna",
        type: "date",
        required: true,
      },
      {
        id: "visto_piaciuto_choice",
        label: "Clausola 'visto e piaciuto'",
        type: "choice",
        required: false,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "garanzia_choice",
        label: "È prevista una garanzia?",
        type: "choice",
        required: false,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "clausola_recesso",
        label: "Clausola di recesso (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data_stipula",
        label: "Luogo e data di stipula",
        type: "text",
        required: true,
      },
      {
        id: "firma_venditore",
        label: "Firma del Venditore",
        type: "text",
        required: true,
      },
      {
        id: "firma_compratore",
        label: "Firma del Compratore",
        type: "text",
        required: true,
      },
    ],
  },

  // 📦 4. Contratto di Fornitura / Servizi
  fornitura_servizi: {
    fields: [
      {
        id: "fornitore_nome",
        label: "Nome / Ragione Sociale del Fornitore",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "cliente_nome",
        label: "Nome / Ragione Sociale del Cliente",
        type: "text",
        required: true,
      },
      {
        id: "oggetto_fornitura",
        label: "Oggetto della fornitura / servizio",
        type: "text",
        required: true,
      },
      {
        id: "durata",
        label: "Durata del contratto",
        type: "text",
        required: true,
      },
      {
        id: "prezzo_totale",
        label: "Prezzo totale",
        type: "number",
        required: true,
      },
      {
        id: "modalita_pagamento",
        label: "Modalità di pagamento",
        type: "text",
        required: true,
      },
      {
        id: "penali_choice",
        label: "Sono previste penali?",
        type: "choice",
        required: false,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "termini_consegna",
        label: "Termini di consegna / esecuzione",
        type: "text",
        required: true,
      },
      {
        id: "clausola_non_concorrenza",
        label: "Clausola di non concorrenza (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma_fornitore",
        label: "Firma del Fornitore",
        type: "text",
        required: true,
      },
      {
        id: "firma_cliente",
        label: "Firma del Cliente",
        type: "text",
        required: true,
      },
    ],
  },

  // 🤝 5. Contratto di Collaborazione / Partnership
  collaborazione_partnership: {
    fields: [
      {
        id: "parte_a_nome",
        label: "Nome / Ragione Sociale della Parte A",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "parte_b_nome",
        label: "Nome / Ragione Sociale della Parte B",
        type: "text",
        required: true,
      },
      {
        id: "oggetto",
        label: "Oggetto della collaborazione / partnership",
        type: "text",
        required: true,
      },
      {
        id: "durata",
        label: "Durata del contratto",
        type: "text",
        required: true,
      },
      {
        id: "obblighi",
        label: "Obblighi delle parti",
        type: "text",
        required: true,
      },
      {
        id: "ripartizione_profitti",
        label: "Ripartizione dei profitti (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "clausola_non_concorrenza",
        label: "Clausola di non concorrenza",
        type: "text",
        required: false,
      },
      {
        id: "proprieta_risultati",
        label: "Proprietà dei risultati / prodotti",
        type: "text",
        required: true,
      },
      {
        id: "recesso_anticipato",
        label: "Modalità di recesso anticipato",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma_parti",
        label: "Firme delle parti",
        type: "text",
        required: true,
      },
    ],
  },

  // 💡 6. Licenza / Cessione Diritti
  licenza_diritti: {
    fields: [
      {
        id: "licenziante",
        label: "Nome / Ragione Sociale del Licenziante",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "licenziatario",
        label: "Nome / Ragione Sociale del Licenziatario",
        type: "text",
        required: true,
      },
      {
        id: "natura_diritto",
        label: "Natura del diritto concesso",
        type: "text",
        required: true,
      },
      {
        id: "esclusiva_choice",
        label: "La licenza è esclusiva?",
        type: "choice",
        required: true,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "durata",
        label: "Durata della licenza",
        type: "text",
        required: true,
      },
      {
        id: "compenso",
        label: "Compenso previsto",
        type: "text",
        required: true,
      },
      {
        id: "territorio",
        label: "Territorio di validità (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "rinnovo_anticipato",
        label: "Modalità di rinnovo anticipato (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma_parti",
        label: "Firme delle parti",
        type: "text",
        required: true,
      },
    ],
  },

  // 👔 7. Contratto di Lavoro a Tempo Determinato
  lavoro_determinato: {
    fields: [
      {
        id: "datore_nome",
        label: "Nome / Ragione Sociale del Datore di Lavoro",
        type: "text",
        required: true,
        useCompany: true,
        mapsToCompany: "ragione_sociale",
      },
      {
        id: "lavoratore_nome",
        label: "Nome completo del Lavoratore",
        type: "text",
        required: true,
        usePersonal: true,
        mapsToPersonal: "nome",
      },
      {
        id: "mansione",
        label: "Mansione / Qualifica",
        type: "text",
        required: true,
      },
      {
        id: "data_inizio",
        label: "Data di inizio del rapporto di lavoro",
        type: "date",
        required: true,
      },
      {
        id: "data_fine",
        label: "Data di fine del rapporto di lavoro",
        type: "date",
        required: true,
      },
      {
        id: "retribuzione_mensile",
        label: "Retribuzione mensile lorda",
        type: "number",
        required: true,
      },
      {
        id: "orario_lavoro",
        label: "Orario di lavoro settimanale",
        type: "text",
        required: true,
      },
      {
        id: "periodo_prova_choice",
        label: "È previsto un periodo di prova?",
        type: "choice",
        required: false,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "benefit",
        label: "Benefit previsti (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "clausola_riservatezza",
        label: "Clausola di riservatezza",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma_parti",
        label: "Firme delle parti",
        type: "text",
        required: true,
      },
    ],
  },

  // 🎓 8. Contratto di Stage / Tirocinio
  stage_tirocinio: {
    fields: [
      {
        id: "ente_ospitante",
        label: "Nome / Ragione Sociale dell'Ente Ospitante",
        type: "text",
        required: true,
        useCompany: true,
        mapsToCompany: "ragione_sociale",
      },
      {
        id: "tirocinante_nome",
        label: "Nome completo del Tirocinante",
        type: "text",
        required: true,
        usePersonal: true,
        mapsToPersonal: "nome",
      },
      {
        id: "data_inizio",
        label: "Data di inizio del tirocinio",
        type: "date",
        required: true,
      },
      {
        id: "data_fine",
        label: "Data di fine del tirocinio",
        type: "date",
        required: true,
      },
      {
        id: "sede",
        label: "Sede del tirocinio",
        type: "text",
        required: true,
      },
      {
        id: "obiettivi",
        label: "Obiettivi formativi del tirocinio",
        type: "text",
        required: true,
      },
      {
        id: "rimborso_choice",
        label: "È previsto un rimborso spese?",
        type: "choice",
        required: false,
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "tutor_aziendale",
        label: "Nome del Tutor Aziendale",
        type: "text",
        required: true,
      },
      {
        id: "tutor_formativo",
        label: "Nome del Tutor Formativo",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma_parti",
        label: "Firme delle parti",
        type: "text",
        required: true,
      },
    ],
  },

  // 🧾 9. Autodichiarazione
  autodichiarazione: {
    fields: [
      {
        id: "dichiarante_nome",
        label: "Nome completo del Dichiarante",
        type: "text",
        required: true,
        usePersonal: true,
        mapsToPersonal: "nome",
      },
      {
        id: "luogo_nascita",
        label: "Luogo di nascita",
        type: "text",
        required: true,
      },
      {
        id: "data_nascita",
        label: "Data di nascita",
        type: "date",
        required: true,
      },
      {
        id: "codice_fiscale",
        label: "Codice Fiscale",
        type: "text",
        required: true,
        usePersonal: true,
        mapsToPersonal: "codice_fiscale",
      },
      {
        id: "indirizzo",
        label: "Indirizzo di residenza",
        type: "text",
        required: true,
      },
      {
        id: "oggetto",
        label: "Oggetto dell'autodichiarazione",
        type: "text",
        required: true,
      },
      {
        id: "riferimenti_normativi",
        label: "Riferimenti normativi (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma",
        label: "Firma del Dichiarante",
        type: "text",
        required: true,
      },
    ],
  },

  // 📬 10. Lettera Formale (PEC o Raccomandata)
  lettera_formale: {
    fields: [
      {
        id: "mittente",
        label: "Mittente",
        type: "text",
        required: true,
        useCompany: true,
        usePersonal: true,
        mapsToCompany: "ragione_sociale",
        mapsToPersonal: "nome",
      },
      {
        id: "destinatario",
        label: "Destinatario",
        type: "text",
        required: true,
      },
      {
        id: "oggetto",
        label: "Oggetto",
        type: "text",
        required: true,
      },
      {
        id: "testo",
        label: "Testo della lettera",
        type: "text",
        required: true,
      },
      {
        id: "allegati",
        label: "Allegati (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "metodo_invio",
        label: "Metodo di invio",
        type: "choice",
        required: true,
        options: [
          { value: "PEC", label: "PEC" },
          { value: "RACCOMANDATA", label: "Raccomandata" },
        ],
      },
      {
        id: "firma",
        label: "Firma",
        type: "text",
        required: true,
      },
    ],
  },

  // 🏛️ 11. DGUE / Gara Pubblica
  dgue: {
    fields: [
      {
        id: "azienda_nome",
        label: "Ragione Sociale dell'Azienda",
        type: "text",
        required: true,
        useCompany: true,
        mapsToCompany: "ragione_sociale",
      },
      {
        id: "azienda_codice_fiscale",
        label: "Codice Fiscale / Partita IVA dell'Azienda",
        type: "text",
        required: true,
        useCompany: true,
        mapsToCompany: "codice_fiscale",
      },
      {
        id: "rappresentante_legale",
        label: "Nome del Rappresentante Legale",
        type: "text",
        required: true,
      },
      {
        id: "riferimento_gara",
        label: "Riferimento della Gara / Procedura",
        type: "text",
        required: true,
      },
      {
        id: "documentazione",
        label: "Documentazione allegata (opzionale)",
        type: "text",
        required: false,
      },
      {
        id: "dichiarazioni_aggiuntive",
        label: "Dichiarazioni aggiuntive",
        type: "text",
        required: false,
      },
      {
        id: "luogo_data",
        label: "Luogo e data",
        type: "text",
        required: true,
      },
      {
        id: "firma",
        label: "Firma del Rappresentante Legale",
        type: "text",
        required: true,
      },
    ],
  },
};


