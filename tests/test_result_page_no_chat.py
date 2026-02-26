"""Result page should not render the CV refinement chat UI."""


def test_result_page_template_has_no_chat_controls(test_client):
    response = test_client.get("/result-page")
    assert response.status_code == 200
    html = response.text
    assert "result-chat-accordion" not in html
    assert "result-chat-input" not in html
    assert "result-chat-send" not in html
    assert "CV verfeinern" not in html
