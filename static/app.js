(function () {
  const body = document.body;
  const rootPath = body.dataset.rootPath || "";
  const pageKey = body.dataset.page || "start";
  const defaultPrimary = body.dataset.defaultPrimary || "#F04A3A";
  const defaultAccent = body.dataset.defaultAccent || "#0F9D9A";
  const STORAGE_KEY = "happyrav_v4_state";

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

      "aria.language_toggle": "Language toggle",
      "aria.switch_en": "Switch to English",
      "aria.switch_de": "Auf Deutsch wechseln",
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

      "aria.language_toggle": "Sprachauswahl",
      "aria.switch_en": "Switch to English",
      "aria.switch_de": "Auf Deutsch wechseln",
    },
  };

  const state = {
    sessionId: "",
    server: null,
    uiLanguage: "en",
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
  const langBtnEn = document.getElementById("lang-btn-en");
  const langBtnDe = document.getElementById("lang-btn-de");

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
    const payload = {
      template_id: templateSelect?.value || "simple",
      primary_color: primaryInput?.value || defaultPrimary,
      accent_color: accentInput?.value || defaultAccent,
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

  function gotoUpload() {
    window.location.assign(routeForStep("upload"));
  }

  function gotoQuestions() {
    window.location.assign(routeForStep("questions"));
  }

  function gotoReview() {
    window.location.assign(routeForStep("review"));
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
    renderAll();
  }

  function renderAll() {
    translateStaticUi();
    renderProgress();
    renderSessionMeta();
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

    [inputCompany, inputPosition, inputConsent, inputJobAd, templateSelect, primaryInput, accentInput]
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
    if (btnExtract) btnExtract.addEventListener("click", () => run(extract));
    if (btnClear) btnClear.addEventListener("click", () => run(clearSession));
  }

  function bindPageEvents() {
    if (btnStartContinue) btnStartContinue.addEventListener("click", gotoUpload);
    if (btnUploadContinue) btnUploadContinue.addEventListener("click", gotoQuestions);
    if (btnAnswers) btnAnswers.addEventListener("click", () => run(saveAnswers));
    if (btnGenerate) btnGenerate.addEventListener("click", () => run(generate));
    if (btnToReview) btnToReview.addEventListener("click", gotoReview);
  }

  async function init() {
    restoreLocal();
    bindEmailSubmitListener();
    bindCommonEvents();
    bindPageEvents();

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
