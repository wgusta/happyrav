from pathlib import Path
import re


APP_JS_PATH = Path(__file__).resolve().parents[1] / "static" / "app.js"
TEMPLATE_PATHS = [
    Path(__file__).resolve().parents[1] / "templates" / "_page_start.html",
    Path(__file__).resolve().parents[1] / "templates" / "_page_upload.html",
    Path(__file__).resolve().parents[1] / "templates" / "_page_questions.html",
    Path(__file__).resolve().parents[1] / "templates" / "_page_review.html",
]


def _locale_block(text: str, locale: str) -> str:
    if locale == "en":
        return text.split("en: {", 1)[1].split("\n    },\n    de: {", 1)[0]
    if locale == "de":
        return text.split("de: {", 1)[1].split("\n    },\n  };", 1)[0]
    raise ValueError(locale)


def _locale_keys(text: str, locale: str) -> set[str]:
    return set(re.findall(r'"([^\"]+)":', _locale_block(text, locale)))


def _locale_pairs(text: str, locale: str) -> dict[str, str]:
    return dict(re.findall(r'"([^\"]+)": "((?:\\"|[^\"])*)"', _locale_block(text, locale)))


def _template_i18n_keys() -> set[str]:
    keys: set[str] = set()
    for path in TEMPLATE_PATHS:
        keys.update(re.findall(r'data-i18n(?:-placeholder)?="([^\"]+)"', path.read_text()))
    return keys


def test_plain_language_template_keys_exist_in_en_and_de():
    text = APP_JS_PATH.read_text()
    en_keys = _locale_keys(text, "en")
    de_keys = _locale_keys(text, "de")
    template_keys = _template_i18n_keys()

    missing_en = sorted(key for key in template_keys if key not in en_keys)
    missing_de = sorted(key for key in template_keys if key not in de_keys)

    assert not missing_en, f"Missing en i18n keys: {missing_en}"
    assert not missing_de, f"Missing de i18n keys: {missing_de}"


def test_plain_language_changed_keys_have_en_de_parity():
    text = APP_JS_PATH.read_text()
    en = _locale_pairs(text, "en")
    de = _locale_pairs(text, "de")

    changed_keys = [
        "progress.upload",
        "progress.questions",
        "progress.review",
        "questions.sub",
        "review.sub",
        "upload.page_sub",
        "action.save_answers",
        "action.preview_match",
        "action.continue_upload",
        "action.continue_questions",
        "action.continue_review",
        "adv.profile_title",
        "adv.telos_title",
        "upload.cv_contact_help",
        "upload.cv_skills_help",
        "upload.cv_experience_help",
        "upload.cv_education_help",
        "comparison.keywords_help",
        "quality.title",
        "optimization.title",
        "optimization.subtitle",
    ]

    missing_en = [key for key in changed_keys if key not in en]
    missing_de = [key for key in changed_keys if key not in de]
    assert not missing_en, f"Changed keys missing in en: {missing_en}"
    assert not missing_de, f"Changed keys missing in de: {missing_de}"

    for key in changed_keys:
        assert en[key].strip(), f"Empty en value for {key}"
        assert de[key].strip(), f"Empty de value for {key}"
        assert en[key] != key
        assert de[key] != key
