(function () {
  const body = document.body;
  const rootPath = body.dataset.rootPath || "";
  const pageKey = body.dataset.page || "start";
  const defaultPrimary = body.dataset.defaultPrimary || "#F04A3A";
  const defaultAccent = body.dataset.defaultAccent || "#0F9D9A";
  const STORAGE_KEY = "happyrav_v4_state";
  const STORAGE_PROFILE_KEY = "happyrav_v4_adv_profile";
  const STORAGE_TELOS_KEY = "happyrav_v4_telos";
  const TELOS_IDS = ["career_goal", "work_environment", "values", "strengths", "motivators", "success_vision", "work_style", "impact"];

  const STEP_ORDER = ["start", "upload", "questions", "review", "result"];
  const STEP_PROGRESS = {
    start: 0,
    upload: 25,
    questions: 50,
    review: 75,
    result: 100,
  };

  const I18N = {
    en: {
      "page.title": "happyRAV · Application Wizard",
      "hero.description": "Document-first ATS flow. Upload CV, cover letters, Arbeitszeugnisse, certificates, and supporting docs.",
      "hero.sub": "Five focused steps from job ad to tailored PDFs.",

      "progress.start": "Start",
      "progress.upload": "Upload",
      "progress.questions": "Questions",
      "progress.review": "Review",
      "progress.result": "Result",
      "progress.step_of": "Step {current} of {total}",

      "start.title": "Start your application",
      "start.sub": "Enter the job ad and basic info. happyRAV will guide you through the rest.",
      "start.what_you_need": "What you'll need",
      "start.need_job_ad": "Job ad text",
      "start.need_contact": "Contact details",
      "start.need_cv": "Existing CV / cover letter",
      "start.need_docs": "Arbeitszeugnisse/certificates (recommended)",
      "start.auto_start": "Session starts automatically when you enter input.",

      "questions.title": "Questions",
      "questions.sub": "Answer required gaps to complete your profile.",
      "review.title": "Review + Generate",
      "review.sub": "Choose template and colors, review match score, then generate your PDFs.",
      "review.no_score": "No review score yet.",

      "upload.page_title": "Upload your documents",
      "upload.title": "Upload Documents",
      "upload.supported": "Supported: PDF, DOCX, PNG, JPG, JPEG, WEBP. Max 20 files/session, 12MB/file, 25MB/session.",
      "upload.photo": "Profile photo (optional)",
      "upload.documents": "Documents",
      "upload.quick_tag": "Quick tag default",

      "upload.paste_toggle": "Or paste CV text directly",
      "upload.paste_label": "CV / document text",
      "upload.paste_placeholder": "Paste your CV content, work experience, education, skills...",
      "upload.paste_tag": "Document type",
      "action.paste_submit": "Submit pasted text",
      "notify.paste_submitted": "Pasted text submitted.",

      "action.upload": "Upload documents",
      "action.upload_photo": "Upload photo",
      "action.choose_files": "Choose files",
      "action.extract_refresh": "Re-extract + refresh questions",
      "action.start_session": "Start happyRAV session",
      "action.refresh_session": "Refresh session state",
      "action.save_answers": "Save answers + refresh",
      "action.clear_session": "Clear session",
      "action.generate": "Generate CV + Cover Letter",
      "action.continue_upload": "Continue to Upload",
      "action.continue_questions": "Continue to Questions",
      "action.continue_review": "Continue to Review",
      "action.back_start": "Back to Start",
      "action.back_upload": "Back to Upload",
      "action.back_questions": "Back to Questions",
      "action.back_review": "Back to Review",
      "action.new_session": "Start New Session",

      "label.company_optional": "Company (optional)",
      "label.position_optional": "Position (optional)",
      "label.consent_required": "Consent (required)",
      "label.job_ad_required": "Job ad text (required)",
      "label.template": "Template",
      "label.primary_color": "Primary color",
      "label.accent_color": "Accent color",
      "label.more_options": "More options",
      "label.border_style": "Border style",
      "label.box_shadow": "Box shadows",
      "label.card_bg": "Card background",
      "label.page_bg": "Page background",
      "label.filename_cv": "CV filename",
      "label.filename_cover": "Cover letter filename",
      "placeholder.filename_cv": "Leave empty for auto (CV_Name_Company.pdf)",
      "placeholder.filename_cover": "Leave empty for auto",
      "style.rounded": "Rounded corners",
      "style.square": "Square corners",
      "style.no_borders": "No borders",
      "label.session_actions": "Session actions",
      "label.tag": "Tag",
      "label.answer": "Answer",
      "placeholder.company": "Company name",
      "placeholder.position": "Position title",
      "placeholder.job_ad": "Paste full job ad text",
      "consent.text": "I confirm provided facts can be processed for generation.",

      "session.none": "No active session.",
      "session.label": "Session",
      "session.expires": "Expires",
      "text.required": "Required",
      "text.optional": "Optional",
      "text.no_documents": "No documents uploaded yet.",
      "text.no_open_questions": "No open questions. Ready for review.",
      "text.required_unresolved": "Required unresolved",
      "text.required_resolved": "All required questions resolved.",
      "text.review_no_score": "No review score yet. Add job ad + extract profile first.",
      "text.review_score": "Review match score",
      "text.ats": "ATS",
      "text.skills": "Skills",
      "text.missing_keywords": "Missing keywords",
      "text.ats_issues": "ATS issues",
      "text.none": "None",
      "text.no_files_selected": "No files selected",
      "text.no_photo_selected": "No photo selected",
      "text.files_selected": "{count} files selected",
      "stats.confidence": "confidence",
      "parse.pdf_text": "PDF text",
      "parse.pdf_text_ocr": "PDF + OCR",
      "parse.docx_text": "DOCX text",
      "parse.ocr_image": "Image OCR",
      "parse.plain_text": "Plain text",

      "tag.auto": "Auto-classify",
      "tag.cv": "CV",
      "tag.cover_letter": "Cover letter",
      "tag.arbeitszeugnis": "Arbeitszeugnis",
      "tag.certificate": "Certificate",
      "tag.other": "Other",
      "label.font_family": "Font family",
      "font.inter": "Inter",
      "font.roboto": "Roboto",
      "font.lato": "Lato",
      "font.georgia": "Georgia",
      "font.source_sans": "Source Sans 3",
      "template.simple": "Simple",
      "template.sophisticated": "Sophisticated",
      "template.friendly": "Friendly",

      "notify.session_started": "Session started.",
      "notify.documents_uploaded": "Documents uploaded.",
      "notify.extraction_refreshed": "Extraction refreshed.",
      "notify.answers_saved": "Answers saved.",
      "notify.files_generated": "Files generated.",
      "notify.session_cleared": "Session cleared.",
      "notify.language_updated": "Language updated.",

      "error.request_failed": "Request failed.",
      "error.action_failed": "Action failed.",
      "error.start_session_first": "Start a session first.",
      "error.select_files_first": "Select files first.",
      "error.required_unresolved": "Required questions unresolved",
      "error.email_failed": "Email failed.",
      "warn.no_api_key": "AI features unavailable: API key not configured on server.",

      "comparison.show": "Show match analysis",
      "comparison.hide": "Hide match analysis",
      "comparison.original": "Original",
      "comparison.optimized": "Optimized for job ad",
      "comparison.loading": "Loading...",
      "comparison.error": "Could not load comparison.",

      "fmt.title": "Optimal input format",
      "fmt.intro": "Use this structure for best results and fewer regenerations:",
      "fmt.date": "Dates: MM/YYYY (e.g. 03/2021). Use ranges: 03/2021\u201306/2024. \"present\" for current.",
      "fmt.role": "Role: exact job title, no abbreviations (e.g. \"Digital Business Manager\", not \"DBM\")",
      "fmt.company": "Company: full legal name (e.g. \"Soprema AG\", not \"Soprema\")",
      "fmt.achievements": "Achievements: one per line, STAR format. Start with action verb. Include metrics.",
      "fmt.achievements_ex": "Example:\nLed national B2C campaign (CHF 500k budget), online/offline mix\nImproved SEO ranking from position 8 to 2 within 6 months\nBuilt CI/CD pipeline, reduced deployment time by 70%",
      "fmt.skills": "Skills: comma separated, specific (e.g. \"Python, SQL, Tableau, Jira\" not \"programming, data\"). Include level in parentheses: Python (Expert), SQL (Advanced), Excel (Basic)",
      "fmt.education": "Education: degree + school + period (e.g. \"MSc Applied Information & Data Science, HSLU, 09/2023\u2013present\")",
      "fmt.tip": "Tip: more specific input = better output. Vague descriptions cost extra regenerations.",
      "fmt.close": "Got it",

      "aria.language_toggle": "Language toggle",
      "aria.switch_en": "Switch to English",
      "aria.switch_de": "Auf Deutsch wechseln",

      "adv.profile_title": "Advanced: Build Profile Manually",
      "adv.telos_title": "Advanced: Career Goals & Values",
      "adv.contact": "Contact",
      "adv.experience": "Experience",
      "adv.education": "Education",
      "adv.references": "References (optional)",
      "adv.name": "Full name",
      "adv.email": "Email",
      "adv.phone": "Phone",
      "adv.location": "Location",
      "adv.linkedin": "LinkedIn",
      "adv.portfolio": "Portfolio",
      "adv.add_experience": "+ Add Experience",
      "adv.add_education": "+ Add Education",
      "adv.remove": "Remove",
      "adv.role": "Role / Title",
      "adv.company": "Company",
      "adv.period": "Period",
      "adv.achievements": "Achievements (STAR method)",
      "adv.degree": "Degree",
      "adv.school": "School / University",
      "adv.export": "Export .txt",
      "adv.import": "Import .txt",
      "adv.ph_name": "Jane Doe",
      "adv.ph_email": "jane@example.com",
      "adv.ph_phone": "+41 79 123 45 67",
      "adv.ph_location": "Zurich, Switzerland",
      "adv.ph_linkedin": "linkedin.com/in/janedoe",
      "adv.ph_portfolio": "janedoe.dev",
      "adv.ph_references": "Dr. Jane Smith | Professor | ETH Zurich | jane@ethz.ch",
      "adv.ph_role": "Senior Engineer",
      "adv.ph_company": "Acme Corp",
      "adv.ph_period": "2020–2024",
      "adv.ph_achievements": "Situation: Team missed deadlines. Task: Stabilize release. Action: Introduced CI/CD. Result: 0 missed deadlines over 18 months.",
      "adv.ph_degree": "MSc Computer Science",
      "adv.ph_school": "ETH Zurich",

      "telos.career_goal": "What are you looking for in your next role?",
      "telos.work_environment": "Describe your ideal work environment",
      "telos.values": "What are your core professional values?",
      "telos.strengths": "What are your 3 main strengths with examples?",
      "telos.motivators": "What motivates you most at work?",
      "telos.success_vision": "What does success look like in this role?",
      "telos.work_style": "How do you prefer to work (autonomous/team)?",
      "telos.impact": "What impact do you want to have?",
      "telos.ph_career_goal": "Lead product engineering in a scale-up with real impact...",
      "telos.ph_work_environment": "Async-first, collaborative, data-driven team...",
      "telos.ph_values": "Ownership, continuous learning, shipping with quality...",
      "telos.ph_strengths": "System design, clear communication, debugging under pressure...",
      "telos.ph_motivators": "Autonomy, mastery, shipping products people use...",
      "telos.ph_success_vision": "Own a feature end-to-end and see user adoption grow...",
      "telos.ph_work_style": "Deep work mornings, collaborative afternoons...",
      "telos.ph_impact": "Help the product reach and serve 100k users...",
    },
    de: {
      "page.title": "happyRAV · Bewerbungs-Wizard",
      "hero.description": "Dokument-zentrierter ATS-Flow. Lade CV, Anschreiben, Arbeitszeugnisse, Zertifikate und weitere Unterlagen hoch.",
      "hero.sub": "Fünf fokussierte Schritte vom Job-Inserat zu massgeschneiderten PDFs.",

      "progress.start": "Start",
      "progress.upload": "Upload",
      "progress.questions": "Fragen",
      "progress.review": "Prüfung",
      "progress.result": "Resultat",
      "progress.step_of": "Schritt {current} von {total}",

      "start.title": "Bewerbung starten",
      "start.sub": "Gib das Job-Inserat und Basisinfos ein. happyRAV führt dich durch den Rest.",
      "start.what_you_need": "Was du brauchst",
      "start.need_job_ad": "Job-Inserat Text",
      "start.need_contact": "Kontaktdaten",
      "start.need_cv": "Bestehender CV / Anschreiben",
      "start.need_docs": "Arbeitszeugnisse/Zertifikate (empfohlen)",
      "start.auto_start": "Sitzung startet automatisch, sobald du Eingaben machst.",

      "questions.title": "Fragen",
      "questions.sub": "Beantworte Pflichtlücken, um dein Profil zu vervollständigen.",
      "review.title": "Prüfung + Generieren",
      "review.sub": "Vorlage und Farben wählen, Match-Score prüfen, dann PDFs generieren.",
      "review.no_score": "Noch kein Review-Score.",

      "upload.page_title": "Dokumente hochladen",
      "upload.title": "Dokumente hochladen",
      "upload.supported": "Unterstützt: PDF, DOCX, PNG, JPG, JPEG, WEBP. Max 20 Dateien/Sitzung, 12MB/Datei, 25MB/Sitzung.",
      "upload.photo": "Profilfoto (optional)",
      "upload.documents": "Dokumente",
      "upload.quick_tag": "Standard-Kategorie",

      "upload.paste_toggle": "Oder CV-Text direkt einfügen",
      "upload.paste_label": "CV / Dokumenttext",
      "upload.paste_placeholder": "CV-Inhalt einfügen: Berufserfahrung, Ausbildung, Skills...",
      "upload.paste_tag": "Dokumenttyp",
      "action.paste_submit": "Text übermitteln",
      "notify.paste_submitted": "Text übermittelt.",

      "action.upload": "Dokumente hochladen",
      "action.upload_photo": "Foto hochladen",
      "action.choose_files": "Dateien wählen",
      "action.extract_refresh": "Neu extrahieren + Fragen aktualisieren",
      "action.start_session": "happyRAV Sitzung starten",
      "action.refresh_session": "Sitzung aktualisieren",
      "action.save_answers": "Antworten speichern + aktualisieren",
      "action.clear_session": "Sitzung löschen",
      "action.generate": "CV + Anschreiben generieren",
      "action.continue_upload": "Weiter zum Upload",
      "action.continue_questions": "Weiter zu Fragen",
      "action.continue_review": "Weiter zur Prüfung",
      "action.back_start": "Zurück zum Start",
      "action.back_upload": "Zurück zum Upload",
      "action.back_questions": "Zurück zu Fragen",
      "action.back_review": "Zurück zur Prüfung",
      "action.new_session": "Neue Sitzung starten",

      "label.company_optional": "Firma (optional)",
      "label.position_optional": "Position (optional)",
      "label.consent_required": "Einwilligung (pflicht)",
      "label.job_ad_required": "Job-Inserat Text (pflicht)",
      "label.template": "Vorlage",
      "label.primary_color": "Primärfarbe",
      "label.accent_color": "Akzentfarbe",
      "label.more_options": "Mehr Optionen",
      "label.border_style": "Rahmenstil",
      "label.box_shadow": "Schatten",
      "label.card_bg": "Karten-Hintergrund",
      "label.page_bg": "Seiten-Hintergrund",
      "label.filename_cv": "CV Dateiname",
      "label.filename_cover": "Anschreiben Dateiname",
      "placeholder.filename_cv": "Leer lassen für automatisch (CV_Name_Firma.pdf)",
      "placeholder.filename_cover": "Leer lassen für automatisch",
      "style.rounded": "Abgerundete Ecken",
      "style.square": "Eckige Ecken",
      "style.no_borders": "Keine Rahmen",
      "label.session_actions": "Sitzungsaktionen",
      "label.tag": "Kategorie",
      "label.answer": "Antwort",
      "placeholder.company": "Firmenname",
      "placeholder.position": "Positionstitel",
      "placeholder.job_ad": "Vollständigen Job-Inseratstext einfügen",
      "consent.text": "Ich bestätige, dass die Fakten für die Generierung verarbeitet werden dürfen.",

      "session.none": "Keine aktive Sitzung.",
      "session.label": "Sitzung",
      "session.expires": "Läuft ab",
      "text.required": "Pflicht",
      "text.optional": "Optional",
      "text.no_documents": "Noch keine Dokumente hochgeladen.",
      "text.no_open_questions": "Keine offenen Fragen. Bereit für Review.",
      "text.required_unresolved": "Pflicht offen",
      "text.required_resolved": "Alle Pflichtfragen sind beantwortet.",
      "text.review_no_score": "Noch kein Review-Score. Erst Job-Inserat + Extraktion ausführen.",
      "text.review_score": "Review-Match-Score",
      "text.ats": "ATS",
      "text.skills": "Skills",
      "text.missing_keywords": "Fehlende Keywords",
      "text.ats_issues": "ATS-Probleme",
      "text.none": "Keine",
      "text.no_files_selected": "Keine Dateien ausgewählt",
      "text.no_photo_selected": "Kein Foto ausgewählt",
      "text.files_selected": "{count} Dateien ausgewählt",
      "stats.confidence": "Sicherheit",
      "parse.pdf_text": "PDF-Text",
      "parse.pdf_text_ocr": "PDF + OCR",
      "parse.docx_text": "DOCX-Text",
      "parse.ocr_image": "Bild-OCR",
      "parse.plain_text": "Klartext",

      "tag.auto": "Automatisch",
      "tag.cv": "CV",
      "tag.cover_letter": "Anschreiben",
      "tag.arbeitszeugnis": "Arbeitszeugnis",
      "tag.certificate": "Zertifikat",
      "tag.other": "Sonstiges",
      "label.font_family": "Schriftart",
      "font.inter": "Inter",
      "font.roboto": "Roboto",
      "font.lato": "Lato",
      "font.georgia": "Georgia",
      "font.source_sans": "Source Sans 3",
      "template.simple": "Einfach",
      "template.sophisticated": "Souverän",
      "template.friendly": "Freundlich",

      "notify.session_started": "Sitzung gestartet.",
      "notify.documents_uploaded": "Dokumente hochgeladen.",
      "notify.extraction_refreshed": "Extraktion aktualisiert.",
      "notify.answers_saved": "Antworten gespeichert.",
      "notify.files_generated": "Dateien generiert.",
      "notify.session_cleared": "Sitzung gelöscht.",
      "notify.language_updated": "Sprache aktualisiert.",

      "error.request_failed": "Anfrage fehlgeschlagen.",
      "error.action_failed": "Aktion fehlgeschlagen.",
      "error.start_session_first": "Bitte zuerst eine Sitzung starten.",
      "error.select_files_first": "Bitte zuerst Dateien auswählen.",
      "error.required_unresolved": "Pflichtfragen noch offen",
      "error.email_failed": "E-Mail-Versand fehlgeschlagen.",
      "warn.no_api_key": "KI-Funktionen nicht verfügbar: API-Schlüssel auf dem Server nicht konfiguriert.",

      "comparison.show": "Match-Analyse anzeigen",
      "comparison.hide": "Match-Analyse ausblenden",
      "comparison.original": "Ursprünglich",
      "comparison.optimized": "Optimiert für Stelleninserat",
      "comparison.loading": "Laden...",
      "comparison.error": "Vergleich konnte nicht geladen werden.",

      "fmt.title": "Optimales Eingabeformat",
      "fmt.intro": "Verwende diese Struktur für beste Ergebnisse und weniger Neugenerierungen:",
      "fmt.date": "Datum: MM/JJJJ (z.B. 03/2021). Zeiträume: 03/2021\u201306/2024. \"heute\" für aktuelle Stelle.",
      "fmt.role": "Rolle: exakter Jobtitel, keine Abkürzungen (z.B. \"Digital Business Manager\", nicht \"DBM\")",
      "fmt.company": "Firma: vollständiger Name (z.B. \"Soprema AG\", nicht \"Soprema\")",
      "fmt.achievements": "Leistungen: eine pro Zeile, STAR-Format. Mit Aktionsverb beginnen. Kennzahlen nennen.",
      "fmt.achievements_ex": "Beispiel:\nNationale B2C-Kampagne geleitet (CHF 500k Budget), Online-/Offline-Mix\nSEO-Ranking von Position 8 auf 2 verbessert innerhalb 6 Monaten\nCI/CD-Pipeline aufgebaut, Deployment-Zeit um 70% reduziert",
      "fmt.skills": "Skills: kommagetrennt, spezifisch (z.B. \"Python, SQL, Tableau, Jira\" nicht \"Programmierung, Daten\"). Level in Klammern angeben: Python (Experte), SQL (Fortgeschritten), Excel (Grundkenntnisse)",
      "fmt.education": "Ausbildung: Abschluss + Schule + Zeitraum (z.B. \"MSc Applied Information & Data Science, HSLU, 09/2023\u2013heute\")",
      "fmt.tip": "Tipp: spezifischere Eingaben = besseres Ergebnis. Vage Beschreibungen kosten zusätzliche Generierungen.",
      "fmt.close": "Verstanden",

      "aria.language_toggle": "Sprachauswahl",
      "aria.switch_en": "Switch to English",
      "aria.switch_de": "Auf Deutsch wechseln",

      "adv.profile_title": "Erweitert: Profil manuell aufbauen",
      "adv.telos_title": "Erweitert: Karriereziele & Werte",
      "adv.contact": "Kontakt",
      "adv.experience": "Berufserfahrung",
      "adv.education": "Ausbildung",
      "adv.references": "Referenzen (optional)",
      "adv.name": "Vollständiger Name",
      "adv.email": "E-Mail",
      "adv.phone": "Telefon",
      "adv.location": "Ort",
      "adv.linkedin": "LinkedIn",
      "adv.portfolio": "Portfolio",
      "adv.add_experience": "+ Erfahrung hinzufügen",
      "adv.add_education": "+ Ausbildung hinzufügen",
      "adv.remove": "Entfernen",
      "adv.role": "Rolle / Titel",
      "adv.company": "Firma",
      "adv.period": "Zeitraum",
      "adv.achievements": "Leistungen (STAR-Methode)",
      "adv.degree": "Abschluss",
      "adv.school": "Schule / Universität",
      "adv.export": "Exportieren .txt",
      "adv.import": "Importieren .txt",
      "adv.ph_name": "Jana Müller",
      "adv.ph_email": "jana@beispiel.ch",
      "adv.ph_phone": "+41 79 123 45 67",
      "adv.ph_location": "Zürich, Schweiz",
      "adv.ph_linkedin": "linkedin.com/in/janamueller",
      "adv.ph_portfolio": "janamueller.ch",
      "adv.ph_references": "Dr. Jana Müller | Professorin | ETH Zürich | jana@ethz.ch",
      "adv.ph_role": "Senior Ingenieurin",
      "adv.ph_company": "Musterfirma AG",
      "adv.ph_period": "2020–2024",
      "adv.ph_achievements": "Situation: Team verpasste Fristen. Task: Release stabilisieren. Action: CI/CD eingeführt. Result: 0 verpasste Fristen in 18 Monaten.",
      "adv.ph_degree": "MSc Informatik",
      "adv.ph_school": "ETH Zürich",

      "telos.career_goal": "Was suchen Sie in Ihrer nächsten Stelle?",
      "telos.work_environment": "Beschreiben Sie Ihr ideales Arbeitsumfeld",
      "telos.values": "Was sind Ihre wichtigsten beruflichen Werte?",
      "telos.strengths": "Was sind Ihre 3 Hauptstärken mit Beispielen?",
      "telos.motivators": "Was motiviert Sie am meisten bei der Arbeit?",
      "telos.success_vision": "Was bedeutet Erfolg für Sie in dieser Stelle?",
      "telos.work_style": "Wie arbeiten Sie am liebsten (autonom/Team)?",
      "telos.impact": "Welchen Einfluss möchten Sie hinterlassen?",
      "telos.ph_career_goal": "Produktentwicklung in einem Scale-up mit echtem Impact leiten...",
      "telos.ph_work_environment": "Async-first, kollaboratives, datengetriebenes Team...",
      "telos.ph_values": "Eigenverantwortung, kontinuierliches Lernen, Qualität beim Ausliefern...",
      "telos.ph_strengths": "Systemdesign, klare Kommunikation, Debugging unter Druck...",
      "telos.ph_motivators": "Autonomie, Meisterschaft, Produkte ausliefern, die Menschen nutzen...",
      "telos.ph_success_vision": "Ein Feature von Anfang bis Ende besitzen und Nutzerakzeptanz wachsen sehen...",
      "telos.ph_work_style": "Tiefe Arbeitseinheiten morgens, kollaborative Nachmittage...",
      "telos.ph_impact": "Das Produkt dabei helfen, 100.000 Nutzer zu erreichen...",
    },
  };

  const state = {
    sessionId: "",
    server: null,
    uiLanguage: "de",
  };

  const statusBox = document.getElementById("global-status");
  const sessionMeta = document.getElementById("session-meta");
  const documentsList = document.getElementById("documents-list");
  const pendingUploadTags = document.getElementById("pending-upload-tags");
  const questionsList = document.getElementById("questions-list");
  const requiredSummary = document.getElementById("required-summary");
  const reviewScore = document.getElementById("review-score");
  const reviewMissing = document.getElementById("review-missing");

  const progressStepLabel = document.getElementById("progress-step-label");
  const progressPercent = document.getElementById("progress-percent");
  const progressFill = document.getElementById("progress-fill");
  const stepChips = Array.from(document.querySelectorAll(".step-chip"));

  const inputCompany = document.getElementById("input-company");
  const inputPosition = document.getElementById("input-position");
  const inputConsent = document.getElementById("input-consent");
  const inputJobAd = document.getElementById("input-job-ad");
  const uploadFiles = document.getElementById("upload-files");
  const uploadFilesTrigger = document.getElementById("upload-files-trigger");
  const uploadFilesName = document.getElementById("upload-files-name");
  const photoFile = document.getElementById("photo-file");
  const photoFileTrigger = document.getElementById("photo-file-trigger");
  const photoFileName = document.getElementById("photo-file-name");
  const uploadTagDefault = document.getElementById("upload-tag-default");
  const templateSelect = document.getElementById("review-template");
  const primaryInput = document.getElementById("review-primary");
  const accentInput = document.getElementById("review-accent");
  const borderStyleSelect = document.getElementById("review-border-style");
  const boxShadowCheck = document.getElementById("review-box-shadow");
  const fontSelect = document.getElementById("review-font");
  const cardBgInput = document.getElementById("review-card-bg");
  const pageBgInput = document.getElementById("review-page-bg");
  const langBtnEn = document.getElementById("lang-btn-en");
  const langBtnDe = document.getElementById("lang-btn-de");
  const filenameCvInput = document.getElementById("review-filename-cv");
  const filenameCoverInput = document.getElementById("review-filename-cover");

  const pasteText = document.getElementById("paste-text");
  const pasteTag = document.getElementById("paste-tag");
  const btnPasteSubmit = document.getElementById("paste-submit-btn");

  const btnStartContinue = document.getElementById("start-continue-btn");
  const btnUploadContinue = document.getElementById("upload-continue-btn");
  const btnUpload = document.getElementById("upload-btn");
  const btnUploadPhoto = document.getElementById("upload-photo-btn");
  const btnExtract = document.getElementById("extract-btn");
  const btnAnswers = document.getElementById("save-answers-btn");
  const btnGenerate = document.getElementById("generate-btn");
  const btnClear = document.getElementById("clear-session-btn");
  const btnToReview = document.getElementById("to-review-btn");
  let ensureSessionPromise = null;
  let intakeSyncTimer = null;

  function endpoint(path) {
    return `${rootPath}${path}`;
  }

  function routeForStep(step) {
    if (step === "start") return endpoint("/start");
    if (step === "upload") return endpoint("/upload");
    if (step === "questions") return endpoint("/questions");
    if (step === "review") return endpoint("/review");
    return endpoint("/");
  }

  function t(key) {
    return I18N[state.uiLanguage]?.[key] || I18N.en[key] || key;
  }

  function formatStepLabel(current, total) {
    return t("progress.step_of")
      .replace("{current}", String(current))
      .replace("{total}", String(total));
  }

  function recommendedStepFromServer() {
    if (!state.server) return "start";
    return state.server.recommended_step || state.server.phase || "start";
  }

  function translateStaticUi() {
    document.documentElement.lang = state.uiLanguage;
    document.title = t("page.title");
    if (langBtnEn) langBtnEn.classList.toggle("active", state.uiLanguage === "en");
    if (langBtnDe) langBtnDe.classList.toggle("active", state.uiLanguage === "de");

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      const key = node.getAttribute("data-i18n-placeholder");
      if (key) node.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      const key = node.getAttribute("data-i18n-aria");
      if (key) node.setAttribute("aria-label", t(key));
    });

    const autoOption = uploadTagDefault?.querySelector('option[value=""]');
    if (autoOption) autoOption.textContent = t("tag.auto");
  }

  function renderProgress() {
    const currentStep = STEP_ORDER.indexOf(pageKey) + 1;
    const totalSteps = STEP_ORDER.length;
    const percent = STEP_PROGRESS[pageKey] ?? 0;

    if (progressStepLabel) progressStepLabel.textContent = formatStepLabel(currentStep, totalSteps);
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressFill) progressFill.style.width = `${percent}%`;

    const currentRecommended = recommendedStepFromServer();
    stepChips.forEach((chip) => {
      const step = chip.dataset.step || "";
      chip.classList.toggle("active", step === pageKey);
      chip.textContent = t(`progress.${step}`);

      let allowed = false;
      if (step === "start" || step === "upload") {
        allowed = true;
      } else if (step === "questions") {
        allowed = Boolean(state.sessionId && currentRecommended !== "start" && currentRecommended !== "upload");
      } else if (step === "review") {
        allowed = Boolean(state.sessionId && currentRecommended === "review");
      }
      if (step === "result") allowed = false;

      chip.classList.toggle("clickable", allowed);
      chip.classList.toggle("disabled", !allowed);
      chip.onclick = allowed && chip.dataset.url ? () => window.location.assign(chip.dataset.url) : null;
    });
  }

  function notify(kind, text) {
    if (!statusBox) return;
    statusBox.innerHTML = `<div class="alert ${kind}">${text}</div>`;
  }

  function clearStatus() {
    if (statusBox) statusBox.innerHTML = "";
  }

  function setButtonStates() {
    const hasSession = Boolean(state.sessionId);
    const hasQuestions = Boolean((state.server?.questions || []).length);
    const unresolved = (state.server?.unresolved_required_question_ids || []).length;
    const hasDocs = Boolean((state.server?.documents || []).length);

    if (btnUpload && uploadFiles) btnUpload.disabled = !hasSession || !uploadFiles.files.length;
    if (btnUploadPhoto && photoFile) btnUploadPhoto.disabled = !hasSession || !photoFile.files.length;
    if (btnExtract) btnExtract.disabled = !hasSession;
    if (btnAnswers) btnAnswers.disabled = !hasSession || !hasQuestions;
    if (btnGenerate) btnGenerate.disabled = !hasSession || !state.server?.ready_to_generate;
    if (btnClear) btnClear.disabled = !hasSession;
    if (btnToReview) btnToReview.disabled = !hasSession || unresolved > 0 || !state.server?.ready_to_generate;
    if (btnStartContinue) {
      const hasJobAd = Boolean(inputJobAd?.value?.trim());
      const hasConsent = Boolean(inputConsent?.checked);
      btnStartContinue.disabled = !hasJobAd || !hasConsent;
    }
    if (btnPasteSubmit) btnPasteSubmit.disabled = !(pasteText?.value?.trim());
    if (btnUploadContinue) btnUploadContinue.disabled = !hasSession || !hasDocs;
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderSessionMeta() {
    if (!sessionMeta) return;
    if (!state.sessionId) {
      sessionMeta.textContent = t("session.none");
      return;
    }
    const expiresAt = state.server?.expires_at ? new Date(state.server.expires_at * 1000).toLocaleString() : "-";
    sessionMeta.textContent = `${t("session.label")}: ${state.sessionId.slice(0, 12)}… · ${t("session.expires")}: ${expiresAt}`;
  }

  function tagLabel(tag) {
    return t(`tag.${tag}`);
  }

  function parseMethodLabel(parseMethod) {
    return t(`parse.${parseMethod}`);
  }

  function documentTagOptions(selected, includeAuto = false) {
    const tags = ["cv", "cover_letter", "arbeitszeugnis", "certificate", "other"];
    const auto = includeAuto ? `<option value="">${t("tag.auto")}</option>` : "";
    return `${auto}${tags.map((tag) => `<option value="${tag}" ${selected === tag ? "selected" : ""}>${tagLabel(tag)}</option>`).join("")}`;
  }

  function renderPendingTagRows() {
    if (!pendingUploadTags || !uploadFiles) return;
    const files = Array.from(uploadFiles.files || []);
    if (!files.length) {
      pendingUploadTags.innerHTML = "";
      return;
    }
    pendingUploadTags.innerHTML = files
      .map(
        (file, index) => `
          <div class="row-card">
            <div>
              <strong>${file.name}</strong>
              <p>${formatBytes(file.size)}</p>
            </div>
            <label>${t("label.tag")}
              <select data-pending-tag="${index}">
                ${documentTagOptions(uploadTagDefault?.value || "", true)}
              </select>
            </label>
          </div>
        `,
      )
      .join("");
  }

  function renderUploadFileLabel() {
    if (!uploadFilesName || !uploadFiles) return;
    const files = Array.from(uploadFiles.files || []);
    if (!files.length) {
      uploadFilesName.textContent = t("text.no_files_selected");
      return;
    }
    if (files.length === 1) {
      uploadFilesName.textContent = files[0].name;
      return;
    }
    uploadFilesName.textContent = t("text.files_selected").replace("{count}", String(files.length));
  }

  function renderPhotoFileLabel() {
    if (!photoFileName || !photoFile) return;
    const files = Array.from(photoFile.files || []);
    if (!files.length) {
      photoFileName.textContent = t("text.no_photo_selected");
      return;
    }
    photoFileName.textContent = files[0].name;
  }

  function renderDocuments() {
    if (!documentsList) return;
    const docs = state.server?.documents || [];
    if (!docs.length) {
      documentsList.innerHTML = `<div class="row-card muted">${t("text.no_documents")}</div>`;
      return;
    }
    documentsList.innerHTML = docs
      .map(
        (doc) => `
          <div class="row-card">
            <div>
              <strong>${doc.filename}</strong>
              <p>${parseMethodLabel(doc.parse_method)} · ${t("stats.confidence")} ${Math.round((doc.confidence || 0) * 100)}% · ${formatBytes(doc.size_bytes)}</p>
            </div>
            <label>${t("label.tag")}
              <select data-doc-tag="${doc.doc_id}">
                ${documentTagOptions(doc.tag)}
              </select>
            </label>
          </div>
        `,
      )
      .join("");
  }

  function inputControl(question, value) {
    const safeValue = value || "";
    if (question.options && question.options.length > 0) {
      return `<select data-question-id="${question.question_id}">
        <option value=""></option>
        ${question.options.map((option) => `<option value="${option}" ${safeValue === option ? "selected" : ""}>${option}</option>`).join("")}
      </select>`;
    }
    if (question.field_path.includes("experience") || question.field_path.includes("education")) {
      return `<textarea data-question-id="${question.question_id}" rows="3">${safeValue}</textarea>`;
    }
    return `<input data-question-id="${question.question_id}" type="text" value="${safeValue}">`;
  }

  function renderQuestions() {
    if (!questionsList || !requiredSummary) return;
    const questions = state.server?.questions || [];
    if (!questions.length) {
      questionsList.innerHTML = `<div class="row-card success-soft">${t("text.no_open_questions")}</div>`;
      requiredSummary.textContent = "";
      return;
    }
    const answers = state.server?.answers || {};
    questionsList.innerHTML = questions
      .map(
        (question) => `
          <div class="row-card ${question.required ? "required" : ""}">
            <div>
              <strong>${question.required ? t("text.required") : t("text.optional")} · ${question.question_id}</strong>
              <p>${question.prompt}</p>
              <p class="meta">${question.reason || ""}</p>
            </div>
            <label>${t("label.answer")}
              ${inputControl(question, answers[question.question_id])}
            </label>
          </div>
        `,
      )
      .join("");

    const unresolved = state.server?.unresolved_required_question_ids || [];
    requiredSummary.textContent = unresolved.length
      ? `${t("text.required_unresolved")}: ${unresolved.join(", ")}`
      : t("text.required_resolved");
  }

  function renderReview() {
    if (!reviewScore || !reviewMissing) return;
    const payload = state.server?.review_match;
    const extractionWarning = state.server?.extraction_warning || "";
    if (!payload) {
      reviewScore.innerHTML = extractionWarning
        ? `<div class="alert warn">${extractionWarning}</div><p>${t("text.review_no_score")}</p>`
        : t("text.review_no_score");
      reviewMissing.innerHTML = "";
      return;
    }
    reviewScore.innerHTML = `
      ${extractionWarning ? `<div class="alert warn">${extractionWarning}</div>` : ""}
      <strong>${t("text.review_score")}: ${payload.overall_score.toFixed(1)} / 100</strong>
      <p>${t("text.ats")}: ${(payload.category_scores?.ats_compatibility || 0).toFixed(1)} · ${t("text.skills")}: ${(payload.category_scores?.skills_match || 0).toFixed(1)}</p>
    `;
    const missing = payload.missing_keywords || [];
    const issues = payload.ats_issues || [];
    reviewMissing.innerHTML = `
      <div class="row-card">
        <strong>${t("text.missing_keywords")}</strong>
        <p>${missing.length ? missing.slice(0, 20).join(", ") : t("text.none")}</p>
      </div>
      <div class="row-card">
        <strong>${t("text.ats_issues")}</strong>
        <p>${issues.length ? issues.join(" · ") : t("text.none")}</p>
      </div>
    `;
  }

  function saveLocal() {
    const payload = {
      sessionId: state.sessionId,
      language: state.uiLanguage,
      company: inputCompany?.value || "",
      position: inputPosition?.value || "",
      consent: inputConsent?.checked || false,
      jobAd: inputJobAd?.value || "",
      templateId: templateSelect?.value || "simple",
      primary: primaryInput?.value || defaultPrimary,
      accent: accentInput?.value || defaultAccent,
      borderStyle: borderStyleSelect?.value || "rounded",
      fontFamily: fontSelect?.value || "inter",
      boxShadow: boxShadowCheck?.checked || false,
      cardBg: cardBgInput?.value || "#ffffff",
      pageBg: pageBgInput?.value || "#ffffff",
      filenameCv: filenameCvInput?.value || "",
      filenameCover: filenameCoverInput?.value || "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function restoreLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      state.uiLanguage = payload.language === "de" ? "de" : "en";
      if (payload.sessionId) state.sessionId = payload.sessionId;
      if (inputCompany) inputCompany.value = payload.company || "";
      if (inputPosition) inputPosition.value = payload.position || "";
      if (inputConsent) inputConsent.checked = Boolean(payload.consent);
      if (inputJobAd) inputJobAd.value = payload.jobAd || "";
      if (templateSelect) templateSelect.value = payload.templateId || "simple";
      if (primaryInput) primaryInput.value = payload.primary || defaultPrimary;
      if (accentInput) accentInput.value = payload.accent || defaultAccent;
      if (fontSelect) fontSelect.value = payload.fontFamily || "inter";
      if (borderStyleSelect) borderStyleSelect.value = payload.borderStyle || "rounded";
      if (boxShadowCheck) boxShadowCheck.checked = Boolean(payload.boxShadow);
      if (cardBgInput) cardBgInput.value = payload.cardBg || "#ffffff";
      if (pageBgInput) pageBgInput.value = payload.pageBg || "#ffffff";
      if (filenameCvInput) filenameCvInput.value = payload.filenameCv || "";
      if (filenameCoverInput) filenameCoverInput.value = payload.filenameCover || "";
    } catch (_) {}
  }

  async function parseJsonResponse(response) {
    if (response.ok) return response.json();
    let detail = t("error.request_failed");
    try {
      const payload = await response.json();
      detail = typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail || payload);
    } catch (_) {}
    throw new Error(detail);
  }

  async function fetchState() {
    if (!state.sessionId) return null;
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/state`));
    const data = await parseJsonResponse(response);
    state.server = data.state;
    applyServerState();
    return data.state;
  }

  async function fetchStateSafe() {
    if (!state.sessionId) return false;
    try {
      await fetchState();
      return true;
    } catch (_) {
      state.sessionId = "";
      state.server = null;
      clearLocal();
      return false;
    }
  }

  function intakePayload() {
    return {
      company_name: inputCompany?.value || "",
      position_title: inputPosition?.value || "",
      job_ad_text: inputJobAd?.value || "",
      consent_confirmed: Boolean(inputConsent?.checked),
    };
  }

  function hasAutoStartSignal() {
    const payload = intakePayload();
    const hasText = Boolean(payload.company_name.trim() || payload.position_title.trim() || payload.job_ad_text.trim());
    const hasConsent = payload.consent_confirmed;
    return hasText || hasConsent;
  }

  async function startSession({ silent = false } = {}) {
    if (!silent) clearStatus();
    const payload = {
      language: state.uiLanguage,
      ...intakePayload(),
    };
    const response = await fetch(endpoint("/api/session/start"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse(response);
    state.sessionId = data.session_id;
    state.server = data.state;
    applyServerState();
    if (!silent) notify("success", t("notify.session_started"));
  }

  async function ensureSession({ silent = true } = {}) {
    if (state.sessionId) return true;
    if (!hasAutoStartSignal()) return false;
    if (!ensureSessionPromise) {
      ensureSessionPromise = startSession({ silent }).finally(() => {
        ensureSessionPromise = null;
      });
    }
    await ensureSessionPromise;
    return Boolean(state.sessionId);
  }

  async function syncIntake() {
    if (!state.sessionId) return;
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/intake`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intakePayload()),
    });
    const data = await parseJsonResponse(response);
    state.server = data.state;
    applyServerState();
  }

  function scheduleIntakeSync() {
    if (intakeSyncTimer) clearTimeout(intakeSyncTimer);
    intakeSyncTimer = setTimeout(() => {
      run(async () => {
        const hasSession = await ensureSession({ silent: true });
        if (hasSession) await syncIntake();
      });
    }, 350);
  }

  async function syncSessionLanguage() {
    if (!state.sessionId) return;
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/language`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: state.uiLanguage }),
    });
    const data = await parseJsonResponse(response);
    state.server = data.state;
    applyServerState();
  }

  async function changeLanguage(language) {
    const nextLanguage = language === "de" ? "de" : "en";
    if (state.uiLanguage === nextLanguage) return;
    state.uiLanguage = nextLanguage;
    renderAll();
    if (state.sessionId) {
      try {
        await syncSessionLanguage();
      } catch (_) {}
    }
    notify("success", t("notify.language_updated"));
  }

  async function uploadDocuments() {
    await ensureSession({ silent: true });
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    if (!uploadFiles) throw new Error(t("error.select_files_first"));
    const files = Array.from(uploadFiles.files || []);
    if (!files.length) throw new Error(t("error.select_files_first"));

    const tagInputs = pendingUploadTags?.querySelectorAll("[data-pending-tag]") || [];
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("files", file);
      const manualTag = tagInputs[index]?.value || uploadTagDefault?.value || "";
      if (manualTag) formData.append("tags", manualTag);
    });
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/upload`), {
      method: "POST",
      body: formData,
    });
    const data = await parseJsonResponse(response);
    uploadFiles.value = "";
    if (pendingUploadTags) pendingUploadTags.innerHTML = "";
    renderUploadFileLabel();
    if (data.state) {
      state.server = data.state;
      applyServerState();
    } else {
      await fetchState();
    }
    notify("success", t("notify.documents_uploaded"));
  }

  async function uploadPhoto() {
    await ensureSession({ silent: true });
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    if (!photoFile) throw new Error(t("error.select_files_first"));
    const files = Array.from(photoFile.files || []);
    if (!files.length) throw new Error(t("error.select_files_first"));
    const formData = new FormData();
    formData.append("file", files[0]);
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/photo`), {
      method: "POST",
      body: formData,
    });
    const data = await parseJsonResponse(response);
    state.server = data.state;
    photoFile.value = "";
    renderPhotoFileLabel();
    applyServerState();
    notify("success", t("notify.documents_uploaded"));
  }

  async function submitPastedText() {
    await ensureSession({ silent: true });
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    const text = (pasteText?.value || "").trim();
    if (!text) throw new Error(t("error.select_files_first"));
    const tag = pasteTag?.value || "cv";
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/paste`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tag }),
    });
    const data = await parseJsonResponse(response);
    if (pasteText) pasteText.value = "";
    if (data.state) {
      state.server = data.state;
      applyServerState();
    } else {
      await fetchState();
    }
    notify("success", t("notify.paste_submitted"));
  }

  async function extract() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    const tagOverrides = {};
    const selects = documentsList?.querySelectorAll("[data-doc-tag]") || [];
    selects.forEach((select) => {
      tagOverrides[select.dataset.docTag] = select.value;
    });
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/extract`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_overrides: tagOverrides }),
    });
    const data = await parseJsonResponse(response);
    state.server = data.state;
    applyServerState();
    notify("success", t("notify.extraction_refreshed"));
  }

  async function saveAnswers() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    const answers = {};
    const fields = questionsList?.querySelectorAll("[data-question-id]") || [];
    fields.forEach((field) => {
      answers[field.dataset.questionId] = field.value || "";
    });
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/answer`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await parseJsonResponse(response);
    state.server = data.state;
    applyServerState();
    notify("success", t("notify.answers_saved"));
  }

  async function generate() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    trackGenerate();
    const payload = {
      template_id: templateSelect?.value || "simple",
      primary_color: primaryInput?.value || defaultPrimary,
      accent_color: accentInput?.value || defaultAccent,
      font_family: fontSelect?.value || "inter",
      border_style: borderStyleSelect?.value || "rounded",
      box_shadow: boxShadowCheck?.checked || false,
      card_bg: cardBgInput?.value || "#ffffff",
      page_bg: pageBgInput?.value || "#ffffff",
      filename_cv: filenameCvInput?.value || "",
      filename_cover: filenameCoverInput?.value || "",
    };
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/generate`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 422) {
      const data = await response.json();
      const unresolved = data.detail?.unresolved_question_ids || [];
      throw new Error(`${t("error.required_unresolved")}: ${unresolved.join(", ")}`);
    }
    const data = await parseJsonResponse(response);
    notify("success", t("notify.files_generated"));
    if (data.result_url) {
      window.location.assign(data.result_url);
    }
  }

  async function clearSession() {
    if (intakeSyncTimer) {
      clearTimeout(intakeSyncTimer);
      intakeSyncTimer = null;
    }
    if (state.sessionId) {
      try {
        await fetch(endpoint(`/api/session/${state.sessionId}`), { method: "DELETE" });
      } catch (_) {}
    }
    state.sessionId = "";
    state.server = null;
    clearLocal();
    renderAll();
    notify("success", t("notify.session_cleared"));
  }

  // ============================================================
  // FORMAT GUIDE POPUP
  // ============================================================

  const generateTimestamps = [];

  function showFormatGuide() {
    if (document.getElementById("fmt-modal")) return;
    const overlay = document.createElement("div");
    overlay.id = "fmt-modal";
    overlay.className = "fmt-overlay";
    const exLines = t("fmt.achievements_ex").split("\n").map((l) => escHtml(l)).join("<br>");
    overlay.innerHTML = `
      <div class="fmt-dialog">
        <h3>${t("fmt.title")}</h3>
        <p>${t("fmt.intro")}</p>
        <ul>
          <li>${t("fmt.date")}</li>
          <li>${t("fmt.role")}</li>
          <li>${t("fmt.company")}</li>
          <li>${t("fmt.achievements")}</li>
        </ul>
        <pre class="fmt-example">${exLines}</pre>
        <ul>
          <li>${t("fmt.skills")}</li>
          <li>${t("fmt.education")}</li>
        </ul>
        <p><strong>${t("fmt.tip")}</strong></p>
        <button class="btn-primary fmt-close">${t("fmt.close")}</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector(".fmt-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function trackGenerate() {
    const now = Date.now();
    generateTimestamps.push(now);
    const cutoff = now - 5 * 60 * 1000;
    while (generateTimestamps.length && generateTimestamps[0] < cutoff) generateTimestamps.shift();
    if (generateTimestamps.length >= 3) showFormatGuide();
  }

  // ============================================================
  // ADVANCED MODE
  // ============================================================

  let advProfileDebounce = null;
  let advTelosDebounce = null;

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addExperienceRow(data) {
    const list = document.getElementById("adv-experience-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "exp-row";
    row.innerHTML = `
      <button type="button" class="row-remove">${t("adv.remove")}</button>
      <div class="grid two">
        <label><span>${t("adv.role")}</span>
          <input type="text" name="role" value="${escHtml(data?.role || "")}" placeholder="${escHtml(t("adv.ph_role"))}">
        </label>
        <label><span>${t("adv.company")}</span>
          <input type="text" name="company" value="${escHtml(data?.company || "")}" placeholder="${escHtml(t("adv.ph_company"))}">
        </label>
        <label><span>${t("adv.period")}</span>
          <input type="text" name="period" value="${escHtml(data?.period || "")}" placeholder="${escHtml(t("adv.ph_period"))}">
        </label>
      </div>
      <label><span>${t("adv.achievements")}</span>
        <textarea name="achievements" rows="3" placeholder="${escHtml(t("adv.ph_achievements"))}">${escHtml((data?.achievements || []).join("\n"))}</textarea>
      </label>
    `;
    row.querySelectorAll("input, textarea").forEach((el) => el.addEventListener("input", scheduleAdvProfileSave));
    list.appendChild(row);
  }

  function addEducationRow(data) {
    const list = document.getElementById("adv-education-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "edu-row";
    row.innerHTML = `
      <button type="button" class="row-remove">${t("adv.remove")}</button>
      <div class="grid two">
        <label><span>${t("adv.degree")}</span>
          <input type="text" name="degree" value="${escHtml(data?.degree || "")}" placeholder="${escHtml(t("adv.ph_degree"))}">
        </label>
        <label><span>${t("adv.school")}</span>
          <input type="text" name="school" value="${escHtml(data?.school || "")}" placeholder="${escHtml(t("adv.ph_school"))}">
        </label>
        <label><span>${t("adv.period")}</span>
          <input type="text" name="period" value="${escHtml(data?.period || "")}" placeholder="${escHtml(t("adv.ph_period"))}">
        </label>
      </div>
    `;
    row.querySelectorAll("input").forEach((el) => el.addEventListener("input", scheduleAdvProfileSave));
    list.appendChild(row);
  }

  function scheduleAdvProfileSave() {
    if (advProfileDebounce) clearTimeout(advProfileDebounce);
    advProfileDebounce = setTimeout(saveAdvancedProfile, 300);
  }

  function scheduleAdvTelosSave() {
    if (advTelosDebounce) clearTimeout(advTelosDebounce);
    advTelosDebounce = setTimeout(saveTelos, 300);
  }

  function collectAdvancedProfile() {
    return {
      contact: {
        name: document.getElementById("adv-name")?.value || "",
        email: document.getElementById("adv-email")?.value || "",
        phone: document.getElementById("adv-phone")?.value || "",
        location: document.getElementById("adv-location")?.value || "",
        linkedin: document.getElementById("adv-linkedin")?.value || "",
        portfolio: document.getElementById("adv-portfolio")?.value || "",
      },
      experience: Array.from(document.querySelectorAll(".exp-row")).map((row) => ({
        role: row.querySelector("[name='role']")?.value || "",
        company: row.querySelector("[name='company']")?.value || "",
        period: row.querySelector("[name='period']")?.value || "",
        achievements: (row.querySelector("[name='achievements']")?.value || "").split("\n").filter(Boolean),
      })),
      education: Array.from(document.querySelectorAll(".edu-row")).map((row) => ({
        degree: row.querySelector("[name='degree']")?.value || "",
        school: row.querySelector("[name='school']")?.value || "",
        period: row.querySelector("[name='period']")?.value || "",
      })),
      references: document.getElementById("adv-references")?.value || "",
    };
  }

  function saveAdvancedProfile() {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(collectAdvancedProfile()));
  }

  function restoreAdvancedProfile(data) {
    if (!data) {
      try { data = JSON.parse(localStorage.getItem(STORAGE_PROFILE_KEY) || "null"); } catch (_) {}
    }
    if (!data) return;
    const c = data.contact || {};
    ["name", "email", "phone", "location", "linkedin", "portfolio"].forEach((f) => {
      const el = document.getElementById(`adv-${f}`);
      if (el) el.value = c[f] || "";
    });
    const expList = document.getElementById("adv-experience-list");
    if (expList) { expList.innerHTML = ""; (data.experience || []).forEach(addExperienceRow); }
    const eduList = document.getElementById("adv-education-list");
    if (eduList) { eduList.innerHTML = ""; (data.education || []).forEach(addEducationRow); }
    const refs = document.getElementById("adv-references");
    if (refs) refs.value = data.references || "";
  }

  function collectTelos() {
    const result = {};
    TELOS_IDS.forEach((id) => { result[id] = document.getElementById(`telos-${id}`)?.value || ""; });
    return result;
  }

  function saveTelos() {
    localStorage.setItem(STORAGE_TELOS_KEY, JSON.stringify(collectTelos()));
  }

  function restoreTelos(data) {
    if (!data) {
      try { data = JSON.parse(localStorage.getItem(STORAGE_TELOS_KEY) || "null"); } catch (_) {}
    }
    if (!data) return;
    TELOS_IDS.forEach((id) => {
      const el = document.getElementById(`telos-${id}`);
      if (el) el.value = data[id] || "";
    });
  }

  function hasAdvancedData(profile, telos) {
    const c = profile.contact || {};
    if (Object.values(c).some((v) => v.trim())) return true;
    if ((profile.experience || []).some((e) => e.role)) return true;
    if ((profile.education || []).some((e) => e.degree)) return true;
    if ((profile.references || "").trim()) return true;
    if (Object.values(telos || {}).some((v) => v.trim())) return true;
    return false;
  }

  function parseSectionedTxt(text) {
    const result = {};
    let currentSection = null;
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (line.startsWith("#")) continue;
      const sectionMatch = line.match(/^\[([A-Z_]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        result[currentSection] = result[currentSection] || [];
        continue;
      }
      if (currentSection) result[currentSection].push(rawLine);
    }
    return result;
  }

  function parseProfileFromTxt(text) {
    const sections = parseSectionedTxt(text);
    const contact = {};
    (sections.CONTACT || []).forEach((line) => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) contact[m[1]] = m[2].trim();
    });
    const experience = [];
    let current = null;
    let inAchievements = false;
    (sections.EXPERIENCE || []).forEach((line) => {
      if (line.trim() === "---") {
        if (current) { experience.push(current); current = null; inAchievements = false; }
        else { current = { role: "", company: "", period: "", achievements: [] }; inAchievements = false; }
        return;
      }
      if (!current) return;
      if (line.trim() === "achievements:") { inAchievements = true; return; }
      if (inAchievements) {
        const m = line.match(/^\s+-\s+(.*)/);
        if (m) current.achievements.push(m[1]);
        return;
      }
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) current[m[1]] = m[2].trim();
    });
    const education = [];
    let currEdu = null;
    (sections.EDUCATION || []).forEach((line) => {
      if (line.trim() === "---") {
        if (currEdu) { education.push(currEdu); currEdu = null; }
        else currEdu = { degree: "", school: "", period: "" };
        return;
      }
      if (!currEdu) return;
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) currEdu[m[1]] = m[2].trim();
    });
    const references = (sections.REFERENCES || []).join("\n").trim();
    return { contact, experience, education, references };
  }

  function parseTelosFromTxt(text) {
    const sections = parseSectionedTxt(text);
    const telos = {};
    (sections.TELOS || []).forEach((line) => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m && TELOS_IDS.includes(m[1])) telos[m[1]] = m[2].trim();
    });
    return telos;
  }

  function serializeProfileTxt(profile) {
    const date = new Date().toISOString().slice(0, 10);
    const lines = [`# happyRAV Profile | v1 | ${date}`, "[CONTACT]"];
    const c = profile.contact || {};
    ["name", "email", "phone", "location", "linkedin", "portfolio"].forEach((f) => lines.push(`${f}: ${c[f] || ""}`));
    lines.push("", "[EXPERIENCE]");
    (profile.experience || []).forEach((e) => {
      lines.push("---");
      lines.push(`role: ${e.role || ""}`);
      lines.push(`company: ${e.company || ""}`);
      lines.push(`period: ${e.period || ""}`);
      lines.push("achievements:");
      (e.achievements || []).forEach((a) => lines.push(`  - ${a}`));
      lines.push("---");
    });
    lines.push("", "[EDUCATION]");
    (profile.education || []).forEach((e) => {
      lines.push("---");
      lines.push(`degree: ${e.degree || ""}`);
      lines.push(`school: ${e.school || ""}`);
      lines.push(`period: ${e.period || ""}`);
      lines.push("---");
    });
    lines.push("", "[REFERENCES]");
    lines.push(profile.references || "");
    return lines.join("\n");
  }

  function serializeTelosTxt(telos) {
    const date = new Date().toISOString().slice(0, 10);
    const lines = [`# happyRAV Telos | v1 | ${date}`, "[TELOS]"];
    TELOS_IDS.forEach((id) => lines.push(`${id}: ${telos[id] || ""}`));
    return lines.join("\n");
  }

  function downloadTxt(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportProfileTxt() {
    downloadTxt("happyrav_profile.txt", serializeProfileTxt(collectAdvancedProfile()));
  }

  function importProfileTxt(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        restoreAdvancedProfile(parseProfileFromTxt(e.target.result));
        saveAdvancedProfile();
        showFormatGuide();
      } catch (_) {}
    };
    reader.readAsText(file);
  }

  function exportTelosTxt() {
    downloadTxt("happyrav_telos.txt", serializeTelosTxt(collectTelos()));
  }

  function importTelosTxt(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        restoreTelos(parseTelosFromTxt(e.target.result));
        saveTelos();
        showFormatGuide();
      } catch (_) {}
    };
    reader.readAsText(file);
  }

  async function preseedSession(sid) {
    const profile = collectAdvancedProfile();
    const telos = collectTelos();
    const c = profile.contact || {};
    const preseedProfile = {};
    if (c.name) preseedProfile.full_name = c.name;
    if (c.email) preseedProfile.email = c.email;
    if (c.phone) preseedProfile.phone = c.phone;
    if (c.location) preseedProfile.location = c.location;
    if (c.linkedin) preseedProfile.linkedin = c.linkedin;
    if (c.portfolio) preseedProfile.portfolio = c.portfolio;
    if ((profile.experience || []).length) preseedProfile.experience = profile.experience;
    if ((profile.education || []).length) preseedProfile.education = profile.education;
    const response = await fetch(endpoint(`/api/session/${sid}/preseed`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: preseedProfile, telos }),
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.state) state.server = data.state;
  }

  function bindAdvancedEvents() {
    document.getElementById("adv-add-exp")?.addEventListener("click", () => addExperienceRow());
    document.getElementById("adv-add-edu")?.addEventListener("click", () => addEducationRow());

    document.getElementById("adv-experience-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".row-remove");
      if (btn) { btn.closest(".exp-row")?.remove(); scheduleAdvProfileSave(); }
    });
    document.getElementById("adv-education-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".row-remove");
      if (btn) { btn.closest(".edu-row")?.remove(); scheduleAdvProfileSave(); }
    });

    document.getElementById("adv-export-profile")?.addEventListener("click", exportProfileTxt);
    document.getElementById("adv-import-profile-btn")?.addEventListener("click", () => {
      document.getElementById("adv-import-profile-file")?.click();
    });
    document.getElementById("adv-import-profile-file")?.addEventListener("change", function () {
      if (this.files[0]) { importProfileTxt(this.files[0]); this.value = ""; }
    });

    document.getElementById("adv-export-telos")?.addEventListener("click", exportTelosTxt);
    document.getElementById("adv-import-telos-btn")?.addEventListener("click", () => {
      document.getElementById("adv-import-telos-file")?.click();
    });
    document.getElementById("adv-import-telos-file")?.addEventListener("change", function () {
      if (this.files[0]) { importTelosTxt(this.files[0]); this.value = ""; }
    });

    ["adv-name", "adv-email", "adv-phone", "adv-location", "adv-linkedin", "adv-portfolio", "adv-references"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", scheduleAdvProfileSave);
    });

    TELOS_IDS.forEach((id) => {
      document.getElementById(`telos-${id}`)?.addEventListener("input", scheduleAdvTelosSave);
    });
  }

  // ============================================================
  // END ADVANCED MODE
  // ============================================================

  function gotoUpload() {
    window.location.assign(routeForStep("upload"));
  }

  function gotoQuestions() {
    window.location.assign(routeForStep("questions"));
  }

  function gotoReview() {
    window.location.assign(routeForStep("review"));
  }

  function bindComparisonToggle() {
    const btn = document.getElementById("comparison-toggle");
    const container = document.getElementById("comparison-container");
    if (!btn || !container) return;

    let loaded = false;
    btn.addEventListener("click", async () => {
      if (container.style.display !== "none") {
        container.style.display = "none";
        btn.textContent = t("comparison.show");
        return;
      }
      if (!loaded) {
        btn.disabled = true;
        btn.textContent = t("comparison.loading");
        try {
          const token = btn.dataset.token;
          const res = await fetch(endpoint(`/api/result/${token}/comparison`));
          if (!res.ok) throw new Error();
          const data = await res.json();
          const sections = data.sections || [];
          if (!sections.length) {
            container.innerHTML = `<p>${t("comparison.error")}</p>`;
          } else {
            const isDe = state.uiLanguage === "de";
            let html = `<table class="comparison-table"><thead><tr><th></th><th>${t("comparison.original")}</th><th>${t("comparison.optimized")}</th></tr></thead><tbody>`;
            sections.forEach((s) => {
              const label = isDe ? s.label_de : s.label_en;
              const orig = escHtml(s.original).replace(/\n/g, "<br>");
              const opt = escHtml(s.optimized).replace(/\n/g, "<br>");
              html += `<tr><td><strong>${escHtml(label)}</strong></td><td>${orig}</td><td>${opt}</td></tr>`;
            });
            html += "</tbody></table>";
            container.innerHTML = html;
          }
          loaded = true;
        } catch (_) {
          container.innerHTML = `<p class="alert warn">${t("comparison.error")}</p>`;
        }
        btn.disabled = false;
      }
      container.style.display = "block";
      btn.textContent = t("comparison.hide");
    });
  }

  function bindEmailSubmitListener() {
    document.addEventListener("submit", async (event) => {
      const form = event.target;
      if (!form.classList || !form.classList.contains("email-form")) return;
      event.preventDefault();
      const target = form.parentElement.querySelector("#email-status");
      const response = await fetch(form.action, { method: "POST", body: new FormData(form) });
      if (!target) return;
      if (response.ok) {
        target.innerHTML = await response.text();
        return;
      }
      try {
        const payload = await response.json();
        target.innerHTML = `<div class="alert warn">${payload.detail || t("error.email_failed")}</div>`;
      } catch (_) {
        target.innerHTML = `<div class="alert warn">${t("error.email_failed")}</div>`;
      }
    });
  }

  function applyServerState() {
    if (!state.server) {
      renderAll();
      return;
    }
    state.uiLanguage = state.server.language === "de" ? "de" : "en";
    if (inputCompany) inputCompany.value = state.server.company_name || inputCompany.value;
    if (inputPosition) inputPosition.value = state.server.position_title || inputPosition.value;
    if (inputJobAd) inputJobAd.value = state.server.job_ad_text || inputJobAd.value;
    if (inputConsent) inputConsent.checked = Boolean(state.server.consent_confirmed);
    if (templateSelect && state.server.template_id) templateSelect.value = state.server.template_id;
    if (primaryInput && state.server.theme?.primary_hex) primaryInput.value = state.server.theme.primary_hex;
    if (accentInput && state.server.theme?.accent_hex) accentInput.value = state.server.theme.accent_hex;
    if (fontSelect && state.server.theme?.font_family) fontSelect.value = state.server.theme.font_family;
    if (borderStyleSelect && state.server.theme?.border_style) borderStyleSelect.value = state.server.theme.border_style;
    if (boxShadowCheck && state.server.theme?.box_shadow !== undefined) boxShadowCheck.checked = state.server.theme.box_shadow;
    if (cardBgInput && state.server.theme?.card_bg) cardBgInput.value = state.server.theme.card_bg;
    if (pageBgInput && state.server.theme?.page_bg) pageBgInput.value = state.server.theme.page_bg;
    renderAll();
  }

  function renderApiKeyWarning() {
    const existing = document.getElementById("api-key-warning");
    if (existing) existing.remove();
    if (state.server && state.server.api_key_configured === false) {
      const banner = document.createElement("div");
      banner.id = "api-key-warning";
      banner.className = "alert warn";
      banner.style.margin = "0.5rem 1rem";
      banner.textContent = t("warn.no_api_key");
      const container = document.querySelector(".wizard-content") || document.body;
      container.prepend(banner);
    }
  }

  function renderAll() {
    translateStaticUi();
    renderProgress();
    renderSessionMeta();
    renderApiKeyWarning();
    renderDocuments();
    renderQuestions();
    renderReview();
    renderUploadFileLabel();
    renderPhotoFileLabel();
    setButtonStates();
    saveLocal();
  }

  function guardCurrentPage() {
    if (pageKey === "result") return true;
    const hasSession = Boolean(state.sessionId && state.server);
    if (!hasSession) {
      if (pageKey !== "start") {
        window.location.replace(routeForStep("start"));
        return false;
      }
      return true;
    }

    const recommended = recommendedStepFromServer();
    if (pageKey === "start" && state.server?.documents?.length) {
      window.location.replace(routeForStep(recommended));
      return false;
    }
    if (pageKey === "questions" && (recommended === "upload" || recommended === "start")) {
      window.location.replace(routeForStep(recommended));
      return false;
    }
    if (pageKey === "review" && recommended !== "review") {
      window.location.replace(routeForStep(recommended));
      return false;
    }
    return true;
  }

  async function run(action) {
    try {
      await action();
    } catch (error) {
      notify("warn", error.message || t("error.action_failed"));
    } finally {
      setButtonStates();
    }
  }

  function bindCommonEvents() {
    if (langBtnEn) langBtnEn.addEventListener("click", () => run(() => changeLanguage("en")));
    if (langBtnDe) langBtnDe.addEventListener("click", () => run(() => changeLanguage("de")));

    if (uploadTagDefault) uploadTagDefault.addEventListener("change", renderPendingTagRows);
    if (uploadFiles) {
      uploadFiles.addEventListener("change", () => {
        renderPendingTagRows();
        renderUploadFileLabel();
        setButtonStates();
      });
    }
    if (uploadFilesTrigger && uploadFiles) {
      uploadFilesTrigger.addEventListener("click", () => uploadFiles.click());
    }
    if (photoFile) {
      photoFile.addEventListener("change", () => {
        renderPhotoFileLabel();
        setButtonStates();
      });
    }
    if (photoFileTrigger && photoFile) {
      photoFileTrigger.addEventListener("click", () => photoFile.click());
    }

    [inputCompany, inputPosition, inputConsent, inputJobAd, templateSelect, primaryInput, accentInput, fontSelect, borderStyleSelect, boxShadowCheck, cardBgInput, pageBgInput, filenameCvInput, filenameCoverInput]
      .filter(Boolean)
      .forEach((element) => {
        element.addEventListener("input", () => {
          saveLocal();
          if (element === inputCompany || element === inputPosition || element === inputConsent || element === inputJobAd) {
            scheduleIntakeSync();
          }
          setButtonStates();
        });
        element.addEventListener("change", () => {
          saveLocal();
          if (element === inputCompany || element === inputPosition || element === inputConsent || element === inputJobAd) {
            scheduleIntakeSync();
          }
          setButtonStates();
        });
      });

    if (btnUpload) btnUpload.addEventListener("click", () => run(uploadDocuments));
    if (btnUploadPhoto) btnUploadPhoto.addEventListener("click", () => run(uploadPhoto));
    if (btnPasteSubmit) btnPasteSubmit.addEventListener("click", () => run(submitPastedText));
    if (pasteText) pasteText.addEventListener("input", setButtonStates);
    if (btnExtract) btnExtract.addEventListener("click", () => run(extract));
    if (btnClear) btnClear.addEventListener("click", () => run(clearSession));
  }

  function bindPageEvents() {
    if (btnStartContinue) {
      btnStartContinue.addEventListener("click", () =>
        run(async () => {
          if (state.sessionId) {
            const profile = collectAdvancedProfile();
            const telos = collectTelos();
            if (hasAdvancedData(profile, telos)) await preseedSession(state.sessionId);
          }
          window.location.assign(routeForStep("upload"));
        }),
      );
    }
    if (btnUploadContinue) btnUploadContinue.addEventListener("click", gotoQuestions);
    if (btnAnswers) btnAnswers.addEventListener("click", () => run(saveAnswers));
    if (btnGenerate) btnGenerate.addEventListener("click", () => run(generate));
    if (btnToReview) btnToReview.addEventListener("click", gotoReview);
  }

  async function init() {
    restoreLocal();
    bindEmailSubmitListener();
    bindComparisonToggle();
    bindCommonEvents();
    bindPageEvents();
    if (pageKey === "start") {
      bindAdvancedEvents();
      restoreAdvancedProfile();
      restoreTelos();
    }

    if (pageKey === "start" && !state.sessionId && hasAutoStartSignal()) {
      scheduleIntakeSync();
    }

    if (state.sessionId && pageKey !== "result") {
      await fetchStateSafe();
    }

    if (!guardCurrentPage()) return;
    renderAll();
  }

  init();
})();
