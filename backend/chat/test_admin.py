import pytest
from django.contrib.auth.models import User
from chat.models import Conversation, Message
from chat.admin import MessageAdmin


@pytest.mark.django_db
class TestAdmin:
    """Tests for Django admin configuration"""

    def test_message_admin_content_preview_short(self):
        """Test content_preview with short content"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        message = Message.objects.create(
            conversation=conversation, role="user", content="Short message"
        )
        admin = MessageAdmin(Message, None)
        preview = admin.content_preview(message)
        assert preview == "Short message"

    def test_message_admin_content_preview_long(self):
        """Test content_preview with long content (>50 chars)"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        long_content = "This is a very long message that exceeds fifty characters and should be truncated"
        message = Message.objects.create(
            conversation=conversation, role="user", content=long_content
        )
        admin = MessageAdmin(Message, None)
        preview = admin.content_preview(message)
        assert len(preview) == 53  # 50 chars + "..."
        assert preview.endswith("...")
        assert preview.startswith(long_content[:50])
