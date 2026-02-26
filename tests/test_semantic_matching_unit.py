"""Unit tests for semantic matching with mocked LLM responses."""
import pytest
from unittest.mock import AsyncMock, patch
from happyrav.services.llm_matching import (
    MATCHING_MODEL,
    extract_semantic_keywords,
    match_skills_semantic,
    rank_skills_by_relevance,
    score_achievement_relevance,
    detect_contextual_gaps,
    merge_match_scores,
)
from happyrav.models import (
    ExtractedProfile,
    ExperienceItem,
    MatchPayload,
    SemanticMatchResult,
    ContextualGap,
)


@pytest.mark.asyncio
@patch("happyrav.services.llm_matching._chat_json_openai_async")
async def test_semantic_keywords_extraction_returns_alternatives(mock_llm):
    """Semantic keyword extraction should parse LLM response into alternatives."""
    # Mock LLM response
    mock_llm.return_value = {
        "required_hard_skills": [
            {
                "skill": "React",
                "alternatives": ["React.js", "ReactJS", "frontend framework"],
                "criticality": 0.95
            },
            {
                "skill": "Python",
                "alternatives": ["Python 3", "Python programming"],
                "criticality": 0.9
            }
        ],
        "required_soft_skills": [
            {
                "skill": "leadership",
                "alternatives": ["team management", "led team"],
                "criticality": 0.8
            }
        ],
        "nice_to_have": [],
        "experience_years": {"minimum": 5, "role": "frontend development"},
        "industry_context": "tech startup"
    }

    job_ad = "We need a React developer with 5 years experience"
    result = await extract_semantic_keywords(job_ad, language="en")

    # Verify structure
    assert "required_hard_skills" in result
    assert len(result["required_hard_skills"]) == 2

    # Verify first skill has alternatives
    react_skill = result["required_hard_skills"][0]
    assert react_skill["skill"] == "React"
    assert "frontend framework" in react_skill["alternatives"]
    assert react_skill["criticality"] == 0.95

    # Verify LLM was called with correct params
    mock_llm.assert_called_once()
    call_args = mock_llm.call_args
    assert "We need a React developer" in call_args.kwargs["user"]
    assert call_args.kwargs["model"] == MATCHING_MODEL


@pytest.mark.asyncio
@patch("happyrav.services.llm_matching._chat_json_openai_async")
async def test_semantic_matching_detects_transferable_skills(mock_llm):
    """Semantic matching should identify transferable skills (React → frontend framework)."""
    # Mock LLM response with transferable match
    mock_llm.return_value = {
        "matched_hard_skills": [
            {"skill": "Python", "evidence": "Listed in skills", "confidence": 0.95}
        ],
        "matched_soft_skills": [],
        "missing_critical": [],
        "transferable_matches": [
            {
                "cv_has": "React",
                "job_needs": "frontend framework",
                "confidence": 0.85
            },
            {
                "cv_has": "Java",
                "job_needs": "object-oriented programming",
                "confidence": 0.8
            }
        ],
        "overall_fit": 0.8
    }

    cv_skills = ["React", "Python", "Java"]
    cv_experience = [{"role": "Developer", "company": "TechCo", "period": "2020-2023", "achievements": []}]
    semantic_keywords = {"required_hard_skills": [{"skill": "frontend framework", "alternatives": [], "criticality": 0.9}]}

    result = await match_skills_semantic(cv_skills, cv_experience, semantic_keywords)

    # Verify transferable skills detected
    assert isinstance(result, SemanticMatchResult)
    assert len(result.transferable_matches) == 2

    # Verify React → frontend framework mapping
    react_match = result.transferable_matches[0]
    assert react_match["cv_has"] == "React"
    assert react_match["job_needs"] == "frontend framework"
    assert react_match["confidence"] == 0.85


@pytest.mark.asyncio
@patch("happyrav.services.llm_matching._chat_json_openai_async")
async def test_gap_detection_classifies_severity(mock_llm):
    """Gap detection should classify gaps by severity (critical/important/nice-to-have)."""
    # Mock LLM response with different severity levels
    mock_llm.return_value = {
        "gaps": [
            {
                "gap_type": "skill",
                "missing": "AWS cloud infrastructure",
                "severity": "critical",
                "substitutable": False,
                "suggestions": "Add AWS certification or cloud project"
            },
            {
                "gap_type": "experience",
                "missing": "3 more years (has 2, needs 5)",
                "severity": "important",
                "substitutable": True,
                "suggestions": "Emphasize project quality over years"
            },
            {
                "gap_type": "skill",
                "missing": "Docker containers",
                "severity": "nice-to-have",
                "substitutable": True,
                "suggestions": "Mention related DevOps experience"
            }
        ]
    }

    profile = ExtractedProfile(
        full_name="John Doe",
        skills=["Python", "SQL"],
        experience=[
            ExperienceItem(role="Backend Dev", company="StartupCo", period="2022-2024", achievements=[])
        ]
    )
    job_ad = "Seeking senior AWS engineer with 5+ years experience"

    result = await detect_contextual_gaps(profile, job_ad, language="en")

    # Verify gaps returned as ContextualGap objects
    assert len(result) == 3
    assert all(isinstance(gap, ContextualGap) for gap in result)

    # Verify severity classification
    critical_gaps = [g for g in result if g.severity == "critical"]
    important_gaps = [g for g in result if g.severity == "important"]
    nice_to_have = [g for g in result if g.severity == "nice-to-have"]

    assert len(critical_gaps) == 1
    assert critical_gaps[0].missing == "AWS cloud infrastructure"
    assert not critical_gaps[0].substitutable

    assert len(important_gaps) == 1
    assert "3 more years" in important_gaps[0].missing
    assert important_gaps[0].substitutable

    assert len(nice_to_have) == 1


def test_merge_match_scores_calculates_weighted_average():
    """Hybrid score should be weighted average: 40% baseline + 60% semantic."""
    # Create baseline match (60% score)
    baseline = MatchPayload(
        overall_score=60.0,
        category_scores={"skills_match": 50.0},
        matched_keywords=["Python", "SQL"],
        missing_keywords=["AWS", "Docker"]
    )

    # Create semantic match (90% fit)
    semantic = SemanticMatchResult(
        matched_hard_skills=[{"skill": "Python", "evidence": "Listed", "confidence": 0.95}],
        matched_soft_skills=[],
        missing_critical=["AWS"],
        transferable_matches=[{"cv_has": "SQL", "job_needs": "data modeling", "confidence": 0.8}],
        overall_fit=0.9  # 90%
    )

    # Merge with 40/60 weights
    result = merge_match_scores(baseline, semantic, weights={"baseline": 0.4, "semantic": 0.6})

    # Verify hybrid score calculation
    # Expected: 60 * 0.4 + 90 * 0.6 = 24 + 54 = 78
    assert result.overall_score == 78.0

    # Verify semantic match attached
    assert result.semantic_match is not None
    assert result.semantic_match.overall_fit == 0.9

    # Verify matching strategy tagged
    assert result.matching_strategy == "hybrid"

    # Verify matched keywords enhanced
    assert "Python" in result.matched_keywords
    assert len(result.matched_keywords) >= 2  # Baseline + semantic

    # Verify transferable skills removed from missing
    # "data modeling" should be removed since SQL is transferable
    assert "data modeling" not in result.missing_keywords


@pytest.mark.asyncio
@patch("happyrav.services.llm_matching._chat_json_openai_async")
async def test_rank_skills_by_relevance_scores_0_to_1(mock_llm):
    """Skill ranking should return relevance scores between 0-1."""
    # Mock LLM response with ranked skills
    mock_llm.return_value = {
        "ranked_skills": [
            {"skill": "Python", "relevance": 0.95, "category": "technical", "reasoning": "Core requirement"},
            {"skill": "AWS", "relevance": 0.85, "category": "tool", "reasoning": "Cloud platform needed"},
            {"skill": "Excel", "relevance": 0.2, "category": "tool", "reasoning": "Not relevant to role"}
        ]
    }

    cv_skills = ["Python", "AWS", "Excel"]
    job_ad = "Backend Python developer needed with cloud experience"

    result = await rank_skills_by_relevance(cv_skills, job_ad, language="en")

    # Verify ranking structure
    assert len(result) == 3

    # Verify high relevance skill
    python_skill = result[0]
    assert python_skill["skill"] == "Python"
    assert python_skill["relevance"] == 0.95
    assert 0 <= python_skill["relevance"] <= 1

    # Verify low relevance skill
    excel_skill = result[2]
    assert excel_skill["relevance"] == 0.2
    assert excel_skill["relevance"] < 0.5  # Low relevance


@pytest.mark.asyncio
@patch("happyrav.services.llm_matching._chat_json_openai_async")
async def test_achievement_scoring_suggests_metric_rich_rewrites(mock_llm):
    """Achievement scoring should flag vague achievements and suggest metric-rich rewrites."""
    # Mock LLM response with rewrite suggestions
    mock_llm.return_value = {
        "achievements": [
            {
                "original": "Led backend team",
                "relevance": 0.9,
                "rewrite_suggestion": "Led backend team of 12 developers across 5 microservices",
                "add_metrics": True
            },
            {
                "original": "Improved system performance by 40% reducing latency from 500ms to 300ms",
                "relevance": 0.95,
                "rewrite_suggestion": "",  # Already has metrics
                "add_metrics": False
            },
            {
                "original": "Worked on frontend",
                "relevance": 0.3,
                "rewrite_suggestion": "Architected React frontend handling 10K+ daily users",
                "add_metrics": True
            }
        ]
    }

    achievements = [
        "Led backend team",
        "Improved system performance by 40% reducing latency from 500ms to 300ms",
        "Worked on frontend"
    ]
    job_ad = "Backend team lead needed for microservices architecture"

    result = await score_achievement_relevance(achievements, job_ad, language="en")

    # Verify achievements scored
    assert len(result) == 3

    # Verify vague achievement flagged
    vague_achievement = result[0]
    assert vague_achievement["original"] == "Led backend team"
    assert vague_achievement["add_metrics"] is True
    assert "12 developers" in vague_achievement["rewrite_suggestion"]

    # Verify achievement with metrics not flagged
    good_achievement = result[1]
    assert good_achievement["add_metrics"] is False
    assert good_achievement["relevance"] == 0.95

    # Verify rewrite suggestions provided
    rewrites_count = sum(1 for a in result if a.get("rewrite_suggestion"))
    assert rewrites_count >= 2
