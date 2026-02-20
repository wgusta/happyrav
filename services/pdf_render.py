"""HTML to PDF rendering via WeasyPrint."""
from __future__ import annotations


BASE_PRINT_CSS = """
@page {
  size: A4;
  margin: 16mm;
}
"""


def render_pdf(html_text: str) -> bytes:
    try:
        from weasyprint import CSS, HTML
    except Exception as exc:
        raise RuntimeError(
            "WeasyPrint dependencies are missing. Use Docker image or install native libs."
        ) from exc

    html = HTML(string=html_text)
    return html.write_pdf(stylesheets=[CSS(string=BASE_PRINT_CSS)])
