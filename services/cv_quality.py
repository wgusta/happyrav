"""CV Quality Validation Module

Comprehensive quality checks for generated CVs:
- Readability scoring (Flesch, Fog Index)
- Action verb analysis
- Quantification detection
- Buzzword detection
- Tense consistency
- Visual balance
"""

from dataclasses import dataclass
from typing import List, Tuple, Dict
import re
import textstat

from happyrav.models import GeneratedContent


@dataclass
class QualityMetrics:
    """All quality scores and warnings."""
    readability_score: float  # Flesch Reading Ease (0-100, higher = easier)
    fog_index: float  # Gunning Fog (years education needed)
    action_verb_ratio: float  # % achievements with strong verbs
    quantification_ratio: float  # % achievements with metrics
    avg_sentence_length: float  # Words per sentence
    buzzword_count: int  # Cliché occurrences
    section_balance_score: float  # 0-100, distribution
    tense_consistency_score: float  # 0-100, uniformity
    warnings: List[str]  # User-facing issues
    recommendations: List[str]  # Improvement suggestions


# Language-specific dictionaries
STRONG_VERBS = {
    "en": {
        "led", "spearheaded", "architected", "optimized", "delivered", "launched",
        "transformed", "reduced", "increased", "implemented", "designed", "built",
        "executed", "managed", "coordinated", "developed", "created", "established",
        "improved", "streamlined", "achieved", "drove", "directed", "oversaw",
        "pioneered", "engineered", "accelerated", "initiated", "expanded"
    },
    "de": {
        "leitete", "entwickelte", "optimierte", "reduzierte", "steigerte",
        "implementierte", "transformierte", "baute", "führte", "koordinierte",
        "realisierte", "konzipierte", "etablierte", "verbesserte", "schuf",
        "erzielte", "trieb voran", "leitete", "überwachte", "initiierte",
        "erweiterte", "beschleunigte", "konstruierte", "gestaltete"
    }
}

WEAK_VERBS = {
    "en": {
        "did", "worked", "helped", "was responsible for", "handled",
        "dealt with", "involved in", "participated in", "assisted",
        "contributed to", "worked on"
    },
    "de": {
        "arbeitete", "half", "war verantwortlich für", "beschäftigte sich mit",
        "wirkte mit", "beteiligte sich", "unterstützte", "arbeitete an"
    }
}

BUZZWORDS = {
    "en": {
        "synergy", "rockstar", "ninja", "guru", "best-in-class", "game-changer",
        "thought leader", "leverage", "passionate", "dynamic", "innovative",
        "disruptive", "cutting-edge", "world-class", "next-generation",
        "paradigm", "holistic", "strategic thinker", "go-getter", "self-starter"
    },
    "de": {
        "teamplayer", "einzelkämpfer", "innovativ", "dynamisch", "querdenker",
        "hands-on", "proaktiv", "lösungsorientiert", "ergebnisorientiert",
        "zielorientiert", "erfolgsorientiert", "kundenorientiert"
    }
}


def validate_cv_quality(
    cv_text: str,
    generated: GeneratedContent,
    language: str
) -> QualityMetrics:
    """Main orchestrator. Runs all checks and returns comprehensive metrics."""

    warnings = []
    recommendations = []

    # Readability
    flesch, fog = compute_readability(cv_text, language)
    if flesch < 50:
        warnings.append(f"Readability score low ({flesch:.1f}/100). Consider shorter sentences.")
    if fog > 16:
        warnings.append(f"Text complexity high (Fog Index {fog:.1f}). Simplify language.")

    # Action verbs
    all_achievements = []
    for exp in generated.experience:
        all_achievements.extend(exp.achievements)

    action_ratio, weak_list = analyze_action_verbs(all_achievements, language)
    if action_ratio < 0.6:
        warnings.append(f"Only {action_ratio*100:.0f}% strong action verbs. Use more impactful verbs.")
        if weak_list[:2]:
            recommendations.append(f"Strengthen: {', '.join(weak_list[:2])}")

    # Quantification
    quant_ratio, unquant_list = check_quantification(all_achievements)
    if quant_ratio < 0.4:
        warnings.append(f"Only {quant_ratio*100:.0f}% achievements quantified. Add metrics/numbers.")
        if unquant_list[:2]:
            recommendations.append(f"Add metrics to: {', '.join(unquant_list[:2])}")

    # Buzzwords
    buzzword_count, detected = detect_buzzwords(cv_text, language)
    if buzzword_count > 3:
        warnings.append(f"Too many buzzwords ({buzzword_count}). Replace with specific achievements.")
        if detected[:3]:
            recommendations.append(f"Remove/replace: {', '.join(detected[:3])}")

    # Tense consistency
    tense_score, mixed = check_tense_consistency(all_achievements, language)
    if tense_score < 80:
        warnings.append("Inconsistent verb tenses detected. Use past tense for past roles.")

    # Visual balance
    balance_metrics = assess_visual_balance(generated)
    balance_score = balance_metrics.get("balance_score", 100)
    if balance_score < 70:
        warnings.append("Uneven section distribution. Balance content across sections.")

    # Sentence length
    sentences = re.split(r'[.!?]+', cv_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    word_counts = [len(s.split()) for s in sentences]
    avg_length = sum(word_counts) / len(word_counts) if word_counts else 0

    if avg_length > 25:
        warnings.append(f"Average sentence too long ({avg_length:.1f} words). Aim for 15-20 words.")

    return QualityMetrics(
        readability_score=flesch,
        fog_index=fog,
        action_verb_ratio=action_ratio,
        quantification_ratio=quant_ratio,
        avg_sentence_length=avg_length,
        buzzword_count=buzzword_count,
        section_balance_score=balance_score,
        tense_consistency_score=tense_score,
        warnings=warnings,
        recommendations=recommendations
    )


def compute_readability(text: str, language: str) -> Tuple[float, float]:
    """Returns (flesch_score, fog_index) using textstat.

    Flesch Reading Ease: 0-100, higher = easier
    - 90-100: Very easy (5th grade)
    - 60-70: Standard (8th-9th grade)
    - 30-50: Difficult (college level)
    - 0-30: Very difficult (university graduate)

    Gunning Fog Index: Years of education needed
    - <12: Easy
    - 12-14: Ideal for professional docs
    - >16: Very complex
    """
    if not text.strip():
        return 0.0, 0.0

    try:
        # textstat works best with English, but provides reasonable approximations for other languages
        flesch = textstat.flesch_reading_ease(text)
        fog = textstat.gunning_fog(text)

        # Clamp values to reasonable ranges
        flesch = max(0, min(100, flesch))
        fog = max(0, min(30, fog))

        return flesch, fog
    except Exception:
        return 0.0, 0.0


def analyze_action_verbs(achievements: List[str], language: str) -> Tuple[float, List[str]]:
    """Returns (strong_ratio, weak_list).

    Checks first word of each achievement for strong vs weak verbs.
    """
    if not achievements:
        return 0.0, []

    lang = language.lower()
    strong = STRONG_VERBS.get(lang, STRONG_VERBS["en"])
    weak = WEAK_VERBS.get(lang, WEAK_VERBS["en"])

    strong_count = 0
    weak_items = []

    for achievement in achievements:
        if not achievement.strip():
            continue

        # Get first word (verb)
        words = achievement.strip().split()
        if not words:
            continue

        first_word = words[0].lower().strip('.,;:')

        # Check for weak verbs first (includes phrases)
        is_weak = False
        for weak_verb in weak:
            if achievement.lower().startswith(weak_verb):
                is_weak = True
                weak_items.append(achievement[:50] + "..." if len(achievement) > 50 else achievement)
                break

        if is_weak:
            continue

        # Check for strong verbs
        if first_word in strong:
            strong_count += 1

    total = len(achievements)
    ratio = strong_count / total if total > 0 else 0.0

    return ratio, weak_items


def check_quantification(achievements: List[str]) -> Tuple[float, List[str]]:
    """Returns (quantified_ratio, unquantified_list).

    Detects numbers, percentages, currencies, metrics in achievements.
    """
    if not achievements:
        return 0.0, []

    # Patterns for quantification
    patterns = [
        r'\d+[%$€£¥]',  # Numbers with symbols (30%, $50K, €100)
        r'by\s+\d+',  # "by 30", "by 50%"
        r'\d+\s*(users|customers|clients|months|years|projects|people|team members|features|products|systems)',
        r'\d+[KMB]',  # 50K, 2M, 1B
        r'\$\d+',  # $50, $100K
        r'\d+\.\d+',  # 2.5, 3.14
    ]

    combined_pattern = '|'.join(patterns)

    quantified = 0
    unquantified = []

    for achievement in achievements:
        if not achievement.strip():
            continue

        if re.search(combined_pattern, achievement, re.IGNORECASE):
            quantified += 1
        else:
            unquantified.append(achievement[:50] + "..." if len(achievement) > 50 else achievement)

    total = len(achievements)
    ratio = quantified / total if total > 0 else 0.0

    return ratio, unquantified


def detect_buzzwords(text: str, language: str) -> Tuple[int, List[str]]:
    """Returns (count, detected_list).

    Flags overused corporate jargon and empty phrases.
    """
    lang = language.lower()
    buzzwords = BUZZWORDS.get(lang, BUZZWORDS["en"])

    text_lower = text.lower()
    detected = []

    for buzzword in buzzwords:
        # Count occurrences (case-insensitive whole word match)
        pattern = r'\b' + re.escape(buzzword) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            detected.extend([buzzword] * len(matches))

    return len(detected), list(set(detected))  # Unique buzzwords


def check_tense_consistency(achievements: List[str], language: str) -> Tuple[float, List[str]]:
    """Returns (consistency_score, mixed_tense_list).

    Checks if achievements use consistent verb tense (ideally past tense for past roles).
    """
    if not achievements:
        return 100.0, []

    lang = language.lower()

    # Simple heuristic: check for present vs past tense indicators
    if lang == "en":
        past_indicators = [r'\w+ed\b', r'\bwas\b', r'\bwere\b', r'\bhad\b']
        present_indicators = [r'\bam\b', r'\bis\b', r'\bare\b', r'\bhas\b', r'\bhave\b', r'\w+ing\b']
    else:  # German
        past_indicators = [r'\w+te\b', r'\w+ten\b', r'\bwar\b', r'\bwaren\b', r'\bhatte\b']
        present_indicators = [r'\bist\b', r'\bsind\b', r'\bhat\b', r'\bhaben\b']

    past_count = 0
    present_count = 0
    mixed = []

    for achievement in achievements:
        has_past = any(re.search(pattern, achievement, re.IGNORECASE) for pattern in past_indicators)
        has_present = any(re.search(pattern, achievement, re.IGNORECASE) for pattern in present_indicators)

        if has_past:
            past_count += 1
        if has_present:
            present_count += 1

        if has_past and has_present:
            mixed.append(achievement[:50] + "..." if len(achievement) > 50 else achievement)

    # Calculate consistency: higher score if mostly one tense
    total = max(past_count + present_count, 1)
    dominant = max(past_count, present_count)
    consistency = (dominant / total) * 100

    return consistency, mixed


def assess_visual_balance(content: GeneratedContent) -> Dict[str, float]:
    """Returns section word counts, variance, balance score.

    Checks if sections are relatively balanced in length.
    """
    sections = {
        "summary": len(content.summary.split()) if content.summary else 0,
        "experience": sum(
            len(exp.title.split()) +
            len(exp.company.split()) +
            sum(len(ach.split()) for ach in exp.achievements)
            for exp in content.experience
        ),
        "education": sum(
            len(edu.degree.split()) +
            len(edu.institution.split())
            for edu in content.education
        ),
        "skills": len(" ".join(content.skills).split()),
    }

    # Calculate balance score based on variance
    # Lower variance = better balance
    values = [v for v in sections.values() if v > 0]
    if not values:
        return {"balance_score": 100.0, **sections}

    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std_dev = variance ** 0.5

    # Coefficient of variation (normalized std dev)
    cv = (std_dev / mean) if mean > 0 else 0

    # Convert to 0-100 score (lower CV = higher score)
    # CV of 0.5 or less = 100, CV of 2.0 or more = 0
    balance_score = max(0, min(100, 100 - (cv * 50)))

    return {
        "balance_score": balance_score,
        **sections,
        "variance": variance,
        "std_dev": std_dev,
        "cv": cv
    }
