"""LLM-based contextual matching and semantic understanding for CV-job alignment."""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from openai import AsyncOpenAI

from happyrav.models import (
    ContextualGap,
    ExperienceItem,
    ExtractedProfile,
    SemanticMatchResult,
)


def _build_async_openai_client():
    """Build async OpenAI client."""
    from happyrav.services.llm_kimi import _load_codex_oauth_token

    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        api_key = _load_codex_oauth_token()
    if not api_key:
        raise ValueError("OPENAI_API_KEY missing and no Codex OAuth token available.")

    base_url = (os.getenv("OPENAI_BASE_URL") or "").strip()
    if base_url:
        return AsyncOpenAI(api_key=api_key, base_url=base_url)
    return AsyncOpenAI(api_key=api_key)


def _extract_json_payload(text: str) -> Dict[str, Any]:
    """Extract JSON from LLM response."""
    text = (text or "").strip()
    # Strip code fences
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


async def _chat_json_openai_async(
    system: str, user: str, max_tokens: int, model: str = "gpt-4.1-mini"
) -> Dict[str, Any]:
    """Async wrapper for OpenAI JSON chat."""
    client = _build_async_openai_client()
    resp = await client.chat.completions.create(
        model=model,
        temperature=0.1,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    text = resp.choices[0].message.content or ""
    return _extract_json_payload(text)


async def extract_semantic_keywords(
    job_ad_text: str,
    language: str
) -> Dict[str, Any]:
    """
    Extract keywords with semantic understanding.

    Returns:
    {
        "required_hard_skills": [{"skill": "Python", "alternatives": ["Python 3", "Python programming"], "criticality": 0.95}],
        "required_soft_skills": [{"skill": "leadership", "alternatives": ["team management", "led team"], "criticality": 0.8}],
        "nice_to_have": [...],
        "experience_years": {"minimum": 5, "role": "backend development"},
        "industry_context": "fintech startup"
    }
    """
    lang_label = "German" if language == "de" else "English"

    user_prompt = f"""Analyze this job posting and extract requirements with semantic understanding.

Job Posting:
{job_ad_text[:2500]}

Return JSON with:
- required_hard_skills: technical skills with synonyms/alternatives (array of objects)
- required_soft_skills: interpersonal skills with context (array of objects)
- nice_to_have: optional skills (array of objects)
- experience_years: {{"minimum": number, "role": "role type"}}
- industry_context: company type/industry (string)

For each skill object, include:
- skill: canonical name (string)
- alternatives: list of equivalent terms/phrases (array of strings)
- criticality: 0-1 score (1 = must-have, 0.5 = nice-to-have) (number)

Language: {lang_label}
"""

    system_prompt = "You are a recruitment analyst. Extract job requirements with semantic precision. Return valid JSON only."

    response = await _chat_json_openai_async(
        system=system_prompt,
        user=user_prompt,
        max_tokens=2500,
        model="gpt-4.1-mini"
    )
    return response


async def match_skills_semantic(
    cv_skills: List[str],
    cv_experience: List[Dict],
    semantic_keywords: Dict
) -> SemanticMatchResult:
    """
    Match CV against semantic keywords.

    Returns SemanticMatchResult with contextual understanding.
    """
    # Build CV context
    cv_context = {
        "skills": cv_skills[:30],  # Limit to first 30 skills
        "experience_summary": [
            f"{exp.get('role', '')} at {exp.get('company', '')} ({exp.get('period', '')}): {' '.join(exp.get('achievements', []))[:200]}"
            for exp in cv_experience[:5]
        ]
    }

    user_prompt = f"""Match this CV against job requirements with semantic understanding.

Job Requirements:
{json.dumps(semantic_keywords, indent=2)[:2000]}

CV Profile:
{json.dumps(cv_context, indent=2)}

For each required skill:
1. Check if CV explicitly lists it
2. Check if CV demonstrates it through experience (even if not listed)
3. Check for transferable/equivalent skills

Return JSON:
{{
    "matched_hard_skills": [{{"skill": "Python", "evidence": "Listed in skills + 5 years backend work", "confidence": 0.95}}],
    "matched_soft_skills": [{{"skill": "leadership", "evidence": "Led team of 15", "confidence": 0.9}}],
    "missing_critical": ["AWS", "Docker"],
    "transferable_matches": [{{"cv_has": "Java", "job_needs": "object-oriented language", "confidence": 0.8}}],
    "overall_fit": 0.75
}}
"""

    system_prompt = "You are a CV matching expert. Identify semantic skill matches beyond exact keywords. Return valid JSON only."

    response = await _chat_json_openai_async(
        system=system_prompt,
        user=user_prompt,
        max_tokens=3000,
        model="gpt-4.1-mini"
    )

    # Convert to SemanticMatchResult model
    return SemanticMatchResult(
        matched_hard_skills=response.get("matched_hard_skills", []),
        matched_soft_skills=response.get("matched_soft_skills", []),
        missing_critical=response.get("missing_critical", []),
        transferable_matches=response.get("transferable_matches", []),
        overall_fit=float(response.get("overall_fit", 0.0))
    )


async def rank_skills_by_relevance(
    cv_skills: List[str],
    job_ad_text: str,
    language: str
) -> List[Dict[str, Any]]:
    """
    Rank CV skills by relevance to job posting.

    Returns: [{"skill": "Kubernetes", "relevance": 0.95, "category": "DevOps"}, ...]
    """
    lang_label = "German" if language == "de" else "English"

    user_prompt = f"""Rank these CV skills by relevance to the job posting.

Job Posting:
{job_ad_text[:2000]}

CV Skills:
{', '.join(cv_skills[:40])}

For each skill, return:
- skill: name (string)
- relevance: 0-1 score (1 = critical for job, 0 = not relevant) (number)
- category: technical/soft/domain/tool (string)
- reasoning: why relevant or not, max 15 words (string)

Return JSON with "ranked_skills" array. Sort by relevance descending. Language: {lang_label}
"""

    system_prompt = "You are a skills analyst. Rank skills by job relevance with semantic understanding. Return valid JSON only."

    response = await _chat_json_openai_async(
        system=system_prompt,
        user=user_prompt,
        max_tokens=2000,
        model="gpt-4.1-mini"
    )
    return response.get("ranked_skills", [])


async def score_achievement_relevance(
    achievements: List[str],
    job_ad_text: str,
    language: str
) -> List[Dict[str, Any]]:
    """
    Score each achievement by relevance to job + suggest rewrites.

    Returns: [
        {
            "original": "Worked on backend API",
            "relevance": 0.4,
            "rewrite_suggestion": "Architected scalable backend API handling 1M+ requests/day",
            "add_metrics": True
        },
        ...
    ]
    """
    lang_label = "German" if language == "de" else "English"

    user_prompt = f"""Analyze these CV achievements for relevance to the job posting.

Job Posting:
{job_ad_text[:2000]}

Achievements:
{json.dumps(achievements[:20], indent=2)}

For each achievement:
1. Score relevance (0-1) to job requirements
2. Identify if it lacks metrics/quantification
3. Suggest rewrite to make it more impactful and relevant (if applicable)

Return JSON with "achievements" array. Each item has:
- original: original text (string)
- relevance: 0-1 score (number)
- rewrite_suggestion: improved version (string, optional)
- add_metrics: true if lacks quantification (boolean)

Sort by relevance descending. Language: {lang_label}
"""

    system_prompt = "You are a CV writing expert. Assess achievement relevance and suggest improvements. Return valid JSON only."

    response = await _chat_json_openai_async(
        system=system_prompt,
        user=user_prompt,
        max_tokens=4000,
        model="gpt-4.1-mini"
    )
    return response.get("achievements", [])


async def detect_contextual_gaps(
    profile: ExtractedProfile,
    job_ad_text: str,
    language: str
) -> List[ContextualGap]:
    """
    Identify gaps with severity classification.

    Returns list of ContextualGap objects.
    """
    lang_label = "German" if language == "de" else "English"

    # Build profile summary
    profile_summary = {
        "name": profile.full_name,
        "skills": profile.skills_str[:30],
        "experience_years": len(profile.experience),
        "education": [f"{edu.degree} from {edu.school}" for edu in profile.education[:5]],
        "summary": profile.summary[:300] if profile.summary else ""
    }

    user_prompt = f"""Analyze gaps between this CV and job requirements.

Job Posting:
{job_ad_text[:2000]}

CV Profile:
{json.dumps(profile_summary, indent=2)}

Identify:
1. Missing hard skills (technical requirements)
2. Missing soft skills (leadership, communication, etc.)
3. Experience duration gaps (e.g., has 2 years, needs 5)
4. Educational gaps (degree type, certifications)
5. Implicit experience (CV demonstrates skill but doesn't explicitly state it)

For each gap, return:
- gap_type: skill|experience|education|certification (string)
- missing: what's lacking (string)
- severity: critical (deal-breaker) | important (significant) | nice-to-have (minor) (string)
- substitutable: can existing experience compensate? (boolean)
- suggestions: how to address in application (string)

Return JSON with "gaps" array. Focus on actionable gaps. Language: {lang_label}
"""

    system_prompt = "You are a recruitment consultant. Identify CV gaps with context and nuance. Return valid JSON only."

    response = await _chat_json_openai_async(
        system=system_prompt,
        user=user_prompt,
        max_tokens=3000,
        model="gpt-4.1-mini"
    )

    # Convert to ContextualGap objects
    gaps_data = response.get("gaps", [])
    gaps = []
    for gap in gaps_data:
        gaps.append(ContextualGap(
            gap_type=gap.get("gap_type", "skill"),
            missing=gap.get("missing", ""),
            severity=gap.get("severity", "nice-to-have"),
            substitutable=bool(gap.get("substitutable", False)),
            suggestions=gap.get("suggestions", "")
        ))
    return gaps


def merge_match_scores(
    baseline_match,
    semantic_match: SemanticMatchResult,
    weights: Dict[str, float] = None
):
    """
    Merge baseline and semantic match scores.

    Args:
        baseline_match: MatchPayload from parser scanner
        semantic_match: SemanticMatchResult from LLM
        weights: {"baseline": 0.4, "semantic": 0.6}

    Returns:
        MatchPayload with merged scores
    """
    if weights is None:
        weights = {"baseline": 0.4, "semantic": 0.6}

    # Calculate hybrid overall score
    baseline_score = baseline_match.overall_score
    semantic_score = semantic_match.overall_fit * 100  # Convert 0-1 to 0-100

    hybrid_score = (
        baseline_score * weights["baseline"] +
        semantic_score * weights["semantic"]
    )

    # Create new MatchPayload with merged data
    merged = baseline_match.model_copy(deep=True)
    merged.overall_score = hybrid_score
    merged.semantic_match = semantic_match
    merged.matching_strategy = "hybrid"

    # Enhance matched keywords with semantic matches
    semantic_keywords = [
        skill.get("skill", "")
        for skill in semantic_match.matched_hard_skills + semantic_match.matched_soft_skills
    ]
    merged.matched_keywords = list(set(merged.matched_keywords + semantic_keywords))

    # Update missing keywords (remove transferable matches)
    transferable_skills = [
        match.get("job_needs", "")
        for match in semantic_match.transferable_matches
    ]
    merged.missing_keywords = [
        kw for kw in merged.missing_keywords
        if kw not in transferable_skills
    ]

    return merged
