"""Unit tests for CV quality validation module."""

import pytest
from happyrav.services.cv_quality import (
    validate_cv_quality,
    analyze_action_verbs,
    check_quantification,
    detect_buzzwords,
    compute_readability,
    check_tense_consistency,
    assess_visual_balance,
)
from happyrav.models import GeneratedContent, ExperienceItem, EducationItem


def test_readability_simple_text():
    """Simple text should have high Flesch score."""
    simple = "I led the team. We delivered projects on time. Results were excellent."
    flesch, fog = compute_readability(simple, "en")
    assert flesch > 60, f"Expected flesch > 60, got {flesch}"
    assert fog < 12, f"Expected fog < 12, got {fog}"


def test_readability_complex_text():
    """Complex jargon should have low Flesch score."""
    complex = "Synergistically orchestrated multifaceted paradigm shifts across cross-functional stakeholder ecosystems."
    flesch, fog = compute_readability(complex, "en")
    assert flesch < 50, f"Expected flesch < 50, got {flesch}"
    assert fog > 14, f"Expected fog > 14, got {fog}"


def test_readability_empty_text():
    """Empty text should return zero scores."""
    flesch, fog = compute_readability("", "en")
    assert flesch == 0.0
    assert fog == 0.0


def test_action_verbs_english():
    """Strong verbs should be detected correctly."""
    achievements = [
        "Led team of 5 engineers",
        "Helped with project tasks",  # weak
        "Delivered 3 major features",
    ]
    ratio, weak = analyze_action_verbs(achievements, "en")
    assert ratio == pytest.approx(2/3, 0.01)
    assert len(weak) == 1
    assert "Helped" in weak[0]


def test_action_verbs_german():
    """German strong verbs should be detected."""
    achievements = [
        "Leitete ein Team von 5 Ingenieuren",
        "Half bei Projektaufgaben",  # weak
        "Entwickelte 3 neue Features",
    ]
    ratio, weak = analyze_action_verbs(achievements, "de")
    assert ratio == pytest.approx(2/3, 0.01)
    assert len(weak) == 1


def test_action_verbs_empty_list():
    """Empty achievements list should return 0 ratio."""
    ratio, weak = analyze_action_verbs([], "en")
    assert ratio == 0.0
    assert len(weak) == 0


def test_quantification():
    """Numbers and metrics should be detected."""
    achievements = [
        "Increased revenue by 30%",
        "Led team of 8 developers",
        "Improved user experience",  # no metric
        "Reduced costs by $50K annually",
    ]
    ratio, unquantified = check_quantification(achievements)
    assert ratio == 0.75  # 3 out of 4
    assert len(unquantified) == 1
    assert "Improved user experience" in unquantified


def test_quantification_various_patterns():
    """Different quantification patterns should be detected."""
    achievements = [
        "Managed $2M budget",
        "Served 10K customers",
        "Reduced time by 50%",
        "Built 3.5 times faster system",
        "Led 15 people team",
        "No metrics here",
    ]
    ratio, unquantified = check_quantification(achievements)
    assert ratio == 5/6  # 5 out of 6 have metrics
    assert len(unquantified) == 1


def test_buzzword_detection_english():
    """Overused buzzwords should be flagged."""
    text = "Synergy-driven rockstar thought leader leveraging best-in-class solutions to game-change the paradigm"
    count, detected = detect_buzzwords(text, "en")
    assert count >= 5
    detected_lower = [d.lower() for d in detected]
    assert "synergy" in detected_lower
    assert "rockstar" in detected_lower
    assert "thought leader" in detected_lower or "thought" in detected_lower


def test_buzzword_detection_german():
    """German buzzwords should be detected."""
    text = "Teamplayer und innovativer Querdenker mit hands-on Mentalität"
    count, detected = detect_buzzwords(text, "de")
    assert count >= 3
    detected_lower = [d.lower() for d in detected]
    assert "teamplayer" in detected_lower or "innovativer" in detected_lower


def test_buzzword_detection_clean_text():
    """Clean professional text should have few buzzwords."""
    text = "Led cross-functional team to deliver cloud migration project on time and under budget"
    count, detected = detect_buzzwords(text, "en")
    assert count <= 1  # "leverage" might be detected as verb form


def test_tense_consistency_past():
    """All past tense should have high consistency."""
    achievements = [
        "Led the development team",
        "Delivered 5 projects",
        "Managed client relationships",
    ]
    score, mixed = check_tense_consistency(achievements, "en")
    assert score >= 80
    assert len(mixed) == 0


def test_tense_consistency_mixed():
    """Mixed tenses should be detected."""
    achievements = [
        "Led the team",  # past
        "Currently leading the team",  # present
        "Managed projects",  # past
    ]
    score, mixed = check_tense_consistency(achievements, "en")
    assert score < 100  # Should detect inconsistency


def test_visual_balance_balanced():
    """Well-balanced content should score high."""
    content = GeneratedContent(
        summary="Brief professional summary here",
        experience=[
            ExperienceItem(
                title="Senior Engineer",
                company="Tech Corp",
                period="2020-2023",
                achievements=["Led team", "Delivered projects", "Improved systems"]
            ),
            ExperienceItem(
                title="Engineer",
                company="Another Corp",
                period="2018-2020",
                achievements=["Built features", "Fixed bugs"]
            )
        ],
        education=[
            EducationItem(
                degree="MSc Computer Science",
                institution="University",
                period="2016-2018"
            )
        ],
        skills=["Python", "Java", "SQL", "Docker", "Kubernetes"],
        cover_greeting="",
        cover_opening="",
        cover_body=[],
        cover_closing=""
    )

    balance = assess_visual_balance(content)
    assert "balance_score" in balance
    assert balance["balance_score"] >= 0
    assert balance["balance_score"] <= 100


def test_visual_balance_empty():
    """Empty content should still return valid balance metrics."""
    content = GeneratedContent(
        summary="",
        experience=[],
        education=[],
        skills=[],
        cover_greeting="",
        cover_opening="",
        cover_body=[],
        cover_closing=""
    )

    balance = assess_visual_balance(content)
    assert "balance_score" in balance
    assert balance["balance_score"] == 100.0  # No variance in empty content


def test_validate_cv_quality_integration():
    """Full quality validation should return complete metrics."""
    cv_text = """
    John Doe
    Senior Software Engineer

    Led team of 5 engineers to deliver cloud migration project.
    Increased system performance by 40%.
    Developed automated testing framework.

    Skills: Python, AWS, Docker, Kubernetes
    """

    content = GeneratedContent(
        summary="Experienced engineer with cloud expertise",
        experience=[
            ExperienceItem(
                title="Senior Engineer",
                company="Tech Corp",
                period="2020-2023",
                achievements=[
                    "Led team of 5 engineers",
                    "Increased performance by 40%",
                    "Developed testing framework"
                ]
            )
        ],
        education=[
            EducationItem(
                degree="BSc Computer Science",
                institution="University",
                period="2012-2016"
            )
        ],
        skills=["Python", "AWS", "Docker"],
        cover_greeting="",
        cover_opening="",
        cover_body=[],
        cover_closing=""
    )

    metrics = validate_cv_quality(cv_text, content, "en")

    # Check all fields present
    assert metrics.readability_score >= 0
    assert metrics.fog_index >= 0
    assert metrics.action_verb_ratio >= 0
    assert metrics.quantification_ratio >= 0
    assert metrics.avg_sentence_length >= 0
    assert metrics.buzzword_count >= 0
    assert metrics.section_balance_score >= 0
    assert metrics.tense_consistency_score >= 0
    assert isinstance(metrics.warnings, list)
    assert isinstance(metrics.recommendations, list)


def test_validate_cv_quality_warnings():
    """Poor quality CV should generate warnings."""
    cv_text = """
    Synergistic rockstar with best-in-class skills.
    I worked on various projects and was responsible for helping the team.
    I also did some coding and handled customer interactions.
    """

    content = GeneratedContent(
        summary="Synergistic rockstar with best-in-class skills",
        experience=[
            ExperienceItem(
                title="Developer",
                company="Company",
                period="2020-2023",
                achievements=[
                    "Worked on projects",
                    "Helped the team",
                    "Did some coding"
                ]
            )
        ],
        education=[],
        skills=["coding"],
        cover_greeting="",
        cover_opening="",
        cover_body=[],
        cover_closing=""
    )

    metrics = validate_cv_quality(cv_text, content, "en")

    # Should have warnings due to:
    # - Buzzwords (synergistic, rockstar, best-in-class)
    # - Weak verbs (worked, helped, did)
    # - No quantification
    assert len(metrics.warnings) > 0
    assert metrics.buzzword_count >= 2
    assert metrics.action_verb_ratio < 0.5  # Mostly weak verbs
