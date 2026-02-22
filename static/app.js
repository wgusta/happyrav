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
  const REVIEW_RECOMMEND_THRESHOLD = 70;

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
      "hero.description": "Generate a CV and cover letter from a job ad that keeps the RAV* happy and maybe even lands you a job.",
      "hero.sub": "*RAV naturally stands for Resume Altering Vessel",
      "footer.tagline": "Developed with love for you and hate for creating documents by Gusty aka Gueney Usta aka you know who I am.",

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
      "review.sub": "Choose template and colors, check match score first, then decide to generate your PDFs.",
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
      "action.preview_match": "Preview Match Score",
      "action.generate_cv": "Generate CV",
      "action.generate_cover": "Generate Cover Letter",
      "action.generate": "Generate CV + Cover Letter",
      "action.download_cv": "Download CV",
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
      "text.review_recommend_low": "Score below {threshold}. We do not recommend generating yet.",
      "text.review_recommend_high": "Score {threshold} or higher. Good to generate.",
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

      "cover.title": "Cover Letter",
      "cover.sender_street": "Sender street",
      "cover.sender_plz": "Sender PLZ/City",
      "cover.recipient_street": "Recipient street",
      "cover.recipient_plz": "Recipient PLZ/City",
      "cover.anrede_label": "Salutation",
      "cover.anrede_unknown": "Contact person unknown",
      "cover.anrede_known": "Contact person known",
      "cover.anrede_input": "Enter salutation",
      "cover.contact_person": "Contact person (attn.)",
      "cover.date_location": "Location for date",
      "cover.signature_label": "Signature (scan/image, optional)",
      "cover.signature_choose": "Choose file",
      "cover.no_signature": "No signature",
      "cover.upload_signature": "Upload signature",
      "notify.cv_generated": "CV generated.",
      "notify.signature_uploaded": "Signature uploaded.",
      "notify.cover_generated": "Cover letter generated.",

      "monster.title": "Comprehensive Career Timeline",
      "monster.description": "Extract ALL responsibilities, tasks, achievements from your documents. No summarization, no limits.",
      "monster.warning": "⚠ Takes 30-45 seconds to analyze all documents",
      "monster.button": "Generate Monster CV",
      "monster.ready": "Monster CV ready",
      "monster.stats": "{count} entries · {range}",
      "monster.download": "Download Monster CV",
      "monster.generating": "Generating Monster CV...",
      "monster.step1": "Loading all uploaded documents...",
      "monster.step2": "Prioritizing Arbeitszeugnisse for detailed extraction...",
      "monster.step3": "Extracting every responsibility mentioned...",
      "monster.step4": "Capturing all achievements with metrics...",
      "monster.step5": "Building comprehensive timeline...",
      "monster.step6": "Sorting chronologically (most recent first)...",
      "monster.step7": "Preserving context and team details...",
      "monster.step8": "Compiling all skills and certifications...",
      "monster.step9": "Rendering archival PDF document...",
      "monster.step10": "Finalizing Monster CV...",

      "chat.title": "Request Changes",
      "chat.placeholder": "e.g. Make my summary shorter...",
      "chat.send": "Send",
      "chat.sending": "Applying changes...",
      "chat.error": "Could not apply changes.",

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

      "gen.generating": "Generating...",
      "gen.step1": "Sharpening digital pencils...",
      "gen.step2": "Teaching AI to appreciate your career choices...",
      "gen.step3": "Translating buzzwords into actual skills...",
      "gen.step4": "Convincing the algorithm you're awesome...",
      "gen.step5": "Formatting pixels with Swiss precision...",
      "gen.step6": "Adding that special Helvetica touch...",
      "gen.step7": "Almost there, polishing the final draft...",

      "validation.step1": "Analyzing readability & complexity...",
      "validation.step2": "Checking action verbs & metrics...",
      "validation.step3": "Validating visual balance...",

      "upload.processing": "Processing your documents...",
      "upload.step1": "Reading document contents...",
      "upload.step2": "Extracting text and structure...",
      "upload.step3": "Building your profile...",

      "comparison.show": "Show match analysis",
      "comparison.hide": "Hide match analysis",
      "comparison.original": "Original",
      "comparison.optimized": "Optimized for job ad",
      "comparison.loading": "Loading...",
      "comparison.error": "Could not load comparison.",
      "comparison.keywords_title": "Job ad vs CV keyword comparison",
      "comparison.job_ad_keywords": "Job ad keywords",
      "comparison.cv_coverage": "CV coverage",
      "comparison.keyword_matched": "Matched",
      "comparison.keyword_missing": "Missing",
      "comparison.no_keywords": "No keyword data available.",

      "strategic.title": "Application Strategy & Recommendations",
      "strategic.summary_label": "Summary",
      "strategic.strengths_label": "Your Strengths",
      "strategic.gaps_label": "Gaps to Address",
      "strategic.recommendations_label": "Specific Recommendations",
      "strategic.chat_title": "Ask About Recommendations",
      "strategic.chat_placeholder": "e.g., How should I address the Kubernetes gap?",
      "strategic.send": "Ask",

      "quality.title": "Quality Analysis",
      "quality.readability": "Readability (Flesch)",
      "quality.fog_index": "Complexity (Fog Index)",
      "quality.action_verbs": "Strong action verbs",
      "quality.quantification": "Quantified achievements",
      "quality.buzzwords": "Buzzword count",
      "quality.balance": "Section balance",
      "quality.tense": "Tense consistency",
      "quality.warning": "Quality check:",
      "quality.good": "Good",
      "quality.needs_improvement": "Needs improvement",

      "optimization.title": "Content Optimization",
      "optimization.subtitle": "How your input was tailored to match this job",
      "optimization.original": "Original",
      "optimization.optimized": "Job-Optimized",
      "optimization.improvements": "Improvements Made",
      "optimization.keywords_added": "Keywords added",
      "optimization.sections_enhanced": "Sections enhanced",
      "optimization.view_details": "View detailed comparison",

      "fmt.title": "Hey, you've clicked generate 6 times!",
      "fmt.nudge": "Since I'm an AI that doesn't fully understand the context of your professional life, help me get that context. Go back and add these details manually if things are missing:",
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
      "hero.description": "Aus Inserattext einen CV und Anschreiben generieren mit dem das RAV* glücklich ist und du vielleicht sogar eine Stelle findest.",
      "hero.sub": "*RAV steht natürlich für Richtig Angenehmer Verein",
      "footer.tagline": "Mit viel Liebe für dich und Hass für das Erstellen von Dokumenten entwickelt von Gusty aka Güney Usta aka du weisch wär.",

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
      "review.sub": "Vorlage und Farben wählen, zuerst Match-Score prüfen, dann über Generierung entscheiden.",
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
      "action.generate_cv": "CV generieren",
      "action.generate_cover": "Anschreiben generieren",
      "action.generate": "CV + Anschreiben generieren",
      "action.preview_match": "Match-Score Vorschau",
      "action.download_cv": "CV herunterladen",
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
      "text.review_recommend_low": "Score unter {threshold}. Generierung aktuell nicht empfohlen.",
      "text.review_recommend_high": "Score ab {threshold}. Generierung ist sinnvoll.",
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

      "cover.title": "Anschreiben",
      "cover.sender_street": "Absender Strasse",
      "cover.sender_plz": "Absender PLZ/Ort",
      "cover.recipient_street": "Empfänger Strasse",
      "cover.recipient_plz": "Empfänger PLZ/Ort",
      "cover.anrede_label": "Anrede",
      "cover.anrede_unknown": "Zuständige Person nicht bekannt",
      "cover.anrede_known": "Zuständige Person bekannt",
      "cover.anrede_input": "Anrede eingeben",
      "cover.contact_person": "Kontaktperson (z.H.)",
      "cover.date_location": "Ort für Datum",
      "cover.signature_label": "Unterschrift (Scan/Bild, optional)",
      "cover.signature_choose": "Datei wählen",
      "cover.no_signature": "Keine Unterschrift",
      "cover.upload_signature": "Unterschrift hochladen",
      "notify.cv_generated": "CV generiert.",
      "notify.signature_uploaded": "Unterschrift hochgeladen.",
      "notify.cover_generated": "Anschreiben generiert.",

      "monster.title": "Umfassende Karrierechronologie",
      "monster.description": "Extrahiere ALLE Verantwortlichkeiten, Aufgaben, Erfolge aus deinen Dokumenten. Keine Zusammenfassung, keine Limits.",
      "monster.warning": "⚠ Dauert 30-45 Sekunden für Analyse aller Dokumente",
      "monster.button": "Monster CV generieren",
      "monster.ready": "Monster CV bereit",
      "monster.stats": "{count} Einträge · {range}",
      "monster.download": "Monster CV herunterladen",
      "monster.generating": "Monster CV wird generiert...",
      "monster.step1": "Alle hochgeladenen Dokumente werden geladen...",
      "monster.step2": "Arbeitszeugnisse werden priorisiert für detaillierte Extraktion...",
      "monster.step3": "Jede erwähnte Verantwortlichkeit wird extrahiert...",
      "monster.step4": "Alle Erfolge mit Kennzahlen werden erfasst...",
      "monster.step5": "Umfassende Zeitleiste wird aufgebaut...",
      "monster.step6": "Chronologische Sortierung (neueste zuerst)...",
      "monster.step7": "Kontext und Teamdetails werden bewahrt...",
      "monster.step8": "Alle Skills und Zertifizierungen werden zusammengestellt...",
      "monster.step9": "Archiv-PDF wird gerendert...",
      "monster.step10": "Monster CV wird finalisiert...",

      "chat.title": "Änderungen anfragen",
      "chat.placeholder": "z.B. Zusammenfassung kürzen...",
      "chat.send": "Senden",
      "chat.sending": "Änderungen werden angewendet...",
      "chat.error": "Änderungen konnten nicht angewendet werden.",

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

      "gen.generating": "Generiere...",
      "gen.step1": "Digitale Stifte werden gespitzt...",
      "gen.step2": "KI lernt deine Karriereentscheidungen zu schätzen...",
      "gen.step3": "Buzzwords werden in echte Skills übersetzt...",
      "gen.step4": "Algorithmus wird überzeugt, dass du grossartig bist...",
      "gen.step5": "Pixel werden mit Schweizer Präzision formatiert...",
      "gen.step6": "Der besondere Helvetica-Touch wird hinzugefügt...",
      "gen.step7": "Fast fertig, letzter Feinschliff...",

      "validation.step1": "Lesbarkeit & Komplexität werden analysiert...",
      "validation.step2": "Aktionsverben & Metriken werden geprüft...",
      "validation.step3": "Visuelle Balance wird validiert...",

      "upload.processing": "Dokumente werden verarbeitet...",
      "upload.step1": "Dokumentinhalte werden gelesen...",
      "upload.step2": "Text und Struktur werden extrahiert...",
      "upload.step3": "Profil wird aufgebaut...",

      "comparison.show": "Match-Analyse anzeigen",
      "comparison.hide": "Match-Analyse ausblenden",
      "comparison.original": "Ursprünglich",
      "comparison.optimized": "Optimiert für Stelleninserat",
      "comparison.loading": "Laden...",
      "comparison.error": "Vergleich konnte nicht geladen werden.",
      "comparison.keywords_title": "Keyword Vergleich: Stelleninserat vs CV",
      "comparison.job_ad_keywords": "Keywords aus Inserat",
      "comparison.cv_coverage": "Abdeckung im CV",
      "comparison.keyword_matched": "Treffer",
      "comparison.keyword_missing": "Fehlend",
      "comparison.no_keywords": "Keine Keyword Daten verfügbar.",

      "strategic.title": "Bewerbungsstrategie & Empfehlungen",
      "strategic.summary_label": "Zusammenfassung",
      "strategic.strengths_label": "Ihre Stärken",
      "strategic.gaps_label": "Lücken",
      "strategic.recommendations_label": "Konkrete Empfehlungen",
      "strategic.chat_title": "Fragen zu Empfehlungen",
      "strategic.chat_placeholder": "z.B., Wie soll ich die Kubernetes-Lücke adressieren?",
      "strategic.send": "Fragen",

      "quality.title": "Qualitätsanalyse",
      "quality.readability": "Lesbarkeit (Flesch)",
      "quality.fog_index": "Komplexität (Fog-Index)",
      "quality.action_verbs": "Starke Aktionsverben",
      "quality.quantification": "Quantifizierte Erfolge",
      "quality.buzzwords": "Buzzword-Anzahl",
      "quality.balance": "Abschnittsbalance",
      "quality.tense": "Zeitform-Konsistenz",
      "quality.warning": "Qualitätsprüfung:",
      "quality.good": "Gut",
      "quality.needs_improvement": "Verbesserungsbedarf",

      "optimization.title": "Inhaltsoptimierung",
      "optimization.subtitle": "So wurde Ihre Eingabe an diese Stelle angepasst",
      "optimization.original": "Original",
      "optimization.optimized": "Job-Optimiert",
      "optimization.improvements": "Vorgenommene Verbesserungen",
      "optimization.keywords_added": "Keywords hinzugefügt",
      "optimization.sections_enhanced": "Abschnitte verbessert",
      "optimization.view_details": "Detailvergleich anzeigen",

      "fmt.title": "Hey, du hast 6 Mal auf Generieren geklickt!",
      "fmt.nudge": "Da ich eine KI bin, die den vollen Kontext deines Berufslebens nicht kennt, hilf mir dabei. Geh zurück und ergänze diese Details manuell, falls etwas fehlt:",
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
    artifactToken: "",
    monsterToken: "",
    monsterStats: null,
  };

  const statusBox = document.getElementById("global-status");
  const sessionMeta = document.getElementById("session-meta");
  const documentsList = document.getElementById("documents-list");
  const pendingUploadTags = document.getElementById("pending-upload-tags");
  const questionsList = document.getElementById("questions-list");
  const requiredSummary = document.getElementById("required-summary");
  const reviewScore = document.getElementById("review-score");
  const reviewRecommendation = document.getElementById("review-recommendation");
  const reviewMissing = document.getElementById("review-missing");
  const reviewKeywordComparison = document.getElementById("review-keyword-comparison");

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

  const coverSenderStreet = document.getElementById("cover-sender-street");
  const coverSenderPlz = document.getElementById("cover-sender-plz");
  const coverRecipientStreet = document.getElementById("cover-recipient-street");
  const coverRecipientPlz = document.getElementById("cover-recipient-plz");
  const coverAnredeKnown = document.getElementById("cover-anrede-known");
  const coverAnredeCustomWrap = document.getElementById("cover-anrede-custom-wrap");
  const coverAnredeCustom = document.getElementById("cover-anrede-custom");
  const coverRecipientContactWrap = document.getElementById("cover-recipient-contact-wrap");
  const coverRecipientContact = document.getElementById("cover-recipient-contact");
  const coverDateLocation = document.getElementById("cover-date-location");
  const signatureFile = document.getElementById("signature-file");
  const signatureFileTrigger = document.getElementById("signature-file-trigger");
  const signatureFileName = document.getElementById("signature-file-name");
  const btnUploadSignature = document.getElementById("upload-signature-btn");
  const btnGenerateCover = document.getElementById("generate-cover-btn");
  const coverLetterSection = document.getElementById("cover-letter-section");
  const cvGeneratedInfo = document.getElementById("cv-generated-info");
  const cvDownloadLink = document.getElementById("cv-download-link");

  const pasteText = document.getElementById("paste-text");
  const btnPasteSubmit = document.getElementById("paste-submit-btn");

  const btnStartContinue = document.getElementById("start-continue-btn");
  const btnUploadContinue = document.getElementById("upload-continue-btn");
  const btnUpload = document.getElementById("upload-btn");
  const btnUploadPhoto = document.getElementById("upload-photo-btn");
  const btnExtract = document.getElementById("extract-btn");
  const btnAnswers = document.getElementById("save-answers-btn");
  const btnGenerate = document.getElementById("generate-btn");
  const btnPreviewMatch = document.getElementById("preview-match-btn");
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
    if (btnPreviewMatch) btnPreviewMatch.disabled = !hasSession || !hasDocs || !state.server?.job_ad_text;
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
      if (reviewRecommendation) reviewRecommendation.style.display = "none";
      reviewMissing.innerHTML = "";
      if (reviewKeywordComparison) reviewKeywordComparison.innerHTML = `<p>${t("comparison.no_keywords")}</p>`;
      return;
    }
    reviewScore.innerHTML = `
      ${extractionWarning ? `<div class="alert warn">${extractionWarning}</div>` : ""}
      <strong>${t("text.review_score")}: ${payload.overall_score.toFixed(1)} / 100</strong>
      <p>${t("text.ats")}: ${(payload.category_scores?.ats_compatibility || 0).toFixed(1)} · ${t("text.skills")}: ${(payload.category_scores?.skills_match || 0).toFixed(1)}</p>
    `;
    const missing = payload.missing_keywords || [];
    const issues = payload.ats_issues || [];
    const lowScore = payload.overall_score < REVIEW_RECOMMEND_THRESHOLD;
    if (reviewRecommendation) {
      const recommendation = lowScore ? t("text.review_recommend_low") : t("text.review_recommend_high");
      reviewRecommendation.className = `alert ${lowScore ? "warn" : "success"}`;
      reviewRecommendation.textContent = recommendation.replace("{threshold}", String(REVIEW_RECOMMEND_THRESHOLD));
      reviewRecommendation.style.display = "";
    }
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
    renderKeywordComparisonTable(reviewKeywordComparison, payload);
    displayQualityMetrics();
    displayOptimizationComparison();
  }

  function renderKeywordComparisonTable(container, payload) {
    if (!container) return;
    const matched = payload?.matched_keywords || [];
    const missing = payload?.missing_keywords || [];
    const issues = payload?.ats_issues || [];
    const combined = [
      ...matched.map((kw) => ({ keyword: kw, matched: true })),
      ...missing.map((kw) => ({ keyword: kw, matched: false })),
    ];
    if (!combined.length && !issues.length) {
      container.innerHTML = `<p>${t("comparison.no_keywords")}</p>`;
      return;
    }
    const chips = (list, isMatched) =>
      list.length
        ? list.map((kw) => `<span class="kw-chip ${isMatched ? "kw-chip-match" : "kw-chip-missing"}">${escHtml(kw)}</span>`).join(" ")
        : `<span class="kw-empty">${t("text.none")}</span>`;
    const combinedChips = combined.length
      ? combined.map((item) => `<span class="kw-chip ${item.matched ? "kw-chip-match" : "kw-chip-missing"}">${escHtml(item.keyword)}</span>`).join(" ")
      : `<span class="kw-empty">${t("text.none")}</span>`;
    const atsText = issues.length ? escHtml(issues.join(" · ")) : t("text.none");
    container.innerHTML = `
      <table class="comparison-table comparison-table-keywords">
        <thead>
          <tr>
            <th>${t("comparison.job_ad_keywords")}</th>
            <th>${t("comparison.cv_coverage")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${combinedChips}</td>
            <td>
              <div class="kw-group"><strong>${t("comparison.keyword_matched")}</strong><div class="kw-chip-wrap">${chips(matched, true)}</div></div>
              <div class="kw-group"><strong>${t("comparison.keyword_missing")}</strong><div class="kw-chip-wrap">${chips(missing, false)}</div></div>
            </td>
          </tr>
          <tr>
            <td><strong>${t("text.ats_issues")}</strong></td>
            <td>${atsText}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  function displayQualityMetrics() {
    const quality = state.server?.review_match?.quality_metrics;
    const container = document.getElementById("quality-content");
    if (!container || !quality) return;

    const getScoreClass = (score, threshold, invert) => {
      if (invert) return score <= threshold ? "good" : "warn";
      return score >= threshold ? "good" : "warn";
    };

    const metrics = [
      {
        key: "readability_score",
        label: t("quality.readability"),
        value: quality.readability_score || 0,
        target: 60,
        format: (v) => `${v.toFixed(1)}/100`,
        help: "60-70 = optimal, <50 = too complex",
        invert: false
      },
      {
        key: "fog_index",
        label: t("quality.fog_index"),
        value: quality.fog_index || 0,
        target: 14,
        format: (v) => v.toFixed(1),
        help: "12-14 years = professional, >16 = too complex",
        invert: true
      },
      {
        key: "action_verb_ratio",
        label: t("quality.action_verbs"),
        value: quality.action_verb_ratio || 0,
        target: 0.6,
        format: (v) => `${(v*100).toFixed(0)}%`,
        help: "Target: >60% strong verbs",
        invert: false
      },
      {
        key: "quantification_ratio",
        label: t("quality.quantification"),
        value: quality.quantification_ratio || 0,
        target: 0.4,
        format: (v) => `${(v*100).toFixed(0)}%`,
        help: "Target: >40% with metrics",
        invert: false
      },
      {
        key: "buzzword_count",
        label: t("quality.buzzwords"),
        value: quality.buzzword_count || 0,
        target: 3,
        format: (v) => String(v),
        help: "Lower is better, >3 = too many",
        invert: true
      },
    ];

    let html = '<div class="quality-grid">';

    metrics.forEach(m => {
      const val = m.value;
      const isGood = m.invert
        ? (typeof val === 'number' && val <= m.target)
        : (typeof val === 'number' && val >= m.target);
      const badge = isGood ? t("quality.good") : t("quality.needs_improvement");
      const badgeClass = isGood ? "badge-success" : "badge-warn";

      html += `
        <div class="quality-metric">
          <div class="quality-label">${escHtml(m.label)}</div>
          <div class="quality-value">${escHtml(m.format(val))}</div>
          <div class="quality-badge ${badgeClass}">${escHtml(badge)}</div>
          ${m.help ? `<div class="quality-help">${escHtml(m.help)}</div>` : ''}
        </div>
      `;
    });

    html += '</div>';

    if (quality.warnings && quality.warnings.length > 0) {
      html += '<div class="alert alert-warn" style="margin-top: 16px;">';
      html += `<strong>${escHtml(t("quality.warning"))}</strong><ul>`;
      quality.warnings.forEach(w => {
        html += `<li>${escHtml(w)}</li>`;
      });
      html += '</ul></div>';
    }

    container.innerHTML = html;
  }

  function displayOptimizationComparison() {
    const artifact = state.server?.result_artifact;
    if (!artifact) return;

    const comparison = artifact.comparison_sections;
    const metadata = artifact.meta?.comparison_metadata;
    const container = document.getElementById("optimization-content");

    if (!container || !comparison) return;

    let statsHtml = '<div class="optimization-stats">';
    if (metadata) {
      statsHtml += `
        <div class="stat">
          <span class="stat-label">${escHtml(t("optimization.keywords_added"))}</span>
          <span class="stat-value">${metadata.keywords_added || 0}</span>
        </div>
        <div class="stat">
          <span class="stat-label">${escHtml(t("optimization.sections_enhanced"))}</span>
          <span class="stat-value">${metadata.transformations?.experience_optimized || 0}</span>
        </div>
      `;
    }
    statsHtml += '</div>';

    let comparisonHtml = '<div class="comparison-grid">';

    if (comparison.length > 0) {
      comparison.slice(0, 4).forEach((section) => {
        const label = state.language === "de" ? section.label_de : section.label_en;
        comparisonHtml += `
          <div class="comparison-section">
            <h4>${escHtml(label)}</h4>
            <div class="comparison-row">
              <div class="comparison-col">
                <label>${escHtml(t("optimization.original"))}</label>
                <p class="text-muted">${escHtml(section.original || "N/A")}</p>
              </div>
              <div class="comparison-col">
                <label>${escHtml(t("optimization.optimized"))}</label>
                <p class="text-primary">${escHtml(section.optimized || "N/A")}</p>
              </div>
            </div>
          </div>
        `;
      });
    }

    comparisonHtml += '</div>';

    container.innerHTML = statsHtml + comparisonHtml;
  }

  function renderResultKeywordComparison() {
    const payloadEl = document.getElementById("result-match-payload");
    const container = document.getElementById("result-keyword-comparison");
    if (!payloadEl || !container) return;
    try {
      const payload = JSON.parse(payloadEl.textContent || "{}");
      renderKeywordComparisonTable(container, payload);
    } catch (_) {
      container.innerHTML = `<p>${t("comparison.no_keywords")}</p>`;
    }
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

    showGeneratingOverlay(getUploadSteps());
    try {
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
    } finally {
      hideGeneratingOverlay();
    }
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
    showGeneratingOverlay(getUploadSteps());
    try {
      const tag = "other";
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
    } finally {
      hideGeneratingOverlay();
    }
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

  // ============================================================
  // GENERATING OVERLAY
  // ============================================================

  let genOverlayEl = null;
  let genMessageEl = null;
  let genDotsEl = null;
  let genTimer = null;
  let genStepIndex = 0;

  function getGenSteps() {
    return [
      t("gen.step1"),
      t("gen.step2"),
      t("validation.step1"),
      t("validation.step2"),
      t("validation.step3"),
      t("gen.step3"),
      t("gen.step4"),
      t("gen.step5"),
      t("gen.step6"),
      t("gen.step7"),
    ];
  }

  function getUploadSteps() {
    return [t("upload.step1"), t("upload.step2"), t("upload.step3")];
  }

  function getMonsterSteps() {
    return [
      t("monster.step1"), t("monster.step2"), t("monster.step3"), t("monster.step4"),
      t("monster.step5"), t("monster.step6"), t("monster.step7"), t("monster.step8"),
      t("monster.step9"), t("monster.step10"),
    ];
  }

  function createGenOverlay() {
    if (genOverlayEl) return;
    genOverlayEl = document.createElement("div");
    genOverlayEl.className = "gen-overlay";
    genOverlayEl.innerHTML = [
      '<div class="gen-spinner"></div>',
      '<div class="gen-message"></div>',
      '<div class="gen-progress-dots"></div>',
    ].join("");
    document.body.appendChild(genOverlayEl);
    genMessageEl = genOverlayEl.querySelector(".gen-message");
    genDotsEl = genOverlayEl.querySelector(".gen-progress-dots");
  }

  function showGeneratingOverlay(customSteps) {
    createGenOverlay();
    genStepIndex = 0;
    const steps = customSteps || getGenSteps();
    genDotsEl.innerHTML = steps.map((_, i) =>
      '<span class="gen-dot' + (i === 0 ? " active" : "") + '"></span>'
    ).join("");
    updateOverlayMessage(steps);
    genOverlayEl.classList.add("visible");
    genTimer = setInterval(() => {
      genStepIndex = (genStepIndex + 1) % steps.length;
      updateOverlayMessage(steps);
    }, 3000);
  }

  function hideGeneratingOverlay() {
    if (genTimer) { clearInterval(genTimer); genTimer = null; }
    if (genOverlayEl) genOverlayEl.classList.remove("visible");
  }

  function updateOverlayMessage(steps) {
    if (!genMessageEl) return;
    genMessageEl.style.animation = "none";
    void genMessageEl.offsetHeight;
    genMessageEl.style.animation = "";
    genMessageEl.textContent = steps[genStepIndex];
    if (genDotsEl) {
      const dots = genDotsEl.querySelectorAll(".gen-dot");
      dots.forEach((d, i) => d.classList.toggle("active", i <= genStepIndex));
    }
  }

  async function generate() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    trackGenerate();
    showGeneratingOverlay();
    try {
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
      state.artifactToken = data.token || "";
      notify("success", t("notify.cv_generated"));
      if (cvGeneratedInfo) cvGeneratedInfo.style.display = "";
      if (cvDownloadLink && data.download_cv_url) {
        cvDownloadLink.href = data.download_cv_url;
        // Auto-open PDF in new tab
        window.open(data.download_cv_url, '_blank');
      }
      if (coverLetterSection) coverLetterSection.style.display = "";
      if (btnGenerateCover) btnGenerateCover.disabled = false;
      const chatSection = document.getElementById("chat-corrections");
      if (chatSection) chatSection.style.display = "";
    } finally {
      hideGeneratingOverlay();
    }
  }

  async function generateMonsterCV() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    showGeneratingOverlay(getMonsterSteps());
    try {
      const response = await fetch(endpoint(`/api/session/${state.sessionId}/generate-monster`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await parseJsonResponse(response);
      state.monsterToken = data.token || "";
      state.monsterStats = {
        entry_count: data.entry_count || 0,
        date_range: data.date_range || "",
        filename: data.filename || "MonsterCV.pdf",
      };
      saveLocal();
      notify("success", t("monster.ready"));
      renderCurrentPage();
    } catch (err) {
      notify("error", err.message || t("error.action_failed"));
    } finally {
      hideGeneratingOverlay();
    }
  }

  async function previewMatch() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    showGeneratingOverlay();
    try {
      const response = await fetch(endpoint(`/api/session/${state.sessionId}/preview-match`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await parseJsonResponse(response);

      // Update state with preview match data
      if (!state.server) state.server = {};
      state.server.review_match = data.match;
      state.server.strategic_analysis = data.strategic_analysis;

      saveLocal();
      renderReview();
      renderStrategicAnalysis();

      if (data.recommendation === "improve") {
        notify("warn", data.suggestion || t("text.review_recommend_low").replace("{threshold}", "70"));
      } else {
        notify("success", t("text.review_recommend_high").replace("{threshold}", "70"));
      }
    } catch (err) {
      notify("error", err.message || t("error.action_failed"));
    } finally {
      hideGeneratingOverlay();
    }
  }

  async function sendChatCorrection() {
    const input = document.getElementById("chat-input");
    const messagesDiv = document.getElementById("chat-messages");
    const message = (input?.value || "").trim();
    if (!message || !state.artifactToken || !state.sessionId) return;

    const userBubble = document.createElement("div");
    userBubble.className = "chat-msg user";
    userBubble.textContent = message;
    messagesDiv.appendChild(userBubble);
    input.value = "";
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    showGeneratingOverlay();
    try {
      const resp = await fetch(endpoint(`/api/session/${state.sessionId}/chat`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, token: state.artifactToken }),
      });
      const data = await parseJsonResponse(resp);

      const botBubble = document.createElement("div");
      botBubble.className = "chat-msg assistant";
      botBubble.textContent = data.message || t("chat.sending");
      messagesDiv.appendChild(botBubble);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      state.artifactToken = data.token;
      if (cvDownloadLink && data.download_cv_url) cvDownloadLink.href = data.download_cv_url;
      notify("success", t("notify.cv_generated"));
    } catch (err) {
      const errBubble = document.createElement("div");
      errBubble.className = "chat-msg assistant";
      errBubble.textContent = t("chat.error");
      messagesDiv.appendChild(errBubble);
    } finally {
      hideGeneratingOverlay();
    }
  }

  function renderStrategicAnalysis() {
    const accordion = document.getElementById("strategic-accordion");
    const content = document.getElementById("strategic-content");
    if (!accordion || !content) return;

    const strategic = state.server?.strategic_analysis;
    if (!strategic) {
      accordion.style.display = "none";
      return;
    }

    accordion.style.display = "";
    content.innerHTML = [
      `<div class="alert info" style="margin-bottom: 12px;">`,
      `<strong>${t("strategic.summary_label")}:</strong> ${escHtml(strategic.summary)}`,
      `</div>`,
      `<div class="row-card">`,
      `<strong>${t("strategic.strengths_label")}</strong>`,
      `<ul>${strategic.strengths.map(s => `<li>${escHtml(s)}</li>`).join("")}</ul>`,
      `</div>`,
      `<div class="row-card">`,
      `<strong>${t("strategic.gaps_label")}</strong>`,
      `<ul>${strategic.gaps.map(g => `<li>${escHtml(g)}</li>`).join("")}</ul>`,
      `</div>`,
      `<div class="row-card">`,
      `<strong>${t("strategic.recommendations_label")}</strong>`,
      `<ul>${strategic.recommendations.map(r => `<li>${escHtml(r)}</li>`).join("")}</ul>`,
      `</div>`,
    ].join("");
  }

  async function sendStrategicQuestion() {
    const input = document.getElementById("strategic-input");
    const messagesDiv = document.getElementById("strategic-messages");
    const message = (input?.value || "").trim();
    if (!message || !state.sessionId) return;

    const userBubble = document.createElement("div");
    userBubble.className = "chat-msg user";
    userBubble.textContent = message;
    messagesDiv.appendChild(userBubble);
    input.value = "";
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const resp = await fetch(endpoint(`/api/session/${state.sessionId}/ask-recommendation`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await parseJsonResponse(resp);

      const botBubble = document.createElement("div");
      botBubble.className = "chat-msg assistant";
      botBubble.textContent = data.response || "";
      messagesDiv.appendChild(botBubble);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (err) {
      notify("error", err.message || t("error.action_failed"));
    }
  }

  async function uploadSignature() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    if (!signatureFile) throw new Error(t("error.select_files_first"));
    const files = Array.from(signatureFile.files || []);
    if (!files.length) throw new Error(t("error.select_files_first"));
    const formData = new FormData();
    formData.append("file", files[0]);
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/signature`), {
      method: "POST",
      body: formData,
    });
    await parseJsonResponse(response);
    signatureFile.value = "";
    if (signatureFileName) signatureFileName.textContent = t("cover.no_signature");
    if (btnUploadSignature) btnUploadSignature.disabled = true;
    notify("success", t("notify.signature_uploaded"));
  }

  async function generateCoverLetter() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    showGeneratingOverlay();
    try {
      const known = coverAnredeKnown?.value === "yes";
      let anrede = "";
      if (known && coverAnredeCustom?.value?.trim()) {
        anrede = coverAnredeCustom.value.trim();
      } else {
        anrede = state.uiLanguage === "de" ? "Sehr geehrte Damen und Herren" : "Dear Hiring Team";
      }
      const payload = {
        recipient_company: state.server?.company_name || "",
        recipient_street: coverRecipientStreet?.value || "",
        recipient_plz_ort: coverRecipientPlz?.value || "",
        recipient_contact: known ? (coverRecipientContact?.value || "") : "",
        cover_date_location: coverDateLocation?.value || "",
        cover_anrede: anrede,
        sender_street: coverSenderStreet?.value || "",
        sender_plz_ort: coverSenderPlz?.value || "",
        filename_cover: filenameCoverInput?.value || "",
      };
      const response = await fetch(endpoint(`/api/session/${state.sessionId}/generate-cover`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response);
      notify("success", t("notify.cover_generated"));
      if (data.result_url) {
        window.location.assign(data.result_url);
      }
    } finally {
      hideGeneratingOverlay();
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
        <p>${t("fmt.nudge")}</p>
        <p style="margin-top:8px">${t("fmt.intro")}</p>
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
    if (generateTimestamps.length >= 6) showFormatGuide();
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

  function renderMonsterCVSection() {
    const monsterSection = document.getElementById("monster-cv-section");
    if (!monsterSection) return;

    if (state.monsterToken && state.monsterStats) {
      const stats = t("monster.stats")
        .replace("{count}", state.monsterStats.entry_count)
        .replace("{range}", state.monsterStats.date_range);
      monsterSection.innerHTML = [
        '<div class="card" style="background: var(--success-bg, #f0fdf4); border-color: var(--success, #10b981);">',
        `<h3>${t("monster.ready")}</h3>`,
        `<p>${t("monster.description")}</p>`,
        `<p style="font-size: 0.9em; color: #666; margin: 0.5rem 0;">${stats}</p>`,
        `<a class="btn" href="${rootPath}/download/monster/${state.monsterToken}">${t("monster.download")}</a>`,
        '</div>',
      ].join("");
    } else if (state.sessionId && state.artifactToken) {
      monsterSection.innerHTML = [
        '<div class="card" style="border: 2px dashed #ccc;">',
        `<h3>${t("monster.title")}</h3>`,
        `<p>${t("monster.description")}</p>`,
        `<p style="font-size: 0.9em; color: #666;">${t("monster.warning")}</p>`,
        `<button id="btn-generate-monster" class="btn-primary">${t("monster.button")}</button>`,
        '</div>',
      ].join("");
      const btnGenerateMonster = document.getElementById("btn-generate-monster");
      if (btnGenerateMonster) {
        btnGenerateMonster.addEventListener("click", () => run(generateMonsterCV));
      }
    } else {
      monsterSection.innerHTML = "";
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
    renderResultKeywordComparison();
    renderMonsterCVSection();
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

    if (coverAnredeKnown) {
      coverAnredeKnown.addEventListener("change", () => {
        const known = coverAnredeKnown.value === "yes";
        if (coverAnredeCustomWrap) coverAnredeCustomWrap.style.display = known ? "" : "none";
        if (coverRecipientContactWrap) coverRecipientContactWrap.style.display = known ? "" : "none";
      });
    }
    if (signatureFile) {
      signatureFile.addEventListener("change", () => {
        const files = Array.from(signatureFile.files || []);
        if (signatureFileName) signatureFileName.textContent = files.length ? files[0].name : t("cover.no_signature");
        if (btnUploadSignature) btnUploadSignature.disabled = !files.length;
      });
    }
    if (signatureFileTrigger && signatureFile) {
      signatureFileTrigger.addEventListener("click", () => signatureFile.click());
    }
    if (btnUploadSignature) btnUploadSignature.addEventListener("click", () => run(uploadSignature));
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
    if (btnPreviewMatch) btnPreviewMatch.addEventListener("click", () => run(previewMatch));
    if (btnGenerate) btnGenerate.addEventListener("click", () => run(generate));
    if (btnGenerateCover) btnGenerateCover.addEventListener("click", () => run(generateCoverLetter));
    const chatSendBtn = document.getElementById("chat-send-btn");
    const chatInput = document.getElementById("chat-input");
    if (chatSendBtn) chatSendBtn.addEventListener("click", () => run(sendChatCorrection));
    if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(sendChatCorrection); });

    const strategicSendBtn = document.getElementById("strategic-send-btn");
    const strategicInput = document.getElementById("strategic-input");
    if (strategicSendBtn) strategicSendBtn.addEventListener("click", () => run(sendStrategicQuestion));
    if (strategicInput) strategicInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(sendStrategicQuestion); });

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
