"""Smoke tests for happyRAV Start page flow."""
import pytest
from happyrav.models import SessionState


def print_profile_summary(state: SessionState) -> None:
    """Print profile summary for visual inspection."""
    p = state.extracted_profile
    print("\n" + "=" * 60)
    print("PROFILE SUMMARY")
    print("=" * 60)
    print(f"Name: {p.full_name}")
    print(f"Email: {p.email}")
    print(f"Phone: {p.phone}")
    print(f"Location: {p.location}")
    print(f"LinkedIn: {p.linkedin}")
    print(f"Portfolio: {p.portfolio}")
    print(f"\nSummary: {p.summary[:100]}..." if len(p.summary) > 100 else f"\nSummary: {p.summary}")
    print(f"\nSkills ({len(p.skills)}): {', '.join(p.skills[:10])}")

    print(f"\nExperience ({len(p.experience)} entries):")
    for i, exp in enumerate(p.experience, 1):
        print(f"  {i}. {exp.role} @ {exp.company} ({exp.period})")
        print(f"     Achievements: {len(exp.achievements)}")

    print(f"\nEducation ({len(p.education)} entries):")
    for i, edu in enumerate(p.education, 1):
        print(f"  {i}. {edu.degree} @ {edu.school} ({edu.period})")
    print("=" * 60 + "\n")


def print_telos_summary(telos_dict: dict) -> None:
    """Print telos context for visual inspection."""
    print("\n" + "=" * 60)
    print("TELOS CONTEXT")
    print("=" * 60)
    for key, value in telos_dict.items():
        print(f"\n{key.upper()}:")
        print(f"  {value}")
    print("=" * 60 + "\n")


class TestSmokeBasicFields:
    """Smoke test for basic intake flow (minimal required fields)."""

    def test_basic_intake_flow(self, test_client, mock_llm_extract):
        """Test user fills only basic/required fields on start page."""
        # Realistic job ad text
        job_ad = """
Senior Software Engineer

TechCorp AG is looking for a Senior Software Engineer to join our Zurich team.

Requirements:
- 5+ years experience in backend development
- Strong Python and FastAPI skills
- Experience with PostgreSQL and Docker
- Excellent communication skills in English and German

Responsibilities:
- Design and implement scalable microservices
- Lead technical discussions and code reviews
- Mentor junior engineers
- Collaborate with product team

We offer competitive salary, flexible working hours, and modern tech stack.
        """.strip()

        # 1. Create session with basic fields
        response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TechCorp AG",
                "position_title": "Senior Software Engineer",
                "job_ad_text": job_ad,
                "consent_confirmed": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        session_id = data["session_id"]
        state_data = data["state"]

        # 2. Verify session created successfully
        assert session_id is not None
        assert len(session_id) > 0

        # 3. Verify intake fields persisted
        assert state_data["company_name"] == "TechCorp AG"
        assert state_data["position_title"] == "Senior Software Engineer"
        assert "5+ years experience" in state_data["job_ad_text"]
        assert state_data["consent_confirmed"] is True
        # Phase advances to "upload" when consent + job_ad_text provided
        assert state_data["phase"] == "upload"

        # 4. Verify profile is empty (no documents uploaded yet)
        profile = state_data["profile"]
        assert profile["full_name"] == ""
        assert profile["email"] == ""
        assert len(profile["experience"]) == 0
        assert len(profile["education"]) == 0

        # 5. GET session state to verify persistence
        get_response = test_client.get(f"/api/session/{session_id}/state")
        assert get_response.status_code == 200
        get_data = get_response.json()

        assert get_data["state"]["company_name"] == "TechCorp AG"
        assert get_data["state"]["position_title"] == "Senior Software Engineer"

        # Visual inspection output
        print("\n" + "=" * 60)
        print("BASIC FIELDS SMOKE TEST")
        print("=" * 60)
        print(f"Session ID: {session_id}")
        print(f"Company: {state_data['company_name']}")
        print(f"Position: {state_data['position_title']}")
        print(f"Phase: {state_data['phase']}")
        print(f"Job Ad (first 100 chars): {state_data['job_ad_text'][:100]}...")
        print(f"Profile populated: {bool(profile['full_name'])}")
        print("=" * 60 + "\n")


class TestSmokeAdvancedFields:
    """Smoke test for advanced profile + telos fields via preseed."""

    def test_advanced_profile_and_telos(self, test_client, mock_llm_extract):
        """Test user fills all advanced profile + telos fields."""
        # 1. Create basic session first
        job_ad = """
Backend Engineer position at SwissTech AG. Requirements: Python, FastAPI,
PostgreSQL, Docker, AWS. 3+ years experience. Zurich location.
        """.strip()

        start_response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "SwissTech AG",
                "position_title": "Backend Engineer",
                "job_ad_text": job_ad,
                "consent_confirmed": True,
            },
        )

        assert start_response.status_code == 200
        session_id = start_response.json()["session_id"]

        # 2. Preseed with comprehensive profile + telos
        preseed_payload = {
            "profile": {
                "full_name": "Max Mustermann",
                "email": "max@example.ch",
                "phone": "+41 79 123 45 67",
                "location": "Zürich, Switzerland",
                "linkedin": "https://linkedin.com/in/maxmuster",
                "portfolio": "https://maxmuster.dev",
                "summary": "Experienced backend engineer with focus on scalable systems",
                "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
                "languages": ["German", "English", "French"],
                "experience": [
                    {
                        "role": "Senior Backend Engineer",
                        "company": "SwissTech AG",
                        "period": "Jan 2020 - Present",
                        "achievements": [
                            "Led migration to microservices architecture",
                            "Reduced API latency by 40%",
                            "Managed team of 3 engineers",
                        ],
                    },
                    {
                        "role": "Software Engineer",
                        "company": "StartupCorp",
                        "period": "Jun 2017 - Dec 2019",
                        "achievements": [
                            "Built payment processing system handling CHF 2M monthly",
                            "Implemented CI/CD pipeline reducing deploy time by 60%",
                        ],
                    },
                ],
                "education": [
                    {
                        "degree": "MSc Computer Science",
                        "school": "ETH Zürich",
                        "period": "2015 - 2017",
                    },
                    {
                        "degree": "BSc Information Systems",
                        "school": "University of Zurich",
                        "period": "2012 - 2015",
                    },
                ],
            },
            "telos": {
                "career_goal": "Lead engineering teams in product companies with real-world impact",
                "work_environment": "Async-first, collaborative, data-driven culture",
                "values": "Ownership, continuous learning, shipping with quality",
                "strengths": "System design, debugging complex issues, clear communication",
                "motivators": "Autonomy, mastery, building products people love",
                "success_vision": "Own features end-to-end and see measurable user adoption",
                "work_style": "Deep work mornings, collaborative afternoons, written communication",
                "impact": "Help the product reach 100k+ users with reliable infrastructure",
            },
        }

        preseed_response = test_client.post(
            f"/api/session/{session_id}/preseed",
            json=preseed_payload,
        )

        assert preseed_response.status_code == 200
        preseed_data = preseed_response.json()
        state_data = preseed_data["state"]

        # 3. Verify all profile fields persisted
        profile = state_data["profile"]
        assert profile["full_name"] == "Max Mustermann"
        assert profile["email"] == "max@example.ch"
        assert profile["phone"] == "+41 79 123 45 67"
        assert profile["location"] == "Zürich, Switzerland"
        assert profile["linkedin"] == "https://linkedin.com/in/maxmuster"
        assert profile["portfolio"] == "https://maxmuster.dev"
        assert "scalable systems" in profile["summary"]

        # Verify skills array
        assert len(profile["skills"]) == 5
        assert "Python" in profile["skills"]
        assert "FastAPI" in profile["skills"]
        assert "AWS" in profile["skills"]

        # Verify languages
        assert len(profile["languages"]) == 3
        assert "German" in profile["languages"]

        # Verify experience (2 entries)
        assert len(profile["experience"]) == 2
        exp1 = profile["experience"][0]
        assert exp1["role"] == "Senior Backend Engineer"
        assert exp1["company"] == "SwissTech AG"
        assert exp1["period"] == "Jan 2020 - Present"
        assert len(exp1["achievements"]) == 3
        assert "microservices" in exp1["achievements"][0].lower()

        exp2 = profile["experience"][1]
        assert exp2["role"] == "Software Engineer"
        assert exp2["company"] == "StartupCorp"
        assert len(exp2["achievements"]) == 2

        # Verify education (2 entries)
        assert len(profile["education"]) == 2
        edu1 = profile["education"][0]
        assert edu1["degree"] == "MSc Computer Science"
        assert edu1["school"] == "ETH Zürich"
        assert edu1["period"] == "2015 - 2017"

        edu2 = profile["education"][1]
        assert edu2["degree"] == "BSc Information Systems"
        assert edu2["school"] == "University of Zurich"

        # 4. Verify telos persisted (access via session cache since not in API payload)
        from happyrav.main import session_cache
        record = session_cache.get(session_id)
        assert record is not None
        telos = record.state.telos_context
        assert len(telos) == 8
        assert telos["career_goal"] == "Lead engineering teams in product companies with real-world impact"
        assert telos["work_environment"] == "Async-first, collaborative, data-driven culture"
        assert telos["values"] == "Ownership, continuous learning, shipping with quality"
        assert telos["strengths"] == "System design, debugging complex issues, clear communication"
        assert telos["motivators"] == "Autonomy, mastery, building products people love"
        assert telos["success_vision"] == "Own features end-to-end and see measurable user adoption"
        assert telos["work_style"] == "Deep work mornings, collaborative afternoons, written communication"
        assert telos["impact"] == "Help the product reach 100k+ users with reliable infrastructure"

        # 5. GET session to verify persistence
        get_response = test_client.get(f"/api/session/{session_id}/state")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["state"]["profile"]["full_name"] == "Max Mustermann"
        assert len(record.state.telos_context) == 8

        # Convert to SessionState for visual inspection helpers
        print_profile_summary(record.state)
        print_telos_summary(telos)

        # Additional visual inspection
        print("\n" + "=" * 60)
        print("ADVANCED FIELDS SMOKE TEST SUMMARY")
        print("=" * 60)
        print(f"Session ID: {session_id}")
        print(f"Profile fields populated: ✓")
        print(f"  - Contact info: {bool(profile['email'] and profile['phone'])}")
        print(f"  - Experience entries: {len(profile['experience'])}")
        print(f"  - Education entries: {len(profile['education'])}")
        print(f"  - Skills count: {len(profile['skills'])}")
        print(f"  - Languages count: {len(profile['languages'])}")
        print(f"Telos fields populated: ✓")
        print(f"  - Total telos fields: {len(telos)}/8")
        print("=" * 60 + "\n")
