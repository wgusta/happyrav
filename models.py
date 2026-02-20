"""Data models for happyRAV multi-phase flow."""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


DocTag = Literal["cv", "cover_letter", "arbeitszeugnis", "certificate", "other"]
ParseMethod = Literal["pdf_text", "pdf_text_ocr", "docx_text", "ocr_image", "plain_text"]
PhaseName = Literal["start", "upload", "questions", "review"]


class ThemeConfig(BaseModel):
    primary_hex: str = "#1F5AA8"
    accent_hex: str = "#173A73"
    border_style: Literal["rounded", "square", "none"] = "rounded"
    box_shadow: bool = False
    card_bg: str = "#ffffff"
    page_bg: str = "#ffffff"


class SourceAttribution(BaseModel):
    doc_id: str
    confidence: float = 0.0


class ExperienceItem(BaseModel):
    role: str
    company: str = ""
    period: str = ""
    achievements: List[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str
    school: str = ""
    period: str = ""


class ExtractedProfile(BaseModel):
    full_name: str = ""
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    portfolio: str = ""
    photo_data_url: str = ""
    summary: str = ""
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    source_map: Dict[str, List[SourceAttribution]] = Field(default_factory=dict)


class BasicProfile(BaseModel):
    full_name: str = ""
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    portfolio: str = ""
    photo_data_url: str = ""


class DocumentMeta(BaseModel):
    doc_id: str
    filename: str
    mime: str
    tag: DocTag
    parse_method: ParseMethod
    confidence: float
    size_bytes: int
    text_excerpt: str = ""


class MissingQuestion(BaseModel):
    question_id: str
    field_path: str
    prompt: str
    required: bool = False
    reason: str = ""
    options: List[str] = Field(default_factory=list)


class SessionState(BaseModel):
    session_id: str
    phase: PhaseName = "start"
    language: str = "en"
    company_name: str = ""
    position_title: str = ""
    job_ad_text: str = ""
    consent_confirmed: bool = False
    documents: List[DocumentMeta] = Field(default_factory=list)
    extracted_profile: ExtractedProfile = Field(default_factory=ExtractedProfile)
    questions: List[MissingQuestion] = Field(default_factory=list)
    answers: Dict[str, str] = Field(default_factory=dict)
    ready_to_generate: bool = False
    template_id: str = "simple"
    theme: ThemeConfig = Field(default_factory=ThemeConfig)
    extraction_warning: str = ""
    extraction_debug: Dict[str, Any] = Field(default_factory=dict)
    telos_context: Dict[str, str] = Field(default_factory=dict)
    created_at: float = 0.0
    expires_at: float = 0.0


class SessionStartRequest(BaseModel):
    language: str = "en"
    company_name: str = ""
    position_title: str = ""
    job_ad_text: str = ""
    consent_confirmed: bool = False


class SessionIntakeRequest(BaseModel):
    company_name: str = ""
    position_title: str = ""
    job_ad_text: str = ""
    consent_confirmed: bool = False


class SessionAnswerRequest(BaseModel):
    answers: Dict[str, str] = Field(default_factory=dict)


class GenerateRequest(BaseModel):
    template_id: str = "simple"
    primary_color: str = "#1F5AA8"
    accent_color: str = "#173A73"
    border_style: str = "rounded"
    box_shadow: bool = False
    card_bg: str = "#ffffff"
    page_bg: str = "#ffffff"


class GeneratedContent(BaseModel):
    summary: str
    skills: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    cover_greeting: str
    cover_opening: str
    cover_body: List[str] = Field(default_factory=list)
    cover_closing: str
    matched_keywords: List[str] = Field(default_factory=list)


class MatchPayload(BaseModel):
    overall_score: float
    category_scores: Dict[str, float] = Field(default_factory=dict)
    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    ats_issues: List[str] = Field(default_factory=list)


class ComparisonSection(BaseModel):
    label_en: str
    label_de: str
    original: str
    optimized: str


class ArtifactRecord(BaseModel):
    token: str
    filename_cv: str
    filename_cover: str
    cv_pdf_bytes: bytes
    cover_pdf_bytes: bytes
    cv_html: str
    cover_html: str
    match: MatchPayload
    warning: Optional[str] = None
    expires_at: float
    meta: Dict[str, Any] = Field(default_factory=dict)
    comparison_sections: List[ComparisonSection] = Field(default_factory=list)


class PreSeedRequest(BaseModel):
    profile: Dict[str, Any] = Field(default_factory=dict)
    telos: Dict[str, str] = Field(default_factory=dict)


class GenerateResponse(BaseModel):
    token: str
    filename_cv: str
    filename_cover: str
    match: MatchPayload
    warning: Optional[str] = None
