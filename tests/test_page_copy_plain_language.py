def test_start_page_plain_language_copy(test_client):
    response = test_client.get("/start")
    assert response.status_code == 200
    html = response.text

    assert "Paste the job ad, add optional company/position details, then confirm consent." in html
    assert "Job ad text (required)" in html
    assert "Company + position (optional)" in html
    assert "Consent checkbox (required)" in html
    assert "Optional: Enter profile manually" in html
    assert "Optional: Career goals and values" in html


def test_upload_questions_review_plain_language_copy(test_client):
    upload_html = test_client.get("/upload").text
    assert "Add your details section by section. Keep facts clear and short." in upload_html
    assert "Contact info" in upload_html
    assert "Example: full name, email, phone, city, LinkedIn." in upload_html
    assert "Work history" in upload_html
    assert "One role per entry. Include tasks and measurable results." in upload_html
    assert "Add exact tools and skills you have used (for example: Python, SQL, Jira)." in upload_html

    questions_html = test_client.get("/questions").text
    assert "Please confirm missing details." in questions_html
    assert "Save and continue" in questions_html

    review_html = test_client.get("/review").text
    assert "Pick a template, check the match score, then decide if you want to generate." in review_html
    assert "Keyword comparison: job ad vs your CV" in review_html
    assert "Keywords are extracted from the job ad. Missing terms are listed below." in review_html
    assert "Text quality check" in review_html


def test_plain_language_changes_keep_core_ids(test_client):
    start_html = test_client.get("/start").text
    upload_html = test_client.get("/upload").text
    review_html = test_client.get("/review").text

    assert 'id="input-job-ad"' in start_html
    assert 'id="upload-name"' in upload_html
    assert 'id="upload-experience-list"' in upload_html
    assert 'id="review-template"' in review_html
    assert 'id="review-score"' in review_html
