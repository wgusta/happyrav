"""Tests for CV Builder render endpoint."""
import pytest


class TestBuilderRenderEndpoint:
    """POST /api/builder/render endpoint tests."""

    def test_render_minimal_data(self, test_client, minimal_cv_data):
        resp = test_client.post("/api/builder/render", json=minimal_cv_data)
        assert resp.status_code == 200
        data = resp.json()
        assert "html" in data
        assert "filename" in data
        assert "Test User" in data["html"]

    def test_render_full_data(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/render", json=sample_cv_data)
        assert resp.status_code == 200
        data = resp.json()
        assert "Max Muster" in data["html"]
        assert "Software Engineer" in data["html"]

    @pytest.mark.parametrize("template_id", ["green", "cutset", "business", "freundlich"])
    def test_each_template_renders(self, test_client, sample_cv_data, template_id):
        sample_cv_data["template_id"] = template_id
        resp = test_client.post("/api/builder/render", json=sample_cv_data)
        assert resp.status_code == 200
        assert "Max Muster" in resp.json()["html"]

    def test_unknown_template_falls_back_to_green(self, test_client, minimal_cv_data):
        minimal_cv_data["template_id"] = "nonexistent"
        resp = test_client.post("/api/builder/render", json=minimal_cv_data)
        assert resp.status_code == 200
        assert "Test User" in resp.json()["html"]

    def test_de_section_headers(self, test_client, sample_cv_data):
        sample_cv_data["language"] = "de"
        resp = test_client.post("/api/builder/render", json=sample_cv_data)
        html = resp.json()["html"]
        assert "Berufserfahrung" in html or "Erfahrung" in html

    def test_en_section_headers(self, test_client, sample_cv_data):
        sample_cv_data["language"] = "en"
        resp = test_client.post("/api/builder/render", json=sample_cv_data)
        html = resp.json()["html"]
        assert "Experience" in html

    def test_empty_optional_sections_omitted(self, test_client, minimal_cv_data):
        resp = test_client.post("/api/builder/render", json=minimal_cv_data)
        html = resp.json()["html"]
        # No military, certifications, projects, references in minimal data
        assert "Militär" not in html
        assert "Military" not in html

    def test_photo_renders_img_tag(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/render", json=sample_cv_data)
        html = resp.json()["html"]
        assert "data:image/png;base64," in html
        assert "<img" in html

    def test_filename_contains_name(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/render", json=sample_cv_data)
        filename = resp.json()["filename"]
        assert "Max_Muster" in filename
        assert filename.endswith(".html")


class TestBuilderMarkdownExport:
    """POST /api/builder/markdown endpoint tests."""

    def test_markdown_returns_200(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/markdown", json=sample_cv_data)
        assert resp.status_code == 200
        data = resp.json()
        assert "markdown" in data
        assert "filename" in data
        assert data["filename"].endswith(".md")

    def test_markdown_contains_name_and_headline(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/markdown", json=sample_cv_data)
        md = resp.json()["markdown"]
        assert "# Max Muster" in md
        assert "**Software Engineer**" in md

    def test_markdown_contains_sections(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/markdown", json=sample_cv_data)
        md = resp.json()["markdown"]
        assert "## Contact" in md
        assert "## Summary" in md
        assert "## Skills" in md
        assert "## Experience" in md
        assert "## Education" in md

    def test_markdown_experience_detail(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/markdown", json=sample_cv_data)
        md = resp.json()["markdown"]
        assert "Senior Developer | Tech AG" in md
        assert "Led team of 5" in md

    def test_markdown_skills_with_metadata(self, test_client, sample_cv_data):
        resp = test_client.post("/api/builder/markdown", json=sample_cv_data)
        md = resp.json()["markdown"]
        assert "Python (Expert) [Backend]: FastAPI, Django" in md

    def test_markdown_references_on_request(self, test_client, sample_cv_data):
        sample_cv_data["references"] = []
        sample_cv_data["references_on_request"] = True
        resp = test_client.post("/api/builder/markdown", json=sample_cv_data)
        md = resp.json()["markdown"]
        assert "*Available on request*" in md

    def test_markdown_empty_sections_omitted(self, test_client, minimal_cv_data):
        resp = test_client.post("/api/builder/markdown", json=minimal_cv_data)
        md = resp.json()["markdown"]
        assert "## Military" not in md
        assert "## Certifications" not in md
        assert "## Projects" not in md


class TestBuilderPage:
    """GET /builder page test."""

    def test_builder_page_loads(self, test_client):
        resp = test_client.get("/builder")
        assert resp.status_code == 200
        assert "builder" in resp.text.lower()
