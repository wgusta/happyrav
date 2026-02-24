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

  const STEP_ORDER = ["start", "upload", "questions", "review", "result", "cover"];
  const STEP_PROGRESS = {
    start: 0,
    upload: 20,
    questions: 40,
    review: 60,
    result: 80,
    cover: 100,
  };

  const I18N = {
    en: {
      "page.title": "happyRAV · Application Wizard",
      "hero.description": "Generate a CV and cover letter from a job ad that keeps the RAV* happy and maybe even lands you a job.",
      "hero.sub": "*RAV naturally stands for Resume Altering Vessel",
      "footer.tagline": "Developed with love for you and hate for creating documents by Gusty aka Gueney Usta aka you know who I am.",
      "nav.builder": "CV Builder",

      "progress.start": "Start",
      "progress.upload": "Data",
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

      "upload.page_title": "Enter your CV details",
      "upload.page_sub": "Fill in your profile manually, section by section.",
      "upload.title": "CV Details",
      "upload.supported": "Supported: PDF, DOCX, PNG, JPG, JPEG, WEBP. Max 20 files/session, 12MB/file, 25MB/session.",
      "upload.photo_heading": "Profile Photo",
      "upload.photo_sub": "Optional: Add a professional headshot for your CV",
      "upload.photo": "Profile photo (optional)",

      "upload.cv_contact": "Contact Info",
      "upload.cv_name": "Full name",
      "upload.cv_headline": "Headline / Title",
      "upload.cv_email": "Email",
      "upload.cv_phone": "Phone",
      "upload.cv_location": "Location",
      "upload.cv_linkedin": "LinkedIn",
      "upload.cv_portfolio": "Portfolio",
      "upload.cv_ph_headline": "Senior Software Engineer",
      "upload.cv_summary": "Professional Summary",
      "upload.cv_summary_label": "Summary",
      "upload.cv_ph_summary": "Brief overview of your professional background and key strengths...",
      "upload.cv_skills": "Skills",
      "upload.cv_add_skill": "+ Add Skill",
      "upload.cv_ph_skill": "e.g. Python, Project Management, SQL",
      "upload.cv_languages": "Languages",
      "upload.cv_add_language": "+ Add Language",
      "upload.cv_ph_language": "e.g. German",
      "upload.cv_ph_proficiency": "e.g. Native, C1, Fluent",
      "upload.cv_ph_skill_level": "e.g. Expert, 5+ years",
      "upload.cv_ph_duties": "Tasks from Arbeitszeugnis or job description",
      "upload.cv_ph_successes": "e.g. Increased revenue by 30%, Reduced costs by CHF 50k",
      "upload.cv_ph_learned": "Key subjects, skills, or competencies gained",
      "upload.cv_ph_grade": "Grade / GPA",
      "upload.cv_ph_start_month": "01/2020",
      "upload.cv_ph_end_month": "12/2024 or present",
      "upload.start_month": "Start (MM/YYYY)",
      "upload.end_month": "End (MM/YYYY or present)",
      "upload.stellenbeschrieb": "Job Description",
      "upload.leistungen": "Achievements / Results",
      "upload.skill_level": "Level",
      "upload.duties": "Tasks / Duties",
      "upload.successes": "Achievements (quantified)",
      "upload.learned": "Key Learnings",
      "upload.grade": "Grade / GPA",
      "tooltip.skill_level": "Rate your proficiency: Expert, Advanced, Intermediate, Beginner",
      "tooltip.duties": "List tasks from your Arbeitszeugnis or job description",
      "tooltip.successes": "Quantify achievements: 'Increased sales by 25%', 'Reduced costs by CHF 50k'",
      "tooltip.learned": "Key subjects, skills, or competencies gained",
      "tooltip.grade": "Final grade, GPA, or distinction",
      "tooltip.stellenbeschrieb": "Describe your role and responsibilities",
      "tooltip.leistungen": "List achievements with measurable results",
      "upload.cv_experience": "Experience",
      "upload.cv_add_experience": "+ Add Experience",
      "upload.cv_education": "Education",
      "upload.cv_add_education": "+ Add Education",
      "upload.cv_achievements": "Achievements",
      "upload.cv_add_achievement": "+ Add Achievement",
      "upload.cv_ph_achievement": "e.g. Increased revenue by 30%",

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
      "action.preview_match": "Preview Match Score",
      "action.generate_cv": "Generate CV",
      "action.generate_cover": "Generate Cover Letter",
      "action.generate": "Generate CV + Cover Letter",
      "action.download_cv": "Download CV",
      "action.continue_upload": "Continue to Data",
      "action.continue_questions": "Continue to Questions",
      "action.continue_review": "Continue to Review",
      "action.back_start": "Back to Start",
      "action.back_upload": "Back to Data",
      "action.back_questions": "Back to Questions",
      "action.back_review": "Back to Review",
      "action.back_result": "Back to CV Result",
      "action.next_cover": "Next: Cover Letter (optional)",
      "action.new_session": "Start New Session",

      "result.title": "Your Generated CV",
      "result.sub": "Preview your CV below. Download as HTML or Markdown, then optionally create a cover letter.",
      "result.download_html": "Download HTML",
      "result.download_md": "Download Markdown",
      "result.chat_title": "Refine your CV",
      "result.chat_placeholder": "e.g. Make the summary more concise",
      "result.chat_send": "Send",
      "cover.sub": "Optional: Generate a tailored cover letter to accompany your CV.",
      "cover.result_title": "Your Cover Letter",
      "cover.download_html": "Download HTML",

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
      "text.quality_warnings": "Quality Warnings",
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

      "tone.title": "Writing Tone",
      "tone.description": "Control how your CV uses industry buzzwords and technical jargon. Pragmatic: plain, factual language that anyone understands. Buzzwordy: keyword-rich language optimized for ATS systems and recruiters familiar with your industry.",
      "tone.pragmatic": "Pragmatic",
      "tone.buzzwordy": "Buzzwordy",

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

      "notify.session_started": "Session started.",
      "notify.documents_uploaded": "Documents uploaded.",
      "notify.extraction_refreshed": "Extraction refreshed.",
      "notify.answers_saved": "Answers saved.",
      "notify.files_generated": "Files generated.",
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

      "gap.strengths_title": "Your Strengths",
      "gap.strong_technical": "Strong technical skills match",
      "gap.strong_soft": "Good soft skills alignment",
      "gap.transferable_skills": "Transferable skills identified",
      "gap.areas_to_address": "Areas to Address",
      "gap.critical": "Critical gaps",
      "gap.important": "Important gaps",
      "gap.nice_to_have": "Nice to have",
      "gap.no_specific_gaps": "Overall good match. Consider emphasizing relevant keywords in your CV.",

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
      "optimization.no_data": "No data available",

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

      "builder.title": "CV Builder",
      "builder.subtitle": "Build your CV directly. No upload, no AI. Type your data, pick a template, download.",
      "builder.template_label": "Template",
      "builder.language_label": "CV Language",
      "builder.personal_info": "Personal Information",
      "builder.full_name": "Full Name",
      "builder.headline": "Headline / Job Title",
      "builder.address": "Address",
      "builder.email": "Email",
      "builder.phone": "Phone",
      "builder.portfolio": "Portfolio / Website",
      "builder.birthdate": "Birthdate",
      "builder.photo": "Photo",
      "builder.photo_warn": "Photo exceeds 500KB, may increase file size.",
      "builder.summary": "Summary / Profile",
      "builder.kpis": "KPIs (Cut Set / Business only)",
      "builder.skills": "Skills",
      "builder.languages": "Languages",
      "builder.language_item": "Language",
      "builder.experience": "Experience",
      "builder.experience_hint": "Tip: Use bullet points from reference letters (Arbeitszeugnisse) for accurate, verifiable descriptions.",
      "builder.experience_item": "Position",
      "builder.education": "Education",
      "builder.education_item": "Degree",
      "builder.certifications": "Certifications",
      "builder.certification_item": "Certification",
      "builder.military": "Military",
      "builder.military_item": "Entry",
      "builder.projects": "Projects",
      "builder.project_item": "Project",
      "builder.references": "References",
      "builder.reference_item": "Reference",
      "builder.refs_on_request": "References available on request",
      "builder.preview": "Preview",
      "builder.download": "Download HTML",
      "builder.export_md": "Export Markdown",
      "builder.export_json": "Export JSON",
      "builder.import_json": "Import JSON",
      "builder.preview_title": "Preview",
      "builder.ph_full_name": "Max Muster",
      "builder.ph_headline": "Software Engineer",
      "builder.ph_address": "Bahnhofstr. 1, 8001 Zurich",
      "builder.ph_summary": "Brief professional summary...",
    },
    de: {
      "page.title": "happyRAV · Bewerbungs-Wizard",
      "hero.description": "Aus Inserattext einen CV und Anschreiben generieren mit dem das RAV* glücklich ist und du vielleicht sogar eine Stelle findest.",
      "hero.sub": "*RAV steht natürlich für Richtig Angenehmer Verein",
      "footer.tagline": "Mit viel Liebe für dich und Hass für das Erstellen von Dokumenten entwickelt von Gusty aka Güney Usta aka du weisch wär.",
      "nav.builder": "CV Builder",

      "progress.start": "Start",
      "progress.upload": "Daten",
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

      "upload.page_title": "CV Daten eingeben",
      "upload.page_sub": "Profil manuell ausfüllen, Abschnitt für Abschnitt.",
      "upload.title": "CV Daten",
      "upload.supported": "Unterstützt: PDF, DOCX, PNG, JPG, JPEG, WEBP. Max 20 Dateien/Sitzung, 12MB/Datei, 25MB/Sitzung.",
      "upload.photo_heading": "Profilfoto",
      "upload.photo_sub": "Optional: Füge ein professionelles Foto für deinen CV hinzu",
      "upload.photo": "Profilfoto (optional)",

      "upload.cv_contact": "Kontaktdaten",
      "upload.cv_name": "Vollständiger Name",
      "upload.cv_headline": "Titel / Position",
      "upload.cv_email": "E-Mail",
      "upload.cv_phone": "Telefon",
      "upload.cv_location": "Ort",
      "upload.cv_linkedin": "LinkedIn",
      "upload.cv_portfolio": "Portfolio",
      "upload.cv_ph_headline": "Senior Software Engineer",
      "upload.cv_summary": "Profil-Zusammenfassung",
      "upload.cv_summary_label": "Zusammenfassung",
      "upload.cv_ph_summary": "Kurzer Überblick über beruflichen Hintergrund und Kernstärken...",
      "upload.cv_skills": "Skills",
      "upload.cv_add_skill": "+ Skill hinzufügen",
      "upload.cv_ph_skill": "z.B. Python, Projektmanagement, SQL",
      "upload.cv_languages": "Sprachen",
      "upload.cv_add_language": "+ Sprache hinzufügen",
      "upload.cv_ph_language": "z.B. Deutsch",
      "upload.cv_ph_proficiency": "z.B. Muttersprache, C1, Fliessend",
      "upload.cv_ph_skill_level": "z.B. Experte, 5+ Jahre",
      "upload.cv_ph_duties": "Aufgaben gemäss Arbeitszeugnis oder Stellenbeschreibung",
      "upload.cv_ph_successes": "z.B. Umsatz um 30% gesteigert, Kosten um CHF 50k reduziert",
      "upload.cv_ph_learned": "Wichtige Fächer, Fähigkeiten oder Kompetenzen",
      "upload.cv_ph_grade": "Note / Durchschnitt",
      "upload.cv_ph_start_month": "01/2020",
      "upload.cv_ph_end_month": "12/2024 oder heute",
      "upload.start_month": "Beginn (MM/JJJJ)",
      "upload.end_month": "Ende (MM/JJJJ oder heute)",
      "upload.stellenbeschrieb": "Stellenbeschrieb",
      "upload.leistungen": "Leistungen / Erfolge",
      "upload.skill_level": "Niveau",
      "upload.duties": "Aufgaben / Tätigkeiten",
      "upload.successes": "Erfolge (quantifiziert)",
      "upload.learned": "Wichtige Lerninhalte",
      "upload.grade": "Note / Durchschnitt",
      "tooltip.skill_level": "Bewerte deine Kompetenz: Experte, Fortgeschritten, Mittelstufe, Anfänger",
      "tooltip.duties": "Aufgaben gemäss Arbeitszeugnis oder Stellenbeschreibung auflisten",
      "tooltip.successes": "Erfolge quantifizieren: 'Umsatz um 25% gesteigert', 'Kosten um CHF 50k reduziert'",
      "tooltip.learned": "Wichtige Fächer, Fähigkeiten oder Kompetenzen",
      "tooltip.grade": "Abschlussnote, Durchschnitt oder Auszeichnung",
      "tooltip.stellenbeschrieb": "Rolle und Aufgaben beschreiben",
      "tooltip.leistungen": "Erfolge mit messbaren Ergebnissen auflisten",
      "upload.cv_experience": "Berufserfahrung",
      "upload.cv_add_experience": "+ Erfahrung hinzufügen",
      "upload.cv_education": "Ausbildung",
      "upload.cv_add_education": "+ Ausbildung hinzufügen",
      "upload.cv_achievements": "Leistungen",
      "upload.cv_add_achievement": "+ Leistung hinzufügen",
      "upload.cv_ph_achievement": "z.B. Umsatz um 30% gesteigert",

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
      "action.generate_cv": "CV generieren",
      "action.generate_cover": "Anschreiben generieren",
      "action.generate": "CV + Anschreiben generieren",
      "action.preview_match": "Match-Score Vorschau",
      "action.download_cv": "CV herunterladen",
      "action.continue_upload": "Weiter zu Daten",
      "action.continue_questions": "Weiter zu Fragen",
      "action.continue_review": "Weiter zur Prüfung",
      "action.back_start": "Zurück zum Start",
      "action.back_upload": "Zurück zu Daten",
      "action.back_questions": "Zurück zu Fragen",
      "action.back_review": "Zurück zur Prüfung",
      "action.back_result": "Zurück zum CV Ergebnis",
      "action.next_cover": "Weiter: Anschreiben (optional)",
      "action.new_session": "Neue Sitzung starten",

      "result.title": "Dein generierter CV",
      "result.sub": "CV Vorschau. Als HTML oder Markdown herunterladen, dann optional ein Anschreiben erstellen.",
      "result.download_html": "HTML herunterladen",
      "result.download_md": "Markdown herunterladen",
      "result.chat_title": "CV verfeinern",
      "result.chat_placeholder": "z.B. Zusammenfassung kürzer formulieren",
      "result.chat_send": "Senden",
      "cover.sub": "Optional: Passgenaues Anschreiben zu deinem CV generieren.",
      "cover.result_title": "Dein Anschreiben",
      "cover.download_html": "HTML herunterladen",

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
      "text.quality_warnings": "Qualitätswarnungen",
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

      "tone.title": "Schreibstil",
      "tone.description": "Bestimme, wie dein CV Fachbegriffe und Branchenjargon einsetzt. Pragmatisch: klare, sachliche Sprache, die jeder versteht. Buzzwordy: keyword-reiche Sprache, optimiert für ATS-Systeme und Recruiter deiner Branche.",
      "tone.pragmatic": "Pragmatisch",
      "tone.buzzwordy": "Buzzwordy",

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

      "notify.session_started": "Sitzung gestartet.",
      "notify.documents_uploaded": "Dokumente hochgeladen.",
      "notify.extraction_refreshed": "Extraktion aktualisiert.",
      "notify.answers_saved": "Antworten gespeichert.",
      "notify.files_generated": "Dateien generiert.",
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

      "gap.strengths_title": "Ihre Stärken",
      "gap.strong_technical": "Starke fachliche Übereinstimmung",
      "gap.strong_soft": "Gute Soft-Skills-Übereinstimmung",
      "gap.transferable_skills": "Übertragbare Kompetenzen identifiziert",
      "gap.areas_to_address": "Zu adressierende Bereiche",
      "gap.critical": "Kritische Lücken",
      "gap.important": "Wichtige Lücken",
      "gap.nice_to_have": "Wünschenswert",
      "gap.no_specific_gaps": "Insgesamt gute Übereinstimmung. Relevante Keywords im CV betonen.",

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
      "optimization.no_data": "Keine Daten verfügbar",

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

      "builder.title": "CV Builder",
      "builder.subtitle": "CV direkt erstellen. Kein Upload, keine KI. Daten eingeben, Vorlage wählen, herunterladen.",
      "builder.template_label": "Vorlage",
      "builder.language_label": "CV Sprache",
      "builder.personal_info": "Persönliche Daten",
      "builder.full_name": "Vollständiger Name",
      "builder.headline": "Titel / Position",
      "builder.address": "Adresse",
      "builder.email": "E-Mail",
      "builder.phone": "Telefon",
      "builder.portfolio": "Portfolio / Website",
      "builder.birthdate": "Geburtsdatum",
      "builder.photo": "Foto",
      "builder.photo_warn": "Foto über 500KB, kann Dateigrösse erhöhen.",
      "builder.summary": "Kurzprofil",
      "builder.kpis": "KPIs (nur Cut Set / Business)",
      "builder.skills": "Fähigkeiten",
      "builder.languages": "Sprachen",
      "builder.language_item": "Sprache",
      "builder.experience": "Berufserfahrung",
      "builder.experience_hint": "Tipp: Verwenden Sie Formulierungen aus Arbeitszeugnissen für genaue, belegbare Beschreibungen.",
      "builder.experience_item": "Position",
      "builder.education": "Ausbildung",
      "builder.education_item": "Abschluss",
      "builder.certifications": "Zertifikate",
      "builder.certification_item": "Zertifikat",
      "builder.military": "Militär",
      "builder.military_item": "Eintrag",
      "builder.projects": "Projekte",
      "builder.project_item": "Projekt",
      "builder.references": "Referenzen",
      "builder.reference_item": "Referenz",
      "builder.refs_on_request": "Referenzen auf Anfrage verfügbar",
      "builder.preview": "Vorschau",
      "builder.download": "HTML herunterladen",
      "builder.export_md": "Markdown exportieren",
      "builder.export_json": "JSON exportieren",
      "builder.import_json": "JSON importieren",
      "builder.preview_title": "Vorschau",
      "builder.ph_full_name": "Max Muster",
      "builder.ph_headline": "Software Engineer",
      "builder.ph_address": "Bahnhofstr. 1, 8001 Zürich",
      "builder.ph_summary": "Kurze professionelle Zusammenfassung...",
    },
  };

  const state = {
    sessionId: "",
    server: null,
    uiLanguage: "de",
    artifactToken: "",
    cvHtml: "",
    monsterToken: "",
    monsterStats: null,
  };

  const statusBox = document.getElementById("global-status");
  const sessionMeta = document.getElementById("session-meta");
  const documentsList = document.getElementById("documents-list");
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
  const photoFile = document.getElementById("photo-file");
  const photoFileTrigger = document.getElementById("photo-file-trigger");
  const photoFileName = document.getElementById("photo-file-name");

  // Upload page CV input refs
  const uploadName = document.getElementById("upload-name");
  const uploadHeadline = document.getElementById("upload-headline");
  const uploadEmail = document.getElementById("upload-email");
  const uploadPhone = document.getElementById("upload-phone");
  const uploadLocation = document.getElementById("upload-location");
  const uploadLinkedin = document.getElementById("upload-linkedin");
  const uploadPortfolio = document.getElementById("upload-portfolio");
  const uploadSummary = document.getElementById("upload-summary");
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


  const btnStartContinue = document.getElementById("start-continue-btn");
  const btnUploadContinue = document.getElementById("upload-continue-btn");
  const btnUploadPhoto = document.getElementById("upload-photo-btn");
  const btnAnswers = document.getElementById("save-answers-btn");
  const toneSlider = document.getElementById("review-tone");
  const btnGenerate = document.getElementById("generate-btn");
  const btnPreviewMatch = document.getElementById("preview-match-btn");
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
    if (step === "result") return endpoint("/result-page");
    if (step === "cover") return endpoint("/cover");
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
    const hasProfile = Boolean(state.server?.extracted_profile?.full_name || state.server?.extracted_profile?.experience?.length);

    if (btnUploadPhoto && photoFile) btnUploadPhoto.disabled = !hasSession || !photoFile.files.length;
    if (btnAnswers) btnAnswers.disabled = !hasSession || !hasQuestions;
    if (btnPreviewMatch) btnPreviewMatch.disabled = !hasSession || (!hasDocs && !hasProfile) || !state.server?.job_ad_text;
    if (btnGenerate) btnGenerate.disabled = !hasSession || !state.server?.ready_to_generate;
    if (btnToReview) btnToReview.disabled = !hasSession || unresolved > 0 || !state.server?.ready_to_generate;
    if (btnStartContinue) {
      const hasJobAd = Boolean(inputJobAd?.value?.trim());
      const hasConsent = Boolean(inputConsent?.checked);
      btnStartContinue.disabled = !hasJobAd || !hasConsent;
    }
    if (btnUploadContinue) btnUploadContinue.disabled = !hasSession;
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
    const qualityWarnings = payload.quality_warnings || [];
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
      ${qualityWarnings.length ? `<div class="row-card">
        <strong>${t("text.quality_warnings")}</strong>
        <p>${qualityWarnings.join(" · ")}</p>
      </div>` : ''}
    `;
    renderKeywordComparisonTable(reviewKeywordComparison, payload);
    displayQualityMetrics();
    displayOptimizationComparison();

    // Update keyword accordion title with score
    const keywordAccordion = document.getElementById("review-keyword-accordion");
    if (keywordAccordion && payload) {
      const summary = keywordAccordion.querySelector("summary");
      if (summary) {
        const baseText = t("comparison.keywords_title");
        const scoreText = payload.overall_score
          ? ` · ${payload.overall_score.toFixed(1)}/100`
          : "";
        summary.innerHTML = `${baseText}<strong class="score-inline">${scoreText}</strong>`;
      }
    }

    // Show/hide quality accordions based on data availability
    const qualityAccordion = document.getElementById("quality-accordion");
    const optimizationAccordion = document.getElementById("optimization-accordion");

    if (qualityAccordion) {
      qualityAccordion.style.display = state.server?.review_match?.quality_metrics ? "" : "none";
    }
    if (optimizationAccordion) {
      const hasData = state.server?.result_artifact?.comparison_sections || state.server?.preview_comparison_sections;
      optimizationAccordion.style.display = hasData?.length ? "" : "none";
    }
  }

  function renderGapExplanation(payload) {
    const score = payload?.overall_score || 0;
    const gaps = payload?.contextual_gaps || [];
    const semanticMatch = payload?.semantic_match;

    if (score >= 70) {
      // High score: brief affirmation with strengths
      const strengths = [];
      if (semanticMatch?.matched_hard_skills?.length > 5) strengths.push(t("gap.strong_technical"));
      if (semanticMatch?.matched_soft_skills?.length > 3) strengths.push(t("gap.strong_soft"));
      if (semanticMatch?.transferable_matches?.length > 0) strengths.push(t("gap.transferable_skills"));

      if (strengths.length === 0) return "";
      return `<div class="gap-explanation gap-positive">
        <h4>${t("gap.strengths_title")}</h4>
        <p>${strengths.join(" · ")}</p>
      </div>`;
    }

    // Low score: detailed gap breakdown with severity
    if (gaps.length === 0) {
      return `<div class="gap-explanation gap-neutral">
        <p>${t("gap.no_specific_gaps")}</p>
      </div>`;
    }

    const critical = gaps.filter(g => g.severity === "critical");
    const important = gaps.filter(g => g.severity === "important");
    const nice = gaps.filter(g => g.severity === "nice-to-have");

    let html = `<div class="gap-explanation gap-warning"><h4>${t("gap.areas_to_address")}</h4>`;

    if (critical.length > 0) {
      html += `<div class="gap-section"><strong class="gap-severity gap-critical">⚠️ ${t("gap.critical")}</strong><ul>`;
      critical.forEach(gap => {
        const subIcon = gap.substitutable ? "🔄" : "";
        html += `<li>${subIcon} <strong>${escHtml(gap.missing)}</strong>`;
        if (gap.suggestions) html += ` – <em>${escHtml(gap.suggestions)}</em>`;
        html += `</li>`;
      });
      html += `</ul></div>`;
    }

    if (important.length > 0) {
      html += `<div class="gap-section"><strong class="gap-severity gap-important">📌 ${t("gap.important")}</strong><ul>`;
      important.slice(0, 3).forEach(gap => {
        const subIcon = gap.substitutable ? "🔄" : "";
        html += `<li>${subIcon} ${escHtml(gap.missing)}`;
        if (gap.suggestions) html += ` – <em>${escHtml(gap.suggestions)}</em>`;
        html += `</li>`;
      });
      html += `</ul></div>`;
    }

    if (nice.length > 0 && critical.length === 0 && important.length < 3) {
      html += `<div class="gap-section"><strong class="gap-severity gap-nice">💡 ${t("gap.nice_to_have")}</strong>`;
      html += `<p>${nice.slice(0, 3).map(g => g.missing).join(", ")}</p></div>`;
    }

    html += `</div>`;
    return html;
  }

  function renderKeywordComparisonTable(container, payload) {
    if (!container) return;
    const matched = payload?.matched_keywords || [];
    const missing = payload?.missing_keywords || [];
    const combined = [
      ...matched.map((kw) => ({ keyword: kw, matched: true })),
      ...missing.map((kw) => ({ keyword: kw, matched: false })),
    ];
    if (!combined.length) {
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
        </tbody>
      </table>
    `;

    // Add gap explanation
    const gapExplanation = renderGapExplanation(payload);
    if (gapExplanation) container.innerHTML += gapExplanation;
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
    const container = document.getElementById("optimization-content");
    if (!container) return;

    // Fallback to preview sections if generation artifact not available
    const comparison = artifact?.comparison_sections || state.server?.preview_comparison_sections;
    if (!comparison?.length) {
      container.innerHTML = `<p class="text-muted">${t("optimization.no_data")}</p>`;
      return;
    }

    const metadata = artifact?.meta?.comparison_metadata;

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
      tone: toneSlider?.value || "3",
      artifactToken: state.artifactToken || "",
      cvHtml: state.cvHtml || "",
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
      if (toneSlider) toneSlider.value = payload.tone || "3";
      if (payload.artifactToken) state.artifactToken = payload.artifactToken;
      if (payload.cvHtml) state.cvHtml = payload.cvHtml;
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
    // Auto-advance to questions page after extraction
    setTimeout(() => gotoQuestions(), 800);
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
        tone: parseInt(toneSlider?.value || "3", 10),
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
      state.cvHtml = data.cv_html || "";
      saveLocal();
      notify("success", t("notify.cv_generated"));
      window.location.assign(routeForStep("result"));
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

  let previewInProgress = false;

  async function previewMatch() {
    if (!state.sessionId) throw new Error(t("error.start_session_first"));

    if (previewInProgress) {
      console.warn("Preview already in progress, skipping...");
      return;
    }

    previewInProgress = true;

    try {
      // CRITICAL FIX: Sync job ad text to server before preview
      await syncIntake();

      showGeneratingOverlay();
      const response = await fetch(endpoint(`/api/session/${state.sessionId}/preview-match`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await parseJsonResponse(response);

      // Update state with preview match data
      if (!state.server) state.server = {};
      state.server.review_match = data.match;
      state.server.strategic_analysis = data.strategic_analysis;
      state.server.preview_comparison_sections = data.preview_comparison_sections || [];

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
      previewInProgress = false;
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

  function sanitizeEditorHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    tmp.querySelectorAll("script,style,iframe,object,embed,form").forEach(el => el.remove());
    // Strip all attributes except basic ones
    tmp.querySelectorAll("*").forEach(el => {
      const tag = el.tagName.toLowerCase();
      const allowed = ["b","i","u","strong","em","ul","ol","li","br","p","div","span"];
      if (!allowed.includes(tag)) {
        el.replaceWith(...el.childNodes);
      }
    });
    return tmp.innerHTML;
  }

  function stripHtmlTags(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || "";
  }

  function createMiniEditor(container, initialHtml, placeholder, onInput) {
    const wrap = document.createElement("div");
    wrap.className = "mini-editor-wrap";
    const toolbar = document.createElement("div");
    toolbar.className = "mini-editor-toolbar";
    const buttons = [
      { cmd: "bold", label: "B", style: "font-weight:bold" },
      { cmd: "italic", label: "I", style: "font-style:italic" },
      { cmd: "underline", label: "U", style: "text-decoration:underline" },
      { cmd: "insertUnorderedList", label: "\u2022" },
      { cmd: "insertOrderedList", label: "1." },
    ];
    buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<span style="${b.style || ''}">${b.label}</span>`;
      btn.title = b.cmd;
      btn.addEventListener("mousedown", e => {
        e.preventDefault();
        document.execCommand(b.cmd, false, null);
        content.focus();
        if (onInput) onInput();
      });
      toolbar.appendChild(btn);
    });
    const content = document.createElement("div");
    content.className = "mini-editor-content";
    content.contentEditable = "true";
    content.setAttribute("data-placeholder", placeholder || "");
    if (initialHtml) content.innerHTML = sanitizeEditorHtml(initialHtml);
    content.addEventListener("input", () => { if (onInput) onInput(); });
    wrap.appendChild(toolbar);
    wrap.appendChild(content);
    container.appendChild(wrap);
    return { wrap, content, getHtml: () => sanitizeEditorHtml(content.innerHTML), setHtml: (h) => { content.innerHTML = sanitizeEditorHtml(h); } };
  }

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
      </div>
      <div class="duration-row">
        <label><span>${t("upload.start_month")}</span>
          <input type="text" name="start_month" value="${escHtml(data?.start_month || "")}" placeholder="${escHtml(t("upload.cv_ph_start_month"))}">
        </label>
        <label><span>${t("upload.end_month")}</span>
          <input type="text" name="end_month" value="${escHtml(data?.end_month || "")}" placeholder="${escHtml(t("upload.cv_ph_end_month"))}">
        </label>
      </div>
      <div class="item-full editor-stellenbeschrieb">
        <span class="item-label">${t("upload.stellenbeschrieb")} <span class="info-icon" title="${escHtml(t("tooltip.stellenbeschrieb"))}">i</span></span>
      </div>
      <div class="item-full editor-leistungen">
        <span class="item-label">${t("upload.leistungen")} <span class="info-icon" title="${escHtml(t("tooltip.leistungen"))}">i</span></span>
      </div>
    `;
    row.querySelectorAll("input").forEach((el) => el.addEventListener("input", scheduleAdvProfileSave));
    createMiniEditor(row.querySelector(".editor-stellenbeschrieb"), data?.description_html || data?.duties || "", t("upload.cv_ph_duties"), scheduleAdvProfileSave);
    createMiniEditor(row.querySelector(".editor-leistungen"), data?.achievements_html || data?.successes || "", t("upload.cv_ph_successes"), scheduleAdvProfileSave);
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
      </div>
      <div class="duration-row">
        <label><span>${t("upload.start_month")}</span>
          <input type="text" name="start_month" value="${escHtml(data?.start_month || "")}" placeholder="${escHtml(t("upload.cv_ph_start_month"))}">
        </label>
        <label><span>${t("upload.end_month")}</span>
          <input type="text" name="end_month" value="${escHtml(data?.end_month || "")}" placeholder="${escHtml(t("upload.cv_ph_end_month"))}">
        </label>
      </div>
      <label><span>${t("upload.grade")} <span class="info-icon" title="${escHtml(t("tooltip.grade"))}">i</span></span>
        <input type="text" name="grade" value="${escHtml(data?.grade || "")}" placeholder="${escHtml(t("upload.cv_ph_grade"))}">
      </label>
      <div class="item-full editor-learned">
        <span class="item-label">${t("upload.learned")} <span class="info-icon" title="${escHtml(t("tooltip.learned"))}">i</span></span>
      </div>
    `;
    row.querySelectorAll("input").forEach((el) => el.addEventListener("input", scheduleAdvProfileSave));
    createMiniEditor(row.querySelector(".editor-learned"), data?.learned_html || data?.learned || "", t("upload.cv_ph_learned"), scheduleAdvProfileSave);
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
      experience: Array.from(document.querySelectorAll(".exp-row")).map((row) => {
        const descEditor = row.querySelector(".editor-stellenbeschrieb .mini-editor-content");
        const achEditor = row.querySelector(".editor-leistungen .mini-editor-content");
        return {
          role: row.querySelector("[name='role']")?.value || "",
          company: row.querySelector("[name='company']")?.value || "",
          start_month: row.querySelector("[name='start_month']")?.value || "",
          end_month: row.querySelector("[name='end_month']")?.value || "",
          description_html: descEditor ? sanitizeEditorHtml(descEditor.innerHTML) : "",
          achievements_html: achEditor ? sanitizeEditorHtml(achEditor.innerHTML) : "",
        };
      }),
      education: Array.from(document.querySelectorAll(".edu-row")).map((row) => {
        const learnEditor = row.querySelector(".editor-learned .mini-editor-content");
        return {
          degree: row.querySelector("[name='degree']")?.value || "",
          school: row.querySelector("[name='school']")?.value || "",
          start_month: row.querySelector("[name='start_month']")?.value || "",
          end_month: row.querySelector("[name='end_month']")?.value || "",
          learned_html: learnEditor ? sanitizeEditorHtml(learnEditor.innerHTML) : "",
          grade: row.querySelector("[name='grade']")?.value || "",
        };
      }),
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

  // ============================================================
  // UPLOAD PAGE CV INPUT
  // ============================================================
  const STORAGE_UPLOAD_PROFILE_KEY = "happyrav_v4_upload_profile";
  let uploadProfileDebounce = null;

  function addUploadSkillRow(data) {
    const list = document.getElementById("upload-skills-list");
    if (!list) return;
    const name = typeof data === "string" ? data : (data?.name || data || "");
    const level = typeof data === "object" ? (data?.level || "") : "";
    const row = document.createElement("div");
    row.className = "dynamic-item";
    row.innerHTML = `
      <div class="item-row">
        <input type="text" name="skill" value="${escHtml(name)}" placeholder="${escHtml(t("upload.cv_ph_skill"))}">
        <input type="text" name="skill_level" value="${escHtml(level)}" list="skill-level-suggestions" placeholder="${escHtml(t("upload.cv_ph_skill_level"))}">
        <button type="button" class="btn-remove">${t("adv.remove")}</button>
      </div>
    `;
    // Ensure datalist exists once
    if (!document.getElementById("skill-level-suggestions")) {
      const dl = document.createElement("datalist");
      dl.id = "skill-level-suggestions";
      dl.innerHTML = '<option value="Expert"><option value="Advanced"><option value="Intermediate"><option value="Beginner">';
      document.body.appendChild(dl);
    }
    row.querySelectorAll("input").forEach(el => el.addEventListener("input", scheduleUploadSave));
    list.appendChild(row);
  }

  function addUploadLanguageRow(data) {
    const list = document.getElementById("upload-languages-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "dynamic-item";
    row.innerHTML = `
      <div class="item-row">
        <input type="text" name="language" value="${escHtml(data?.language || "")}" placeholder="${escHtml(t("upload.cv_ph_language"))}">
        <input type="text" name="proficiency" value="${escHtml(data?.proficiency || "")}" placeholder="${escHtml(t("upload.cv_ph_proficiency"))}">
      </div>
      <button type="button" class="btn-remove">${t("adv.remove")}</button>
    `;
    row.querySelectorAll("input").forEach(el => el.addEventListener("input", scheduleUploadSave));
    list.appendChild(row);
  }

  function addUploadExperienceRow(data) {
    const list = document.getElementById("upload-experience-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "dynamic-item";
    row.innerHTML = `
      <div class="item-row">
        <label><span class="item-label">${t("adv.role")}</span>
          <input type="text" name="role" value="${escHtml(data?.role || "")}" placeholder="${escHtml(t("adv.ph_role"))}">
        </label>
        <label><span class="item-label">${t("adv.company")}</span>
          <input type="text" name="company" value="${escHtml(data?.company || "")}" placeholder="${escHtml(t("adv.ph_company"))}">
        </label>
      </div>
      <div class="duration-row">
        <label><span class="item-label">${t("upload.start_month")}</span>
          <input type="text" name="start_month" value="${escHtml(data?.start_month || "")}" placeholder="${escHtml(t("upload.cv_ph_start_month"))}">
        </label>
        <label><span class="item-label">${t("upload.end_month")}</span>
          <input type="text" name="end_month" value="${escHtml(data?.end_month || "")}" placeholder="${escHtml(t("upload.cv_ph_end_month"))}">
        </label>
      </div>
      <div class="item-full editor-stellenbeschrieb">
        <span class="item-label">${t("upload.stellenbeschrieb")} <span class="info-icon" title="${escHtml(t("tooltip.stellenbeschrieb"))}">i</span></span>
      </div>
      <div class="item-full editor-leistungen">
        <span class="item-label">${t("upload.leistungen")} <span class="info-icon" title="${escHtml(t("tooltip.leistungen"))}">i</span></span>
      </div>
      <button type="button" class="btn-remove">${t("adv.remove")}</button>
    `;
    row.querySelectorAll("input").forEach(el => el.addEventListener("input", scheduleUploadSave));
    createMiniEditor(row.querySelector(".editor-stellenbeschrieb"), data?.description_html || data?.duties || "", t("upload.cv_ph_duties"), scheduleUploadSave);
    createMiniEditor(row.querySelector(".editor-leistungen"), data?.achievements_html || data?.successes || "", t("upload.cv_ph_successes"), scheduleUploadSave);
    list.appendChild(row);
  }

  function addUploadEducationRow(data) {
    const list = document.getElementById("upload-education-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "dynamic-item";
    row.innerHTML = `
      <div class="item-row">
        <label><span class="item-label">${t("adv.degree")}</span>
          <input type="text" name="degree" value="${escHtml(data?.degree || "")}" placeholder="${escHtml(t("adv.ph_degree"))}">
        </label>
        <label><span class="item-label">${t("adv.school")}</span>
          <input type="text" name="school" value="${escHtml(data?.school || "")}" placeholder="${escHtml(t("adv.ph_school"))}">
        </label>
      </div>
      <div class="duration-row">
        <label><span class="item-label">${t("upload.start_month")}</span>
          <input type="text" name="start_month" value="${escHtml(data?.start_month || "")}" placeholder="${escHtml(t("upload.cv_ph_start_month"))}">
        </label>
        <label><span class="item-label">${t("upload.end_month")}</span>
          <input type="text" name="end_month" value="${escHtml(data?.end_month || "")}" placeholder="${escHtml(t("upload.cv_ph_end_month"))}">
        </label>
      </div>
      <label><span class="item-label">${t("upload.grade")} <span class="info-icon" title="${escHtml(t("tooltip.grade"))}">i</span></span>
        <input type="text" name="grade" value="${escHtml(data?.grade || "")}" placeholder="${escHtml(t("upload.cv_ph_grade"))}">
      </label>
      <div class="item-full editor-learned">
        <span class="item-label">${t("upload.learned")} <span class="info-icon" title="${escHtml(t("tooltip.learned"))}">i</span></span>
      </div>
      <button type="button" class="btn-remove">${t("adv.remove")}</button>
    `;
    row.querySelectorAll("input").forEach(el => el.addEventListener("input", scheduleUploadSave));
    createMiniEditor(row.querySelector(".editor-learned"), data?.learned_html || data?.learned || "", t("upload.cv_ph_learned"), scheduleUploadSave);
    list.appendChild(row);
  }

  function addUploadAchievementRow(value) {
    const list = document.getElementById("upload-achievements-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "dynamic-item";
    row.innerHTML = `
      <div class="item-row">
        <input type="text" name="achievement" value="${escHtml(value || "")}" placeholder="${escHtml(t("upload.cv_ph_achievement"))}">
        <button type="button" class="btn-remove">${t("adv.remove")}</button>
      </div>
    `;
    row.querySelector("input").addEventListener("input", scheduleUploadSave);
    list.appendChild(row);
  }

  function collectUploadProfile() {
    return {
      contact: {
        name: uploadName?.value || "",
        headline: uploadHeadline?.value || "",
        email: uploadEmail?.value || "",
        phone: uploadPhone?.value || "",
        location: uploadLocation?.value || "",
        linkedin: uploadLinkedin?.value || "",
        portfolio: uploadPortfolio?.value || "",
      },
      summary: uploadSummary?.value || "",
      skills: Array.from(document.querySelectorAll("#upload-skills-list .dynamic-item")).map(row => ({
        name: row.querySelector("[name='skill']")?.value || "",
        level: row.querySelector("[name='skill_level']")?.value || "",
      })).filter(r => r.name),
      languages: Array.from(document.querySelectorAll("#upload-languages-list .dynamic-item")).map(row => ({
        language: row.querySelector("[name='language']")?.value || "",
        proficiency: row.querySelector("[name='proficiency']")?.value || "",
      })).filter(r => r.language),
      experience: Array.from(document.querySelectorAll("#upload-experience-list .dynamic-item")).map(row => {
        const descEditor = row.querySelector(".editor-stellenbeschrieb .mini-editor-content");
        const achEditor = row.querySelector(".editor-leistungen .mini-editor-content");
        return {
          role: row.querySelector("[name='role']")?.value || "",
          company: row.querySelector("[name='company']")?.value || "",
          start_month: row.querySelector("[name='start_month']")?.value || "",
          end_month: row.querySelector("[name='end_month']")?.value || "",
          description_html: descEditor ? sanitizeEditorHtml(descEditor.innerHTML) : "",
          achievements_html: achEditor ? sanitizeEditorHtml(achEditor.innerHTML) : "",
        };
      }),
      education: Array.from(document.querySelectorAll("#upload-education-list .dynamic-item")).map(row => {
        const learnEditor = row.querySelector(".editor-learned .mini-editor-content");
        return {
          degree: row.querySelector("[name='degree']")?.value || "",
          school: row.querySelector("[name='school']")?.value || "",
          start_month: row.querySelector("[name='start_month']")?.value || "",
          end_month: row.querySelector("[name='end_month']")?.value || "",
          learned_html: learnEditor ? sanitizeEditorHtml(learnEditor.innerHTML) : "",
          grade: row.querySelector("[name='grade']")?.value || "",
        };
      }),
      achievements: Array.from(document.querySelectorAll("#upload-achievements-list .dynamic-item")).map(row =>
        row.querySelector("[name='achievement']")?.value || ""
      ).filter(Boolean),
    };
  }

  function saveUploadProfile() {
    localStorage.setItem(STORAGE_UPLOAD_PROFILE_KEY, JSON.stringify(collectUploadProfile()));
  }

  function restoreUploadProfile() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_UPLOAD_PROFILE_KEY) || "null"); } catch (_) {}

    // Merge from server extracted_profile if available (pre-fill from start page advanced)
    const sp = state.server?.extracted_profile;
    if (!data && sp) {
      data = {
        contact: {
          name: sp.full_name || "",
          headline: sp.headline || "",
          email: sp.email || "",
          phone: sp.phone || "",
          location: sp.location || "",
          linkedin: sp.linkedin || "",
          portfolio: sp.portfolio || "",
        },
        summary: sp.summary || "",
        skills: (sp.skills || []).map(s => typeof s === "string" ? { name: s, level: "" } : s),
        languages: (sp.languages || []).map(l => typeof l === "string" ? { language: l, proficiency: "" } : l),
        experience: (sp.experience || []).map(e => ({ role: e.role || "", company: e.company || "", start_month: e.start_month || "", end_month: e.end_month || "", description_html: e.description_html || e.duties || "", achievements_html: e.achievements_html || e.successes || "" })),
        education: (sp.education || []).map(e => ({ degree: e.degree || "", school: e.school || "", start_month: e.start_month || "", end_month: e.end_month || "", learned_html: e.learned_html || e.learned || "", grade: e.grade || "" })),
        achievements: sp.achievements || [],
      };
    }
    if (!data) return;

    const c = data.contact || {};
    if (uploadName) uploadName.value = c.name || "";
    if (uploadHeadline) uploadHeadline.value = c.headline || "";
    if (uploadEmail) uploadEmail.value = c.email || "";
    if (uploadPhone) uploadPhone.value = c.phone || "";
    if (uploadLocation) uploadLocation.value = c.location || "";
    if (uploadLinkedin) uploadLinkedin.value = c.linkedin || "";
    if (uploadPortfolio) uploadPortfolio.value = c.portfolio || "";
    if (uploadSummary) uploadSummary.value = data.summary || "";

    const skillsList = document.getElementById("upload-skills-list");
    if (skillsList) { skillsList.innerHTML = ""; (data.skills || []).forEach(addUploadSkillRow); }
    const langList = document.getElementById("upload-languages-list");
    if (langList) { langList.innerHTML = ""; (data.languages || []).forEach(addUploadLanguageRow); }
    const expList = document.getElementById("upload-experience-list");
    if (expList) { expList.innerHTML = ""; (data.experience || []).forEach(addUploadExperienceRow); }
    const eduList = document.getElementById("upload-education-list");
    if (eduList) { eduList.innerHTML = ""; (data.education || []).forEach(addUploadEducationRow); }
    const achList = document.getElementById("upload-achievements-list");
    if (achList) { achList.innerHTML = ""; (data.achievements || []).forEach(addUploadAchievementRow); }
  }

  function scheduleUploadSave() {
    if (uploadProfileDebounce) clearTimeout(uploadProfileDebounce);
    uploadProfileDebounce = setTimeout(saveUploadProfile, 300);
  }

  function buildPreseedFromUploadProfile() {
    const up = collectUploadProfile();
    const c = up.contact || {};
    const preseedProfile = {};
    if (c.name) preseedProfile.full_name = c.name;
    if (c.headline) preseedProfile.headline = c.headline;
    if (c.email) preseedProfile.email = c.email;
    if (c.phone) preseedProfile.phone = c.phone;
    if (c.location) preseedProfile.location = c.location;
    if (c.linkedin) preseedProfile.linkedin = c.linkedin;
    if (c.portfolio) preseedProfile.portfolio = c.portfolio;
    if (up.summary) preseedProfile.summary = up.summary;
    if (up.skills?.length) preseedProfile.skills = up.skills.map(s => s.name + (s.level ? ` (${s.level})` : ""));
    if (up.languages?.length) preseedProfile.languages = up.languages.map(l => l.language + (l.proficiency ? ` (${l.proficiency})` : ""));
    if (up.experience?.length) preseedProfile.experience = up.experience.map(e => {
      const period = (e.start_month && e.end_month) ? `${e.start_month} \u2013 ${e.end_month}` : (e.start_month || e.end_month || "");
      return {
        role: e.role, company: e.company, period,
        start_month: e.start_month || "",
        end_month: e.end_month || "",
        achievements: [],
        duties: stripHtmlTags(e.description_html || ""),
        successes: stripHtmlTags(e.achievements_html || ""),
        description_html: e.description_html || "",
        achievements_html: e.achievements_html || "",
      };
    });
    if (up.education?.length) preseedProfile.education = up.education.map(e => {
      const period = (e.start_month && e.end_month) ? `${e.start_month} \u2013 ${e.end_month}` : (e.start_month || e.end_month || "");
      return {
        degree: e.degree, school: e.school, period,
        start_month: e.start_month || "",
        end_month: e.end_month || "",
        learned: stripHtmlTags(e.learned_html || ""),
        learned_html: e.learned_html || "",
        grade: e.grade || "",
      };
    });
    if (up.achievements?.length) preseedProfile.achievements = up.achievements;
    return preseedProfile;
  }

  async function preseedUploadAndContinue() {
    await ensureSession({ silent: true });
    if (!state.sessionId) throw new Error(t("error.start_session_first"));
    const preseedProfile = buildPreseedFromUploadProfile();
    // Merge with advanced profile from start page
    const advProfile = collectAdvancedProfile();
    const advC = advProfile.contact || {};
    if (advC.name && !preseedProfile.full_name) preseedProfile.full_name = advC.name;
    if (advC.email && !preseedProfile.email) preseedProfile.email = advC.email;
    if (advC.phone && !preseedProfile.phone) preseedProfile.phone = advC.phone;
    if (advC.location && !preseedProfile.location) preseedProfile.location = advC.location;
    if (advC.linkedin && !preseedProfile.linkedin) preseedProfile.linkedin = advC.linkedin;
    if (advC.portfolio && !preseedProfile.portfolio) preseedProfile.portfolio = advC.portfolio;
    if ((advProfile.experience || []).length && !preseedProfile.experience?.length) preseedProfile.experience = advProfile.experience;
    if ((advProfile.education || []).length && !preseedProfile.education?.length) preseedProfile.education = advProfile.education;

    const telos = collectTelos();
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/preseed`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: preseedProfile, telos }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.state) state.server = data.state;
    }
    gotoQuestions();
  }

  function bindUploadCvEvents() {
    document.getElementById("upload-add-skill")?.addEventListener("click", () => { addUploadSkillRow(); scheduleUploadSave(); });
    document.getElementById("upload-add-language")?.addEventListener("click", () => { addUploadLanguageRow(); scheduleUploadSave(); });
    document.getElementById("upload-add-experience")?.addEventListener("click", () => { addUploadExperienceRow(); scheduleUploadSave(); });
    document.getElementById("upload-add-education")?.addEventListener("click", () => { addUploadEducationRow(); scheduleUploadSave(); });
    document.getElementById("upload-add-achievement")?.addEventListener("click", () => { addUploadAchievementRow(); scheduleUploadSave(); });

    // Remove button delegation
    ["upload-skills-list", "upload-languages-list", "upload-experience-list", "upload-education-list", "upload-achievements-list"].forEach(listId => {
      document.getElementById(listId)?.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-remove");
        if (btn) { btn.closest(".dynamic-item")?.remove(); scheduleUploadSave(); }
      });
    });

    // Input change delegation for upload CV fields
    [uploadName, uploadHeadline, uploadEmail, uploadPhone, uploadLocation, uploadLinkedin, uploadPortfolio, uploadSummary]
      .filter(Boolean)
      .forEach(el => el.addEventListener("input", scheduleUploadSave));
  }

  // ============================================================
  // END UPLOAD PAGE CV INPUT
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
      banner.className = "alert error";
      banner.style.margin = "0.5rem 1rem";
      banner.style.fontWeight = "bold";
      banner.innerHTML = `<strong>⚠️ ${t("warn.no_api_key")}</strong><br>
        <small>CV generation is unavailable without API keys. Contact support.</small>`;
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
    renderPhotoFileLabel();
    setButtonStates();
    saveLocal();
  }

  function guardCurrentPage() {
    if (pageKey === "result" || pageKey === "cover") return true;
    const hasSession = Boolean(state.sessionId && state.server);
    if (!hasSession) {
      if (pageKey !== "start") {
        window.location.replace(routeForStep("start"));
        return false;
      }
      return true;
    }

    const recommended = recommendedStepFromServer();
    if (pageKey === "start" && (state.server?.documents?.length || state.server?.extracted_profile?.full_name)) {
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

    if (btnUploadPhoto) btnUploadPhoto.addEventListener("click", () => run(uploadPhoto));

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
    if (btnUploadContinue) btnUploadContinue.addEventListener("click", () => run(preseedUploadAndContinue));
    if (btnAnswers) btnAnswers.addEventListener("click", () => run(saveAnswers));
    if (btnPreviewMatch) btnPreviewMatch.addEventListener("click", () => run(previewMatch));
    if (btnGenerate) btnGenerate.addEventListener("click", () => run(generate));
    if (btnGenerateCover) btnGenerateCover.addEventListener("click", () => run(generateCoverLetter));

    const strategicSendBtn = document.getElementById("strategic-send-btn");
    const strategicInput = document.getElementById("strategic-input");
    if (strategicSendBtn) strategicSendBtn.addEventListener("click", () => run(sendStrategicQuestion));
    if (strategicInput) strategicInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(sendStrategicQuestion); });

    if (btnToReview) btnToReview.addEventListener("click", gotoReview);
  }

  function renderResultPage() {
    const iframe = document.getElementById("result-cv-iframe");
    if (iframe && state.cvHtml) {
      iframe.srcdoc = state.cvHtml;
    }
    const matchSummary = document.getElementById("result-match-summary");
    if (matchSummary && state.server?.review_match) {
      const score = Math.round(state.server.review_match.overall_score || 0);
      matchSummary.textContent = `Match Score: ${score}%`;
    }
  }

  function bindResultPageEvents() {
    const downloadHtml = document.getElementById("result-download-html");
    const downloadMd = document.getElementById("result-download-md");
    const toCoverBtn = document.getElementById("result-to-cover-btn");
    const chatSend = document.getElementById("result-chat-send");
    const chatInput = document.getElementById("result-chat-input");

    if (downloadHtml) downloadHtml.addEventListener("click", () => {
      if (!state.artifactToken) return;
      window.open(endpoint(`/api/result/${state.artifactToken}/cv-html`), "_blank");
    });
    if (downloadMd) downloadMd.addEventListener("click", () => {
      if (!state.artifactToken) return;
      window.open(endpoint(`/api/result/${state.artifactToken}/cv-markdown`), "_blank");
    });
    if (toCoverBtn) toCoverBtn.addEventListener("click", () => {
      window.location.assign(routeForStep("cover"));
    });
    if (chatSend) chatSend.addEventListener("click", () => run(resultChatSend));
    if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") run(resultChatSend); });
  }

  async function resultChatSend() {
    const input = document.getElementById("result-chat-input");
    const messages = document.getElementById("result-chat-messages");
    if (!input || !state.artifactToken) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    if (messages) messages.innerHTML += `<div class="chat-msg user">${escHtml(msg)}</div>`;
    const response = await fetch(endpoint(`/api/session/${state.sessionId}/chat`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, token: state.artifactToken }),
    });
    const data = await parseJsonResponse(response);
    if (data.token) {
      state.artifactToken = data.token;
      state.cvHtml = data.cv_html || state.cvHtml;
      saveLocal();
    }
    if (messages) messages.innerHTML += `<div class="chat-msg assistant">${escHtml(data.message || "Done")}</div>`;
    renderResultPage();
  }

  function bindCoverPageEvents() {
    const anredeSelect = document.getElementById("cover-anrede-known");
    const coverAnredeCustomWrap = document.getElementById("cover-anrede-custom-wrap");
    const coverRecipientContactWrap = document.getElementById("cover-recipient-contact-wrap");
    const signatureFile = document.getElementById("signature-file");
    const signatureFileName = document.getElementById("signature-file-name");
    const signatureFileTrigger = document.getElementById("signature-file-trigger");
    const btnUploadSignature = document.getElementById("upload-signature-btn");
    const btnGenerateCover = document.getElementById("generate-cover-btn");

    if (anredeSelect) {
      anredeSelect.addEventListener("change", () => {
        const known = anredeSelect.value === "yes";
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
    if (btnGenerateCover) btnGenerateCover.addEventListener("click", () => run(generateCoverLetterFromCoverPage));

    const coverDownloadHtml = document.getElementById("cover-download-html");
    if (coverDownloadHtml) coverDownloadHtml.addEventListener("click", () => {
      if (!state.artifactToken) return;
      window.open(endpoint(`/api/result/${state.artifactToken}/cover-html`), "_blank");
    });
  }

  async function generateCoverLetterFromCoverPage() {
    if (!state.sessionId || !state.artifactToken) throw new Error(t("error.start_session_first"));
    showGeneratingOverlay();
    try {
      const payload = {
        recipient_street: document.getElementById("cover-recipient-street")?.value || "",
        recipient_plz_ort: document.getElementById("cover-recipient-plz")?.value || "",
        recipient_contact: document.getElementById("cover-recipient-contact")?.value || "",
        cover_date_location: document.getElementById("cover-date-location")?.value || "",
        cover_anrede: document.getElementById("cover-anrede-custom")?.value || "",
        sender_street: document.getElementById("cover-sender-street")?.value || "",
        sender_plz_ort: document.getElementById("cover-sender-plz")?.value || "",
        filename_cover: "",
      };
      const response = await fetch(endpoint(`/api/session/${state.sessionId}/generate-cover`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response);
      if (data.token) state.artifactToken = data.token;
      saveLocal();
      notify("success", t("notify.cover_generated") || "Cover letter generated!");
      const coverResult = document.getElementById("cover-result");
      const coverIframe = document.getElementById("cover-preview-iframe");
      if (coverResult) coverResult.style.display = "";
      if (coverIframe && data.cover_html) coverIframe.srcdoc = data.cover_html;
    } finally {
      hideGeneratingOverlay();
    }
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
    if (pageKey === "upload") {
      bindUploadCvEvents();
    }
    if (pageKey === "result") {
      bindResultPageEvents();
    }
    if (pageKey === "cover") {
      bindCoverPageEvents();
    }

    if (pageKey === "start" && !state.sessionId && hasAutoStartSignal()) {
      scheduleIntakeSync();
    }

    if (state.sessionId && pageKey !== "result") {
      await fetchStateSafe();
    }

    if (pageKey === "upload") {
      restoreUploadProfile();
    }

    if (!guardCurrentPage()) return;
    renderAll();

    if (pageKey === "result") {
      renderResultPage();
    }

    // Auto-load match score on review page
    if (pageKey === "review" && state.sessionId && !state.server?.review_match) {
      try {
        await previewMatch();
      } catch (_) {}
    }
  }

  // ===== CV BUILDER =====
  const BUILDER_STORAGE_KEY = "happyrav_builder_v1";
  let builderDebounceTimer = null;

  function builderEl(id) { return document.getElementById(id); }

  function builderScheduleSave() {
    clearTimeout(builderDebounceTimer);
    builderDebounceTimer = setTimeout(saveBuilderLocal, 400);
  }

  function collectBuilderData() {
    const data = {
      language: (builderEl("builder-lang") || {}).value || "de",
      template_id: document.querySelector(".template-card.active")?.dataset.template || "green",
      full_name: (builderEl("builder-full-name") || {}).value || "",
      headline: (builderEl("builder-headline") || {}).value || "",
      address: (builderEl("builder-address") || {}).value || "",
      email: (builderEl("builder-email") || {}).value || "",
      phone: (builderEl("builder-phone") || {}).value || "",
      linkedin: (builderEl("builder-linkedin") || {}).value || "",
      portfolio: (builderEl("builder-portfolio") || {}).value || "",
      github: (builderEl("builder-github") || {}).value || "",
      birthdate: (builderEl("builder-birthdate") || {}).value || "",
      photo_data_url: builderEl("builder-photo")?.dataset.dataUrl || "",
      summary: (builderEl("builder-summary") || {}).value || "",
      references_on_request: (builderEl("builder-refs-on-request") || {}).checked || false,
      kpis: collectDynamicItems("builder-kpis-list", ["value", "label"]),
      skills: collectDynamicItems("builder-skills-list", ["name", "level", "description", "category"]),
      languages: collectDynamicItems("builder-languages-list", ["language", "proficiency"]),
      experience: collectExperienceItems(),
      education: collectDynamicItems("builder-education-list", ["degree", "school", "period", "description"]),
      certifications: collectDynamicItems("builder-certifications-list", ["name", "issuer", "date"]),
      military: collectDynamicItems("builder-military-list", ["rank", "period", "description"]),
      projects: collectDynamicItems("builder-projects-list", ["name", "description", "url"]),
      references: collectDynamicItems("builder-references-list", ["quote", "name", "title", "contact"]),
    };
    return data;
  }

  function collectDynamicItems(listId, fields) {
    const list = builderEl(listId);
    if (!list) return [];
    const items = [];
    list.querySelectorAll(".dynamic-item").forEach(el => {
      const item = {};
      fields.forEach(f => { item[f] = (el.querySelector(`[data-field="${f}"]`) || {}).value || ""; });
      if (Object.values(item).some(v => v.trim())) items.push(item);
    });
    return items;
  }

  function collectExperienceItems() {
    const list = builderEl("builder-experience-list");
    if (!list) return [];
    const items = [];
    list.querySelectorAll(".dynamic-item").forEach(el => {
      const item = {
        role: (el.querySelector('[data-field="role"]') || {}).value || "",
        company: (el.querySelector('[data-field="company"]') || {}).value || "",
        location: (el.querySelector('[data-field="location"]') || {}).value || "",
        period: (el.querySelector('[data-field="period"]') || {}).value || "",
        achievements: (el.querySelector('[data-field="achievements"]') || {}).value?.split("\n").filter(l => l.trim()) || [],
      };
      if (item.role || item.company) items.push(item);
    });
    return items;
  }

  function saveBuilderLocal() {
    try { localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(collectBuilderData())); } catch (_) {}
  }

  function restoreBuilderLocal() {
    try {
      const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.template_id) {
        document.querySelectorAll(".template-card").forEach(c => c.classList.toggle("active", c.dataset.template === data.template_id));
      }
      if (builderEl("builder-lang")) builderEl("builder-lang").value = data.language || "de";
      const simpleFields = ["full-name", "headline", "address", "email", "phone", "linkedin", "portfolio", "github", "birthdate", "summary"];
      simpleFields.forEach(f => {
        const el = builderEl("builder-" + f);
        const key = f.replace(/-/g, "_");
        if (el && data[key] != null) el.value = data[key];
      });
      if (data.photo_data_url) {
        const photoEl = builderEl("builder-photo");
        if (photoEl) photoEl.dataset.dataUrl = data.photo_data_url;
      }
      if (builderEl("builder-refs-on-request")) builderEl("builder-refs-on-request").checked = !!data.references_on_request;

      // Restore dynamic lists
      restoreDynamicList("builder-kpis-list", data.kpis || [], builderAddKPI);
      restoreDynamicList("builder-skills-list", data.skills || [], builderAddSkill);
      restoreDynamicList("builder-languages-list", data.languages || [], builderAddLanguage);
      restoreExperienceList(data.experience || []);
      restoreDynamicList("builder-education-list", data.education || [], builderAddEducation);
      restoreDynamicList("builder-certifications-list", data.certifications || [], builderAddCertification);
      restoreDynamicList("builder-military-list", data.military || [], builderAddMilitary);
      restoreDynamicList("builder-projects-list", data.projects || [], builderAddProject);
      restoreDynamicList("builder-references-list", data.references || [], builderAddReference);
    } catch (_) {}
  }

  function restoreDynamicList(listId, items, addFn) {
    const list = builderEl(listId);
    if (!list || !items.length) return;
    list.innerHTML = "";
    items.forEach(item => {
      addFn();
      const el = list.lastElementChild;
      if (!el) return;
      Object.entries(item).forEach(([k, v]) => {
        const field = el.querySelector(`[data-field="${k}"]`);
        if (field) field.value = v;
      });
    });
  }

  function restoreExperienceList(items) {
    const list = builderEl("builder-experience-list");
    if (!list || !items.length) return;
    list.innerHTML = "";
    items.forEach(item => {
      builderAddExperience();
      const el = list.lastElementChild;
      if (!el) return;
      ["role", "company", "location", "period"].forEach(k => {
        const field = el.querySelector(`[data-field="${k}"]`);
        if (field && item[k]) field.value = item[k];
      });
      const achField = el.querySelector('[data-field="achievements"]');
      if (achField && item.achievements) achField.value = item.achievements.join("\n");
    });
  }

  // Dynamic item creation helpers
  function makeDynamicItem(fields, removeLabel) {
    const div = document.createElement("div");
    div.className = "dynamic-item";
    let html = "";
    if (fields.length <= 2) {
      html += '<div class="item-row">';
      fields.forEach(f => { html += `<div class="item-full"><span class="item-label">${f.label}</span><input data-field="${f.key}" placeholder="${f.ph || ""}"></div>`; });
      html += "</div>";
    } else if (fields.length === 3) {
      html += '<div class="item-row-3">';
      fields.forEach(f => {
        if (f.type === "textarea") {
          html += `</div><div class="item-full"><span class="item-label">${f.label}</span><textarea data-field="${f.key}" placeholder="${f.ph || ""}" rows="2"></textarea></div><div class="item-row-3" style="display:none;">`;
        } else {
          html += `<div class="item-full"><span class="item-label">${f.label}</span><input data-field="${f.key}" placeholder="${f.ph || ""}"></div>`;
        }
      });
      html += "</div>";
    } else {
      html += '<div class="item-row">';
      fields.forEach((f, i) => {
        if (f.type === "textarea") {
          html += `</div><div class="item-full"><span class="item-label">${f.label}</span><textarea data-field="${f.key}" placeholder="${f.ph || ""}" rows="2"></textarea></div><div class="item-row" style="display:none;">`;
        } else {
          html += `<div class="item-full"><span class="item-label">${f.label}</span><input data-field="${f.key}" placeholder="${f.ph || ""}"></div>`;
          if (i % 2 === 1 && i < fields.length - 1 && fields[i+1]?.type !== "textarea") html += '</div><div class="item-row">';
        }
      });
      html += "</div>";
    }
    html += `<button type="button" class="btn-remove" onclick="this.closest('.dynamic-item').remove(); builderScheduleSave();">${removeLabel || "Remove"}</button>`;
    div.innerHTML = html;
    div.querySelectorAll("input, textarea, select").forEach(el => el.addEventListener("input", builderScheduleSave));
    return div;
  }

  // Expose builder functions to global scope for onclick handlers
  window.builderAddKPI = function() {
    const list = builderEl("builder-kpis-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "value", label: "Value", ph: "10+"},
      {key: "label", label: "Label", ph: "Years Experience"},
    ], "×"));
  };

  window.builderAddSkill = function() {
    const list = builderEl("builder-skills-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "name", label: "Skill", ph: "Python"},
      {key: "level", label: "Level", ph: "Expert"},
      {key: "category", label: "Category", ph: "Backend"},
      {key: "description", label: "Description", ph: "FastAPI, Django"},
    ], "×"));
  };

  window.builderAddLanguage = function() {
    const list = builderEl("builder-languages-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "language", label: "Language", ph: "Deutsch"},
      {key: "proficiency", label: "Proficiency", ph: "Muttersprache"},
    ], "×"));
  };

  window.builderAddExperience = function() {
    const list = builderEl("builder-experience-list");
    if (!list) return;
    const div = document.createElement("div");
    div.className = "dynamic-item";
    div.innerHTML = `
      <div class="item-row"><div class="item-full"><span class="item-label">Role</span><input data-field="role" placeholder="Senior Developer"></div><div class="item-full"><span class="item-label">Company</span><input data-field="company" placeholder="Tech AG"></div></div>
      <div class="item-row"><div class="item-full"><span class="item-label">Location</span><input data-field="location" placeholder="Zürich"></div><div class="item-full"><span class="item-label">Period</span><input data-field="period" placeholder="2020 – Heute"></div></div>
      <div class="item-full"><span class="item-label">Achievements (one per line)</span><textarea data-field="achievements" placeholder="Led team of 5\nShipped 3 products" rows="3"></textarea></div>
      <button type="button" class="btn-remove" onclick="this.closest('.dynamic-item').remove(); builderScheduleSave();">×</button>`;
    div.querySelectorAll("input, textarea").forEach(el => el.addEventListener("input", builderScheduleSave));
    list.appendChild(div);
  };

  window.builderAddEducation = function() {
    const list = builderEl("builder-education-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "degree", label: "Degree", ph: "MSc Computer Science"},
      {key: "school", label: "School", ph: "ETH Zürich"},
      {key: "period", label: "Period", ph: "2016 – 2018"},
      {key: "description", label: "Description (optional)", ph: "", type: "textarea"},
    ], "×"));
  };

  window.builderAddCertification = function() {
    const list = builderEl("builder-certifications-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "name", label: "Name", ph: "AWS Solutions Architect"},
      {key: "issuer", label: "Issuer", ph: "Amazon"},
      {key: "date", label: "Date", ph: "2023"},
    ], "×"));
  };

  window.builderAddMilitary = function() {
    const list = builderEl("builder-military-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "rank", label: "Rank", ph: "Leutnant"},
      {key: "period", label: "Period", ph: "2016 – 2020"},
      {key: "description", label: "Description", ph: "Zugführer Infanterie", type: "textarea"},
    ], "×"));
  };

  window.builderAddProject = function() {
    const list = builderEl("builder-projects-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "name", label: "Name", ph: "Open Source Tool"},
      {key: "url", label: "URL", ph: "https://github.com/..."},
      {key: "description", label: "Description", ph: "CLI for data processing", type: "textarea"},
    ], "×"));
  };

  window.builderAddReference = function() {
    const list = builderEl("builder-references-list");
    if (!list) return;
    list.appendChild(makeDynamicItem([
      {key: "name", label: "Name", ph: "Jane Doe"},
      {key: "title", label: "Title", ph: "CTO, Tech AG"},
      {key: "contact", label: "Contact", ph: "079 123 45 67"},
      {key: "quote", label: "Quote", ph: "Excellent engineer...", type: "textarea"},
    ], "×"));
  };

  window.builderScheduleSave = builderScheduleSave;

  async function builderPreview() {
    const data = collectBuilderData();
    try {
      const resp = await fetch(rootPath + "/api/builder/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Render failed");
      const result = await resp.json();
      const wrap = builderEl("builder-preview-wrap");
      const frame = builderEl("builder-preview-frame");
      if (wrap && frame) {
        wrap.style.display = "block";
        frame.srcdoc = result.html;
        wrap.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Builder preview error:", err);
    }
  }

  async function builderDownload() {
    const data = collectBuilderData();
    try {
      const resp = await fetch(rootPath + "/api/builder/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Render failed");
      const result = await resp.json();
      const blob = new Blob([result.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Builder download error:", err);
    }
  }

  function builderExportJSON() {
    const data = collectBuilderData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cv_data_${(data.full_name || "export").replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function builderExportMarkdown() {
    const data = collectBuilderData();
    try {
      const resp = await fetch(rootPath + "/api/builder/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Markdown export failed");
      const result = await resp.json();
      const blob = new Blob([result.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Markdown export error:", err);
    }
  }

  function builderImportJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(data));
        restoreBuilderLocal();
      } catch (err) {
        console.error("Import error:", err);
      }
    };
    reader.readAsText(file);
  }

  function initBuilder() {
    if (pageKey !== "builder") return;

    restoreBuilderLocal();

    // Template selection
    document.querySelectorAll(".template-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".template-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        builderScheduleSave();
      });
    });

    // Photo upload
    const photoInput = builderEl("builder-photo");
    if (photoInput) {
      photoInput.addEventListener("change", () => {
        const file = photoInput.files[0];
        if (!file) return;
        const warn = builderEl("builder-photo-warn");
        if (warn) warn.style.display = file.size > 500 * 1024 ? "block" : "none";
        const reader = new FileReader();
        reader.onload = function(e) {
          photoInput.dataset.dataUrl = e.target.result;
          builderScheduleSave();
        };
        reader.readAsDataURL(file);
      });
    }

    // Auto-save on all inputs
    document.querySelectorAll("#builder-page input, #builder-page textarea, #builder-page select").forEach(el => {
      el.addEventListener("input", builderScheduleSave);
      el.addEventListener("change", builderScheduleSave);
    });

    // Action buttons
    const previewBtn = builderEl("builder-preview-btn");
    if (previewBtn) previewBtn.addEventListener("click", builderPreview);

    const downloadBtn = builderEl("builder-download-btn");
    if (downloadBtn) downloadBtn.addEventListener("click", builderDownload);

    const exportBtn = builderEl("builder-export-btn");
    if (exportBtn) exportBtn.addEventListener("click", builderExportJSON);

    const exportMdBtn = builderEl("builder-export-md-btn");
    if (exportMdBtn) exportMdBtn.addEventListener("click", builderExportMarkdown);

    const importInput = builderEl("builder-import-btn");
    if (importInput) {
      importInput.addEventListener("change", () => {
        if (importInput.files[0]) builderImportJSON(importInput.files[0]);
      });
    }

    // Language selector also triggers i18n update
    const langSelect = builderEl("builder-lang");
    if (langSelect) langSelect.addEventListener("change", builderScheduleSave);
  }

  init();
  initBuilder();
})();
