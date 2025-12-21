// src/lib/promptBuilder.js

// 📚 Context normativi per ogni tipo documento
const DOCUMENT_CONTEXTS = {
  contratto_affitto: {
    normativa: "Codice Civile italiano (artt. 1571-1614) - Contratti di locazione",
    tipo: "Contratto di locazione immobiliare",
    obblighi: [
      "Registrazione presso Agenzia delle Entrate entro 30 giorni dalla stipula",
      "Imposta di registro (1% del canone annuo per contratti a canone libero)",
      "Comunicazione all'Agenzia delle Entrate per contratti a canone concordato",
      "Forma scritta obbligatoria per validità del contratto"
    ],
    articoli: ["Art. 1571 C.C. (Definizione locazione)", "Art. 1573 C.C. (Durata)", "Art. 1590 C.C. (Obblighi locatore)", "Art. 1591 C.C. (Obblighi locatario)"]
  },

  prestito_privati: {
    normativa: "Codice Civile italiano (artt. 1813-1822) - Contratti di mutuo",
    tipo: "Contratto di mutuo tra privati",
    obblighi: [
      "Forma scritta raccomandata per prova in giudizio",
      "Registrazione obbligatoria se importo superiore a €3.000",
      "Tasso di interesse deve essere determinato o determinabile",
      "Clausola di usura: tasso non può superare soglia legale"
    ],
    articoli: ["Art. 1813 C.C. (Definizione mutuo)", "Art. 1814 C.C. (Obbligo restituzione)", "Art. 1815 C.C. (Interessi)"]
  },

  vendita_privata: {
    normativa: "Codice Civile italiano (artt. 1470-1547) - Contratti di compravendita",
    tipo: "Contratto di compravendita",
    obblighi: [
      "Forma scritta obbligatoria per beni immobili (art. 1350 C.C.)",
      "Clausola 'visto e piaciuto' per beni mobili usati",
      "Registrazione obbligatoria per immobili",
      "Imposta di registro o IVA a seconda del caso"
    ],
    articoli: ["Art. 1470 C.C. (Definizione vendita)", "Art. 1476 C.C. (Obblighi venditore)", "Art. 1477 C.C. (Obblighi compratore)", "Art. 1490 C.C. (Garanzia per vizi)"]
  },

  fornitura_servizi: {
    normativa: "Codice Civile italiano (artt. 1559-1670) - Contratti di appalto e prestazione d'opera",
    tipo: "Contratto di fornitura di beni o servizi",
    obblighi: [
      "Forma scritta consigliata per contratti di valore superiore a €1.000",
      "Termini di pagamento devono essere specificati",
      "Clausola penale per inadempimento opzionale ma consigliata",
      "Diritto di recesso per consumatori (se applicabile)"
    ],
    articoli: ["Art. 1559 C.C. (Appalto)", "Art. 1655 C.C. (Prestazione d'opera)", "Art. 1664 C.C. (Obblighi appaltatore)"]
  },

  collaborazione_partnership: {
    normativa: "Codice Civile italiano (artt. 2247-2312) - Società e associazioni",
    tipo: "Contratto di collaborazione o partnership",
    obblighi: [
      "Forma scritta obbligatoria per società di persone",
      "Registrazione presso Camera di Commercio se costituisce società",
      "Patti parasociali devono essere redatti per iscritto",
      "Clausola di non concorrenza deve essere limitata nel tempo e nello spazio"
    ],
    articoli: ["Art. 2247 C.C. (Società semplice)", "Art. 2251 C.C. (Obblighi soci)", "Art. 2268 C.C. (Amministrazione)"]
  },

  licenza_diritti: {
    normativa: "Codice Civile italiano (artt. 1379-1422) - Contratti di licenza e cessione",
    tipo: "Contratto di licenza o cessione di diritti",
    obblighi: [
      "Forma scritta obbligatoria per cessione di diritti d'autore",
      "Registrazione presso SIAE per diritti musicali",
      "Durata della licenza deve essere specificata",
      "Territorio di validità deve essere definito"
    ],
    articoli: ["Art. 1379 C.C. (Cessione di crediti)", "L. 633/1941 (Diritto d'autore)", "Art. 1421 C.C. (Contratti aleatori)"]
  },

  lavoro_determinato: {
    normativa: "D.Lgs. 81/2015 e Codice Civile (artt. 2094-2134) - Contratti di lavoro",
    tipo: "Contratto di lavoro subordinato a tempo determinato",
    obblighi: [
      "Forma scritta obbligatoria (art. 13 D.Lgs. 81/2015)",
      "Comunicazione obbligatoria a INPS entro 24 ore",
      "Durata massima: 24 mesi (36 con proroghe)",
      "Causa giustificativa obbligatoria per la durata determinata"
    ],
    articoli: ["Art. 2094 C.C. (Prestazione di lavoro)", "Art. 2126 C.C. (Durata contratto)", "D.Lgs. 81/2015 art. 19 (Contratti a termine)"]
  },

  stage_tirocinio: {
    normativa: "D.M. 142/1998 e Linee Guida Ministero del Lavoro - Tirocini formativi",
    tipo: "Contratto di stage o tirocinio formativo",
    obblighi: [
      "Forma scritta obbligatoria (D.M. 142/1998)",
      "Registrazione presso Regione o Provincia competente",
      "Durata massima: 6 mesi (12 per disabili)",
      "Rimborso spese obbligatorio (minimo €300/mese per tirocini extra-curriculari)"
    ],
    articoli: ["D.M. 142/1998 (Disciplina tirocini)", "D.Lgs. 81/2015 art. 42 (Tirocini formativi)"]
  },

  autodichiarazione: {
    normativa: "D.P.R. 445/2000 - Dichiarazioni sostitutive e certificazioni",
    tipo: "Autodichiarazione sostitutiva di certificazione",
    obblighi: [
      "Forma scritta obbligatoria",
      "Firma autografa del dichiarante",
      "Data e luogo di sottoscrizione obbligatori",
      "Riferimento normativo che consente l'autodichiarazione"
    ],
    articoli: ["D.P.R. 445/2000 art. 46 (Autocertificazioni)", "D.P.R. 445/2000 art. 47 (Dichiarazioni sostitutive)"]
  },

  lettera_formale: {
    normativa: "Codice Civile (artt. 1333-1340) - Comunicazioni e dichiarazioni",
    tipo: "Lettera formale (PEC o Raccomandata)",
    obblighi: [
      "Forma scritta obbligatoria",
      "Data certa per raccomandate (data di spedizione)",
      "PEC: data certa automatica al momento dell'invio",
      "Oggetto chiaro e specifico obbligatorio"
    ],
    articoli: ["Art. 1333 C.C. (Comunicazioni)", "Art. 1335 C.C. (Data certa)", "D.Lgs. 82/2005 (Codice dell'Amministrazione Digitale)"]
  },

  dgue: {
    normativa: "D.Lgs. 36/2023 (Codice dei Contratti Pubblici) - Gare pubbliche",
    tipo: "Dichiarazione Generale Unica Europea (DGUE) per gare pubbliche",
    obblighi: [
      "Forma scritta obbligatoria",
      "Firma digitale o autografa del rappresentante legale",
      "Allegazione documentazione richiesta dal bando",
      "Validità temporale: 12 mesi dalla sottoscrizione"
    ],
    articoli: ["D.Lgs. 36/2023 art. 80 (Criteri di esclusione)", "D.Lgs. 36/2023 art. 83 (Documentazione)", "D.Lgs. 36/2023 art. 94 (Soggetti Art. 94)"]
  },
};

// 📋 Strutture documento formali
const DOCUMENT_TEMPLATES = {
  contratto_affitto: `
CONTRATTO DI LOCAZIONE AD USO [ABITATIVO/COMMERCIALE]
(ai sensi degli artt. 1571 e ss. del Codice Civile)

TRA

Il/La Sig./Sig.ra [LOCATORE_NOME], nato/a a [LOCATORE_LUOGO_NASCITA] il [LOCATORE_DATA_NASCITA],
Codice Fiscale: [LOCATORE_CF], residente in [LOCATORE_INDIRIZZO]
(di seguito "Locatore")

E

Il/La Sig./Sig.ra [LOCATARIO_NOME], nato/a a [LOCATARIO_LUOGO_NASCITA] il [LOCATARIO_DATA_NASCITA],
Codice Fiscale: [LOCATARIO_CF], residente in [LOCATARIO_INDIRIZZO]
(di seguito "Locatario")

PREMESSO CHE

- Il Locatore è proprietario dell'immobile sito in [IMMOBILE_INDIRIZZO], [IMMOBILE_CITTA] ([IMMOBILE_PROVINCIA]), CAP [IMMOBILE_CAP];
- Il Locatario è interessato alla locazione dell'immobile per uso [ABITATIVO/COMMERCIALE];
- Le parti intendono regolare i loro rapporti secondo quanto previsto dal Codice Civile;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto della locazione
Il Locatore concede in locazione al Locatario l'immobile sopra indicato, consistente in [DESCRIZIONE_IMMOBILE], per uso [ABITATIVO/COMMERCIALE], ai sensi dell'art. 1571 del Codice Civile.

Art. 2 - Durata
La locazione ha durata di [DURATA_MESI] mesi a decorrere dal [DATA_INIZIO], ai sensi dell'art. 1573 del Codice Civile.

Art. 3 - Canone
Il canone mensile è fissato in Euro [CANONE_IMPORTO], da versare entro il giorno [GG] di ogni mese, mediante [MODALITA_PAGAMENTO], ai sensi dell'art. 1577 del Codice Civile.

Art. 4 - Deposito cauzionale
Il Locatario versa a titolo di deposito cauzionale la somma di Euro [DEPOSITO], che sarà restituita al termine del contratto, previa verifica dello stato dell'immobile.

Art. 5 - Obblighi del Locatore
Il Locatore si obbliga a:
a) Consegnare l'immobile in buono stato di manutenzione;
b) Eseguire le riparazioni necessarie per la conservazione dell'immobile;
c) Garantire il pacifico godimento dell'immobile.

Art. 6 - Obblighi del Locatario
Il Locatario si obbliga a:
a) Pagare il canone nei termini stabiliti;
b) Usare l'immobile con la diligenza del buon padre di famiglia;
c) Eseguire le riparazioni di manutenzione ordinaria;
d) Restituire l'immobile al termine del contratto nello stato in cui lo ha ricevuto.

Art. 7 - Spese
Le spese per utenze (luce, gas, acqua, riscaldamento) sono a carico del Locatario. Le spese condominiali sono ripartite secondo le tabelle millesimali.

Art. 8 - Recesso
Ciascuna parte può recedere dal contratto con preavviso di [MESI_PREAVVISO] mesi, mediante comunicazione scritta.

Art. 9 - Registrazione
Il presente contratto sarà registrato presso l'Agenzia delle Entrate entro 30 giorni dalla stipula, a cura del [LOCATORE/LOCATARIO], ai sensi dell'art. 5 del D.P.R. 131/1986.

Art. 10 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del Codice Civile in materia di locazione.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_STIPULA], [DATA_STIPULA]

_______________________        _______________________
Firma Locatore                  Firma Locatario
`,

  prestito_privati: `
CONTRATTO DI MUTUO TRA PRIVATI
(ai sensi degli artt. 1813 e ss. del Codice Civile)

TRA

Il/La Sig./Sig.ra [PRESTATORE_NOME], nato/a a [PRESTATORE_LUOGO_NASCITA] il [PRESTATORE_DATA_NASCITA],
Codice Fiscale: [PRESTATORE_CF], residente in [PRESTATORE_INDIRIZZO]
(di seguito "Prestatore")

E

Il/La Sig./Sig.ra [BENEFICIARIO_NOME], nato/a a [BENEFICIARIO_LUOGO_NASCITA] il [BENEFICIARIO_DATA_NASCITA],
Codice Fiscale: [BENEFICIARIO_CF], residente in [BENEFICIARIO_INDIRIZZO]
(di seguito "Mutuatario")

PREMESSO CHE

- Il Prestatore intende concedere un prestito al Mutuatario;
- Il Mutuatario necessita della somma per [MOTIVO_PRESTITO];
- Le parti intendono regolare i loro rapporti secondo quanto previsto dal Codice Civile;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto del mutuo
Il Prestatore concede in prestito al Mutuatario la somma di Euro [IMPORTO], ai sensi dell'art. 1813 del Codice Civile.

Art. 2 - Erogazione
La somma sarà erogata il [DATA_EROGAZIONE] mediante [METODO_PAGAMENTO], come da art. 1814 del Codice Civile.

Art. 3 - Interessi
[TASSO_INTERESSE_DESCRIZIONE]. Il tasso di interesse è fissato in [TASSO]% annuo, calcolato su base annua, ai sensi dell'art. 1815 del Codice Civile.

Art. 4 - Restituzione
Il Mutuatario si obbliga a restituire la somma ricevuta entro il [DATA_RESTITUZIONE], mediante [MODALITA_RESTITUZIONE], come previsto dall'art. 1814 del Codice Civile.

Art. 5 - Garanzie
[GARANZIE_DESCRIZIONE]. Le garanzie prestate sono a titolo di [TIPO_GARANZIA].

Art. 6 - Recesso anticipato
[CLAUSOLA_RISOLUZIONE]. In caso di recesso anticipato, il Mutuatario dovrà corrispondere gli interessi maturati fino alla data di restituzione.

Art. 7 - Inadempimento
In caso di mancato pagamento delle rate o della restituzione alla scadenza, il Mutuatario sarà tenuto al pagamento degli interessi di mora nella misura del [TASSO_MORA]% annuo, oltre agli interessi convenzionali.

Art. 8 - Registrazione
Se l'importo supera Euro 3.000, il presente contratto sarà registrato presso l'Agenzia delle Entrate, a cura del [PRESTATORE/MUTUATARIO].

Art. 9 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del Codice Civile in materia di mutuo.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_STIPULA], [DATA_STIPULA]

_______________________        _______________________
Firma Prestatore                Firma Mutuatario
`,

  vendita_privata: `
CONTRATTO DI COMPRAVENDITA
(ai sensi degli artt. 1470 e ss. del Codice Civile)

TRA

Il/La Sig./Sig.ra [VENDITORE_NOME], nato/a a [VENDITORE_LUOGO_NASCITA] il [VENDITORE_DATA_NASCITA],
Codice Fiscale/Partita IVA: [VENDITORE_CF], residente in [VENDITORE_INDIRIZZO]
(di seguito "Venditore")

E

Il/La Sig./Sig.ra [COMPRATORE_NOME], nato/a a [COMPRATORE_LUOGO_NASCITA] il [COMPRATORE_DATA_NASCITA],
Codice Fiscale: [COMPRATORE_CF], residente in [COMPRATORE_INDIRIZZO]
(di seguito "Compratore")

PREMESSO CHE

- Il Venditore è proprietario del bene oggetto della vendita;
- Il Compratore è interessato all'acquisto del bene;
- Le parti intendono regolare i loro rapporti secondo quanto previsto dal Codice Civile;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto della vendita
Il Venditore trasferisce in proprietà al Compratore il seguente bene: [DESCRIZIONE_BENE], ai sensi dell'art. 1470 del Codice Civile.

Art. 2 - Prezzo
Il prezzo di vendita è fissato in Euro [PREZZO], da corrispondere mediante [MODALITA_PAGAMENTO], come previsto dall'art. 1477 del Codice Civile.

Art. 3 - Acconto
[ACCONTO_DESCRIZIONE]. L'acconto di Euro [ACCONTO_IMPORTO] è stato versato alla stipula del presente contratto.

Art. 4 - Consegna
Il bene sarà consegnato al Compratore entro il [DATA_CONSEGNA], presso [LUOGO_CONSEGNA], ai sensi dell'art. 1510 del Codice Civile.

Art. 5 - Garanzia per vizi
Il Venditore garantisce che il bene è esente da vizi occulti che ne diminuiscano l'idoneità all'uso o ne riducano il valore, ai sensi dell'art. 1490 del Codice Civile. [VISTO_PIACIUTO_DESCRIZIONE]

Art. 6 - Garanzia legale
[GARANZIA_DESCRIZIONE]. La garanzia ha durata di [DURATA_GARANZIA] mesi dalla data di consegna.

Art. 7 - Recesso
[CLAUSOLA_RECESSO]. Il diritto di recesso può essere esercitato entro [TERMINE_RECESSO] giorni dalla consegna.

Art. 8 - Registrazione
Per i beni immobili, il presente contratto sarà registrato presso l'Agenzia delle Entrate entro 20 giorni dalla stipula, a cura del [VENDITORE/COMPRATORE].

Art. 9 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del Codice Civile in materia di compravendita.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_DATA_STIPULA]

_______________________        _______________________
Firma Venditore                 Firma Compratore
`,

  fornitura_servizi: `
CONTRATTO DI FORNITURA DI BENI / SERVIZI
(ai sensi degli artt. 1559 e ss. del Codice Civile)

TRA

Il/La Sig./Sig.ra [FORNITORE_NOME], con sede in [FORNITORE_INDIRIZZO],
Codice Fiscale/Partita IVA: [FORNITORE_CF]
(di seguito "Fornitore")

E

Il/La Sig./Sig.ra [CLIENTE_NOME], con sede in [CLIENTE_INDIRIZZO],
Codice Fiscale/Partita IVA: [CLIENTE_CF]
(di seguito "Cliente")

PREMESSO CHE

- Il Fornitore è in grado di fornire [OGGETTO_FORNITURA];
- Il Cliente necessita della fornitura per [MOTIVO];
- Le parti intendono regolare i loro rapporti secondo quanto previsto dal Codice Civile;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto del contratto
Il Fornitore si obbliga a fornire al Cliente [OGGETTO_FORNITURA], ai sensi dell'art. 1559 del Codice Civile.

Art. 2 - Durata
La fornitura ha durata di [DURATA], a decorrere dal [DATA_INIZIO], come previsto dall'art. 1559 del Codice Civile.

Art. 3 - Prezzo
Il prezzo totale è fissato in Euro [PREZZO_TOTALE], da corrispondere mediante [MODALITA_PAGAMENTO], ai sensi dell'art. 1559 del Codice Civile.

Art. 4 - Termini di consegna/esecuzione
[TERMINI_CONSEGNA]. La consegna/esecuzione avverrà secondo le modalità specificate nell'allegato A.

Art. 5 - Penali
[PENALI_DESCRIZIONE]. In caso di inadempimento, la parte inadempiente pagherà una penale di Euro [IMPORTO_PENALE] per ogni giorno di ritardo.

Art. 6 - Clausola di non concorrenza
[CLAUSOLA_NON_CONCORRENZA]. La clausola ha durata di [DURATA_NON_CONCORRENZA] mesi dal termine del contratto.

Art. 7 - Recesso
Ciascuna parte può recedere dal contratto con preavviso di [MESI_PREAVVISO] mesi, mediante comunicazione scritta.

Art. 8 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del Codice Civile in materia di appalto e prestazione d'opera.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_DATA]

_______________________        _______________________
Firma Fornitore                 Firma Cliente
`,

  collaborazione_partnership: `
CONTRATTO DI COLLABORAZIONE / PARTNERSHIP
(ai sensi degli artt. 2247 e ss. del Codice Civile)

TRA

Il/La Sig./Sig.ra [PARTE_A_NOME], con sede in [PARTE_A_INDIRIZZO],
Codice Fiscale/Partita IVA: [PARTE_A_CF]
(di seguito "Parte A")

E

Il/La Sig./Sig.ra [PARTE_B_NOME], con sede in [PARTE_B_INDIRIZZO],
Codice Fiscale/Partita IVA: [PARTE_B_CF]
(di seguito "Parte B")

PREMESSO CHE

- Le parti intendono collaborare per [OGGETTO];
- La collaborazione si basa su principi di mutua fiducia e trasparenza;
- Le parti intendono regolare i loro rapporti secondo quanto previsto dal Codice Civile;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto della collaborazione
Le parti si impegnano a collaborare per [OGGETTO], ai sensi dell'art. 2247 del Codice Civile.

Art. 2 - Durata
La collaborazione ha durata di [DURATA], a decorrere dal [DATA_INIZIO], come previsto dall'art. 2247 del Codice Civile.

Art. 3 - Obblighi delle parti
[OBBLIGHI]. Ciascuna parte si impegna a collaborare con la massima diligenza per il raggiungimento degli obiettivi comuni.

Art. 4 - Ripartizione dei profitti
[RIPARTIZIONE_PROFITTI]. I profitti derivanti dalla collaborazione saranno ripartiti secondo le quote stabilite: Parte A [%], Parte B [%].

Art. 5 - Clausola di non concorrenza
[CLAUSOLA_NON_CONCORRENZA]. La clausola ha durata di [DURATA_NON_CONCORRENZA] mesi dal termine del contratto e si estende al territorio [TERRITORIO].

Art. 6 - Proprietà dei risultati
[PROPRIETA_RISULTATI]. I risultati, prodotti e diritti derivanti dalla collaborazione appartengono [DESCRIZIONE_PROPRIETA].

Art. 7 - Recesso anticipato
[RECESSO_ANTICIPATO]. Ciascuna parte può recedere dal contratto con preavviso di [MESI_PREAVVISO] mesi, mediante comunicazione scritta.

Art. 8 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del Codice Civile in materia di società e associazioni.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_DATA]

_______________________        _______________________
Firma Parte A                   Firma Parte B
`,

  licenza_diritti: `
CONTRATTO DI LICENZA / CESSIONE DI DIRITTI
(ai sensi degli artt. 1379 e ss. del Codice Civile e L. 633/1941)

TRA

Il/La Sig./Sig.ra [LICENZIANTE], con sede in [LICENZIANTE_INDIRIZZO],
Codice Fiscale/Partita IVA: [LICENZIANTE_CF]
(di seguito "Licenziante")

E

Il/La Sig./Sig.ra [LICENZIATARIO], con sede in [LICENZIATARIO_INDIRIZZO],
Codice Fiscale/Partita IVA: [LICENZIATARIO_CF]
(di seguito "Licenziatario")

PREMESSO CHE

- Il Licenziante è titolare dei diritti su [NATURA_DIRITTO];
- Il Licenziatario è interessato all'utilizzo dei diritti;
- Le parti intendono regolare i loro rapporti secondo quanto previsto dalla normativa vigente;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto della licenza
Il Licenziante concede al Licenziatario il diritto di [NATURA_DIRITTO], ai sensi dell'art. 1379 del Codice Civile e della L. 633/1941.

Art. 2 - Esclusività
La licenza è [ESCLUSIVA/NON ESCLUSIVA]. [DESCRIZIONE_ESCLUSIVITA]

Art. 3 - Durata
La licenza ha durata di [DURATA], a decorrere dal [DATA_INIZIO], come previsto dalla L. 633/1941.

Art. 4 - Compenso
Il compenso per la licenza è fissato in [COMPENSO], da corrispondere mediante [MODALITA_PAGAMENTO], ai sensi dell'art. 1379 del Codice Civile.

Art. 5 - Territorio
La licenza è valida per il territorio [TERRITORIO]. L'utilizzo al di fuori del territorio indicato è vietato.

Art. 6 - Rinnovo
[RINNOVO_ANTICIPATO]. Il contratto può essere rinnovato mediante accordo scritto tra le parti.

Art. 7 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del Codice Civile e della L. 633/1941 in materia di diritti d'autore e proprietà intellettuale.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_DATA]

_______________________        _______________________
Firma Licenziante               Firma Licenziatario
`,

  lavoro_determinato: `
CONTRATTO DI LAVORO SUBORDINATO A TEMPO DETERMINATO
(ai sensi del D.Lgs. 81/2015 e artt. 2094 e ss. del Codice Civile)

TRA

Il/La Sig./Sig.ra [DATORE_NOME], con sede in [DATORE_INDIRIZZO],
Codice Fiscale/Partita IVA: [DATORE_CF]
(di seguito "Datore di Lavoro")

E

Il/La Sig./Sig.ra [LAVORATORE_NOME], nato/a a [LAVORATORE_LUOGO_NASCITA] il [LAVORATORE_DATA_NASCITA],
Codice Fiscale: [LAVORATORE_CF], residente in [LAVORATORE_INDIRIZZO]
(di seguito "Lavoratore")

PREMESSO CHE

- Il Datore di Lavoro necessita di personale per [MOTIVO];
- Il Lavoratore è disponibile a prestare la propria attività lavorativa;
- Le parti intendono regolare i loro rapporti secondo quanto previsto dalla normativa vigente;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto del contratto
Il Datore di Lavoro assume il Lavoratore per lo svolgimento delle seguenti mansioni: [MANSIONE], ai sensi dell'art. 2094 del Codice Civile e del D.Lgs. 81/2015.

Art. 2 - Durata
Il contratto ha durata determinata dal [DATA_INIZIO] al [DATA_FINE], per un totale di [DURATA_MESI] mesi, come previsto dall'art. 19 del D.Lgs. 81/2015.

Art. 3 - Causa giustificativa
La durata determinata è giustificata da [CAUSA_GIUSTIFICATIVA], ai sensi dell'art. 19 comma 2 del D.Lgs. 81/2015.

Art. 4 - Retribuzione
La retribuzione mensile lorda è fissata in Euro [RETRIBUZIONE_MENSILE], da corrispondere entro il giorno [GG] di ogni mese, mediante accredito su conto corrente.

Art. 5 - Orario di lavoro
L'orario di lavoro settimanale è di [ORARIO_LAVORO] ore, distribuite secondo il seguente calendario: [CALENDARIO_LAVORO].

Art. 6 - Periodo di prova
[PERIODO_PROVA_DESCRIZIONE]. Il periodo di prova ha durata di [DURATA_PROVA] giorni, durante il quale ciascuna parte può recedere senza preavviso.

Art. 7 - Benefit
[BENEFIT_DESCRIZIONE]. Il Lavoratore ha diritto ai seguenti benefit: [ELENCO_BENEFIT].

Art. 8 - Clausola di riservatezza
[CLAUSOLA_RISERVATEZZA]. Il Lavoratore si impegna a mantenere la massima riservatezza su informazioni aziendali.

Art. 9 - Comunicazione INPS
Il presente contratto sarà comunicato all'INPS entro 24 ore dalla stipula, a cura del Datore di Lavoro, ai sensi dell'art. 8 del D.Lgs. 151/2015.

Art. 10 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del D.Lgs. 81/2015, del Codice Civile e dei contratti collettivi nazionali di lavoro applicabili.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_DATA]

_______________________        _______________________
Firma Datore di Lavoro          Firma Lavoratore
`,

  stage_tirocinio: `
CONTRATTO DI STAGE / TIROCINIO FORMATIVO
(ai sensi del D.M. 142/1998 e D.Lgs. 81/2015)

TRA

L'Ente [ENTE_OSPITANTE], con sede in [ENTE_INDIRIZZO],
Codice Fiscale/Partita IVA: [ENTE_CF]
(di seguito "Ente Ospitante")

E

Il/La Sig./Sig.ra [TIROCINANTE_NOME], nato/a a [TIROCINANTE_LUOGO_NASCITA] il [TIROCINANTE_DATA_NASCITA],
Codice Fiscale: [TIROCINANTE_CF], residente in [TIROCINANTE_INDIRIZZO]
(di seguito "Tirocinante")

PREMESSO CHE

- L'Ente Ospitante è disponibile ad accogliere il Tirocinante per attività formativa;
- Il Tirocinante è interessato a svolgere un tirocinio formativo presso l'Ente;
- Le parti intendono regolare i loro rapporti secondo quanto previsto dalla normativa vigente;

SI CONVIENE E STIPULA QUANTO SEGUE:

Art. 1 - Oggetto del tirocinio
L'Ente Ospitante accoglie il Tirocinante per lo svolgimento di attività formativa finalizzata a [OBIETTIVI], ai sensi del D.M. 142/1998.

Art. 2 - Durata
Il tirocinio ha durata di [DURATA_MESI] mesi, dal [DATA_INIZIO] al [DATA_FINE], come previsto dal D.M. 142/1998.

Art. 3 - Sede
Il tirocinio si svolgerà presso la sede dell'Ente Ospitante in [SEDE], ai sensi dell'art. 3 del D.M. 142/1998.

Art. 4 - Obiettivi formativi
Gli obiettivi formativi del tirocinio sono i seguenti: [OBIETTIVI]. Il tirocinio è finalizzato all'acquisizione di competenze professionali nel settore [SETTORE].

Art. 5 - Rimborso spese
[RIMBORSO_DESCRIZIONE]. L'Ente Ospitante corrisponde al Tirocinante un rimborso spese mensile di Euro [IMPORTO_RIMBORSO], ai sensi dell'art. 4 del D.M. 142/1998.

Art. 6 - Tutor
Il Tutor Aziendale è il Sig./Sig.ra [TUTOR_AZIENDALE]. [TUTOR_FORMATIVO_DESCRIZIONE]

Art. 7 - Registrazione
Il presente contratto sarà registrato presso [REGIONE/PROVINCIA] competente, a cura dell'Ente Ospitante, entro [TERMINE] giorni dalla stipula.

Art. 8 - Disposizioni finali
Per quanto non previsto nel presente contratto, si applicano le disposizioni del D.M. 142/1998 e delle Linee Guida del Ministero del Lavoro in materia di tirocini formativi.

Letto, confermato e sottoscritto.

Luogo e data: [LUOGO_DATA]

_______________________        _______________________
Firma Ente Ospitante            Firma Tirocinante
`,

  autodichiarazione: `
AUTODICHIARAZIONE SOSTITUTIVA DI CERTIFICAZIONE
(ai sensi degli artt. 46 e 47 del D.P.R. 445/2000)

Il/La sottoscritto/a [DICHIARANTE_NOME], nato/a a [LUOGO_NASCITA] il [DATA_NASCITA],
Codice Fiscale: [CODICE_FISCALE],
residente in [INDIRIZZO]

DICHIARA SOTTO LA PROPRIA RESPONSABILITÀ

[OGGETTO]

RIFERIMENTI NORMATIVI:
[RIFERIMENTI_NORMATIVI]

Ai sensi degli artt. 46 e 47 del D.P.R. 445/2000, dichiaro che:
- Le informazioni fornite corrispondono a verità;
- Sono consapevole che dichiarazioni mendaci comportano responsabilità penale;
- Sono a conoscenza che l'Amministrazione può verificare la veridicità delle dichiarazioni.

Data e luogo: [LUOGO_DATA]

_______________________
Firma del Dichiarante
`,

  lettera_formale: `
LETTERA FORMALE
[PEC / RACCOMANDATA]

[MITTENTE]
[INDIRIZZO_MITTENTE]
Codice Fiscale/Partita IVA: [CF_MITTENTE]
PEC: [PEC_MITTENTE]

A

[DESTINATARIO]
[INDIRIZZO_DESTINATARIO]
PEC: [PEC_DESTINATARIO]

Oggetto: [OGGETTO]

Spett.le [DESTINATARIO],

[TESTO]

[ALLEGATI_DESCRIZIONE]

In attesa di un cortese riscontro, si porgono cordiali saluti.

Luogo e data: [LUOGO_DATA]

_______________________
Firma [MITTENTE]
`,

  dgue: `
DICHIARAZIONE GENERALE UNICA EUROPEA (DGUE)
per la partecipazione a procedure di affidamento di contratti pubblici
(ai sensi del D.Lgs. 36/2023 - Codice dei Contratti Pubblici)

L'azienda [AZIENDA_NOME], con sede legale in [AZIENDA_INDIRIZZO],
Codice Fiscale/Partita IVA: [AZIENDA_CF],
rappresentata legalmente dal Sig./Sig.ra [RAPPRESENTANTE_LEGALE],
nato/a a [RAPPRESENTANTE_LUOGO_NASCITA] il [RAPPRESENTANTE_DATA_NASCITA],
Codice Fiscale: [RAPPRESENTANTE_CF],

DICHIARA

di essere interessata a partecipare alla procedura di affidamento identificata con il seguente riferimento:
[RIFERIMENTO_GARA]

DOCUMENTAZIONE ALLEGATA:
[DOCUMENTAZIONE]

DICHIARAZIONI AGGIUNTIVE:
[DICHIARAZIONI_AGGIUNTIVE]

Ai sensi dell'art. 80 del D.Lgs. 36/2023, dichiaro che:
- Non ricorro in alcuna delle cause di esclusione previste dall'art. 80;
- Possiedo i requisiti di idoneità tecnica, professionale ed economica richiesti;
- Non sono in stato di fallimento, liquidazione o amministrazione controllata;
- Non ho riportato condanne per reati in materia di corruzione, frode o riciclaggio;
- Rispetto gli obblighi in materia di pagamento dei contributi previdenziali e assistenziali;
- Rispetto gli obblighi in materia fiscale;
- Non sono soggetto a procedure concorsuali;
- Non sono stato escluso da procedure di affidamento per gravi inadempienze contrattuali.

Ai sensi dell'art. 94 del D.Lgs. 36/2023, dichiaro inoltre:
- [DICHIARAZIONE_SOGGETTI_ART_94]

La presente dichiarazione ha validità di 12 mesi dalla data di sottoscrizione.

Data e luogo: [LUOGO_DATA]

_______________________
Firma del Rappresentante Legale
`,

};

// 🎯 Funzione principale
export function buildDocumentPrompt(documentType, answers, schema) {
  const context = DOCUMENT_CONTEXTS[documentType.id];
  const template = DOCUMENT_TEMPLATES[documentType.id];

  // Prepara dati formattati per il template
  const formattedAnswers = formatAnswersForTemplate(answers, schema);

  // Identifica campi mancanti
  const missingFields = [];
  if (schema && schema.fields) {
    schema.fields.forEach(field => {
      if (field.required && !answers[field.id]) {
        missingFields.push(field.id);
      }
    });
  }

  // Se non c'è template specifico, usa fallback generico
  if (!context || !template) {
    return buildGenericPrompt(documentType, answers, missingFields);
  }

  // Costruisci il prompt semplificato e preciso
  let prompt = `Sei un esperto legale che genera contratti italiani perfetti.

REGOLE CRITICHE:
1. USA ESATTAMENTE i dati forniti dall'utente - NON inventare nulla
2. Se un dato NON è fornito, scrivi: [DA COMPLETARE: nome_campo]
3. Usa il genere corretto: se sesso=F usa "La Sig.ra", se sesso=M usa "Il Sig."
4. NON aggiungere valori di default o esempi
5. Mantieni la struttura legale formale italiana

DATI FORNITI DALL'UTENTE:
${Object.entries(formattedAnswers).map(([key, value]) => `${key}: ${value || '[NON FORNITO]'}`).join('\n')}

${missingFields.length > 0 ? `\n⚠️ CAMPI MANCANTI (usa [DA COMPLETARE: nome_campo]):\n${missingFields.map(f => `- ${f}`).join('\n')}\n` : ''}

TIPO DOCUMENTO: ${documentType.name}

RIFERIMENTI NORMATIVI:
${context.normativa}

ARTICOLI DI LEGGE RILEVANTI:
${context.articoli.map(a => `- ${a}`).join('\n')}

STRUTTURA DOCUMENTO DA SEGUIRE:
${template}

GENERA IL CONTRATTO:
- Usa SOLO i dati forniti sopra
- Per campi mancanti usa [DA COMPLETARE: nome_campo]
- Rispetta la normativa italiana del Codice Civile
- Usa articoli di legge appropriati
- Usa il genere corretto basato sul campo "sesso" (M=Il Sig., F=La Sig.ra)

${documentType.id === 'contratto_affitto' ? `CLAUSOLE DA INSERIRE NEL CONTRATTO (se fornite):
${answers.clausole_animali ? `- Animali domestici: ${answers.clausole_animali === 'si' ? 'consentiti' : answers.clausole_animali === 'no' ? 'vietati' : 'consentiti previo consenso scritto del locatore'}` : ''}
${answers.clausole_subaffitto ? `- Subaffitto: ${answers.clausole_subaffitto === 'si' ? 'consentito' : answers.clausole_subaffitto === 'no' ? 'vietato' : 'consentito previo consenso scritto del locatore'}` : ''}
${answers.clausole_modifiche ? `- Modifiche strutturali: ${answers.clausole_modifiche === 'vietate' ? 'vietate' : answers.clausole_modifiche === 'previo_consenso' ? 'consentite solo previo consenso scritto del locatore' : 'consentite solo modifiche non strutturali'}` : ''}
${answers.clausole_custom ? `- Clausole personalizzate: ${answers.clausole_custom}` : ''}

IMPORTANTE: Inserisci queste clausole nell'Art. 6 (Obblighi del Locatario) o crea un nuovo Art. 11 dedicato alle clausole speciali.
` : ''}

Inizia subito con il contratto senza preamble:`;

  return prompt;
}

// 🔧 Funzione helper per formattare le risposte
function formatAnswersForTemplate(answers, schema) {
  const formatted = { ...answers };
  
  // Aggiungi informazioni derivate se necessario
  if (schema && schema.fields) {
    schema.fields.forEach(field => {
      // Gestisci campi condizionali
      if (field.dependsOn && answers[field.dependsOn.field] !== field.dependsOn.value) {
        // Campo non visibile, non includerlo
      }
    });
  }
  
  return formatted;
}

// 🔄 Fallback per documenti senza template specifico
function buildGenericPrompt(documentType, answers, missingFields) {
  let prompt = `Sei un esperto legale che genera contratti italiani perfetti.

REGOLE CRITICHE:
1. USA ESATTAMENTE i dati forniti dall'utente - NON inventare nulla
2. Se un dato NON è fornito, scrivi: [DA COMPLETARE: nome_campo]
3. Usa il genere corretto: se sesso=F usa "La Sig.ra", se sesso=M usa "Il Sig."
4. NON aggiungere valori di default o esempi
5. Mantieni la struttura legale formale italiana

DATI FORNITI DALL'UTENTE:
${Object.entries(answers).map(([key, value]) => `${key}: ${value || '[NON FORNITO]'}`).join('\n')}

${missingFields.length > 0 ? `\n⚠️ CAMPI MANCANTI (usa [DA COMPLETARE: nome_campo]):\n${missingFields.map(f => `- ${f}`).join('\n')}\n` : ''}

TIPO DOCUMENTO: ${documentType.name}

GENERA IL CONTRATTO:
- Usa SOLO i dati forniti sopra
- Per campi mancanti usa [DA COMPLETARE: nome_campo]
- Rispetta la normativa italiana del Codice Civile
- Usa articoli di legge appropriati

${documentType.id === 'contratto_affitto' ? `CLAUSOLE DA INSERIRE NEL CONTRATTO (se fornite):
${answers.clausole_animali ? `- Animali domestici: ${answers.clausole_animali === 'si' ? 'consentiti' : answers.clausole_animali === 'no' ? 'vietati' : 'consentiti previo consenso scritto del locatore'}` : ''}
${answers.clausole_subaffitto ? `- Subaffitto: ${answers.clausole_subaffitto === 'si' ? 'consentito' : answers.clausole_subaffitto === 'no' ? 'vietato' : 'consentito previo consenso scritto del locatore'}` : ''}
${answers.clausole_modifiche ? `- Modifiche strutturali: ${answers.clausole_modifiche === 'vietate' ? 'vietate' : answers.clausole_modifiche === 'previo_consenso' ? 'consentite solo previo consenso scritto del locatore' : 'consentite solo modifiche non strutturali'}` : ''}
${answers.clausole_custom ? `- Clausole personalizzate: ${answers.clausole_custom}` : ''}

IMPORTANTE: Inserisci queste clausole nell'Art. 6 (Obblighi del Locatario) o crea un nuovo Art. 11 dedicato alle clausole speciali.
` : ''}

Inizia subito con il contratto senza preamble:`;

  return prompt;
}

