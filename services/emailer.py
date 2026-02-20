"""SMTP email helper for sending generated files."""
from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage


def send_application_email(
    recipient_email: str,
    subject: str,
    body_text: str,
    cv_filename: str,
    cv_bytes: bytes,
    cover_filename: str,
    cover_bytes: bytes,
) -> None:
    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    smtp_port = int((os.getenv("SMTP_PORT") or "587").strip())
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_pass = (os.getenv("SMTP_PASS") or "").strip()
    smtp_from = (os.getenv("SMTP_FROM") or smtp_user).strip()
    smtp_starttls = (os.getenv("SMTP_STARTTLS") or "true").strip().lower() == "true"

    if not smtp_host or not smtp_from:
        raise ValueError("SMTP config missing: set SMTP_HOST and SMTP_FROM (or SMTP_USER).")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = recipient_email
    message.set_content(body_text)

    message.add_attachment(cv_bytes, maintype="application", subtype="pdf", filename=cv_filename)
    message.add_attachment(
        cover_bytes,
        maintype="application",
        subtype="pdf",
        filename=cover_filename,
    )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        if smtp_starttls:
            server.starttls()
        if smtp_user:
            server.login(smtp_user, smtp_pass)
        server.send_message(message)

