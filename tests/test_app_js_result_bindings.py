"""Ensure removed result chat bindings are not present in frontend JS."""

from pathlib import Path


def test_app_js_has_no_result_chat_bindings():
    app_js = Path(__file__).resolve().parents[1] / "static" / "app.js"
    content = app_js.read_text(encoding="utf-8")
    assert "result-chat-input" not in content
    assert "result-chat-send" not in content
    assert "result-chat-messages" not in content
    assert "resultChatSend" not in content
    assert "result.chat_title" not in content
    assert "result.chat_placeholder" not in content
    assert "result.chat_send" not in content
