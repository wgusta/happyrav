"""Tests for CV Builder Jinja2 template rendering."""
import pytest

from happyrav.models import CVData
from happyrav.services.templating import render_builder_cv_html


class TestTemplateRendering:
    """Each template renders valid HTML with full data."""

    @pytest.mark.parametrize("template_id", ["green", "cutset", "business", "freundlich"])
    def test_template_renders_valid_html(self, sample_cv_data, template_id):
        sample_cv_data["template_id"] = template_id
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "<!DOCTYPE html>" in html
        assert "Max Muster" in html
        assert "</html>" in html

    @pytest.mark.parametrize("template_id", ["green", "cutset", "business", "freundlich"])
    def test_experience_renders(self, sample_cv_data, template_id):
        sample_cv_data["template_id"] = template_id
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "Senior Developer" in html
        assert "Tech AG" in html

    @pytest.mark.parametrize("template_id", ["green", "cutset", "business", "freundlich"])
    def test_education_renders(self, sample_cv_data, template_id):
        sample_cv_data["template_id"] = template_id
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "MSc Computer Science" in html
        assert "ETH" in html


class TestSkillRendering:
    """Skills render differently per template."""

    def test_green_skills_render(self, sample_cv_data):
        sample_cv_data["template_id"] = "green"
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "Python" in html

    def test_cutset_skills_visual_tags(self, sample_cv_data):
        sample_cv_data["template_id"] = "cutset"
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "Python" in html
        assert "FastAPI" in html  # description shown

    def test_business_skills_categories(self, sample_cv_data):
        sample_cv_data["template_id"] = "business"
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "Python" in html
        assert "Backend" in html  # category shown


class TestKPIRendering:
    """KPIs render in cutset/business, hidden in green/freundlich."""

    def test_kpis_in_cutset(self, sample_cv_data):
        sample_cv_data["template_id"] = "cutset"
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "10+" in html
        assert "Jahre Erfahrung" in html

    def test_kpis_in_business(self, sample_cv_data):
        sample_cv_data["template_id"] = "business"
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "10+" in html

    def test_no_kpis_in_green(self, sample_cv_data):
        sample_cv_data["template_id"] = "green"
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "kpi" not in html.lower() or "Jahre Erfahrung" not in html


class TestReferencesRendering:
    """References and on-request flag."""

    def test_references_render(self, sample_cv_data):
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "Excellent engineer" in html or "Jane Doe" in html

    def test_references_on_request(self, sample_cv_data):
        sample_cv_data["references"] = []
        sample_cv_data["references_on_request"] = True
        cv = CVData(**sample_cv_data)
        html = render_builder_cv_html(cv)
        assert "Auf Anfrage" in html or "On request" in html
