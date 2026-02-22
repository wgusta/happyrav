"""Integration tests for LLM-based semantic matching."""
import pytest
from happyrav.services.llm_matching import (
    extract_semantic_keywords,
    match_skills_semantic,
    rank_skills_by_relevance,
    score_achievement_relevance,
    detect_contextual_gaps,
    merge_match_scores,
)
from happyrav.models import ExtractedProfile, MatchPayload, ExperienceItem


@pytest.mark.asyncio
async def test_semantic_keywords_extraction_has_alternatives():
    """Semantic keyword extraction should return alternatives for key skills."""
    job_ad = """
    We are seeking a Senior Frontend Developer with expertise in modern JavaScript frameworks.

    Requirements:
    - 5+ years experience with frontend frameworks (React, Vue, or Angular)
    - Strong understanding of responsive design
    - Experience with RESTful APIs
    - Team leadership experience
    """

    result = await extract_semantic_keywords(job_ad, language="en")

    # Verify structure
    assert "required_hard_skills" in result
    assert "required_soft_skills" in result

    # Verify hard skills have alternatives
    hard_skills = result["required_hard_skills"]
    assert len(hard_skills) > 0

    # Find a skill entry (should have alternatives)
    skill_with_alternatives = None
    for skill in hard_skills:
        if skill.get("alternatives") and len(skill["alternatives"]) > 0:
            skill_with_alternatives = skill
            break

    assert skill_with_alternatives is not None, "At least one skill should have alternatives"
    assert "skill" in skill_with_alternatives
    assert "criticality" in skill_with_alternatives
    assert 0 <= skill_with_alternatives["criticality"] <= 1
