import pytest
from django.contrib.auth.models import User
from chat.models import Conversation, Message


@pytest.mark.django_db
class TestChatAPI:
    """Tests for chat API endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup unique identifiers for each test"""
        import uuid

        self.test_id = str(uuid.uuid4())[:8]
        yield
        # Cleanup: delete any users created in this test
        User.objects.filter(username__startswith=f"testuser_{self.test_id}").delete()

    @pytest.fixture
    def api_client(self):
        """Create a test client"""
        from django.test import Client

        return Client()

    @pytest.fixture
    def authenticated_client(self, api_client, setup):
        """Create an authenticated test client"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        api_client.force_login(user)
        return api_client, user

    def test_list_conversations_unauthenticated(self, api_client):
        """Test listing conversations without authentication"""
        response = api_client.get("/api/chat/conversations")
        assert response.status_code == 401

    def test_list_conversations_empty(self, authenticated_client):
        """Test listing conversations when user has none"""
        client, _ = authenticated_client
        response = client.get("/api/chat/conversations")
        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_conversations(self, authenticated_client):
        """Test listing user's conversations"""
        client, user = authenticated_client
        conv1 = Conversation.objects.create(
            title="Chat 1",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )
        conv2 = Conversation.objects.create(
            title="Chat 2",
            selected_models=["claude-haiku-4-5"],
            user=user,
        )
        # Create a conversation for another user
        other_user = User.objects.create_user(
            username=f"other_{self.test_id}",
            email=f"other_{self.test_id}@example.com",
            password="pass123",
        )
        Conversation.objects.create(
            title="Other Chat",
            selected_models=["claude-sonnet-4-5"],
            user=other_user,
        )

        response = client.get("/api/chat/conversations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        conv_ids = [conv["id"] for conv in data]
        assert conv1.id in conv_ids
        assert conv2.id in conv_ids

    def test_create_conversation_unauthenticated(self, api_client):
        """Test creating conversation without authentication"""
        response = api_client.post(
            "/api/chat/conversations",
            data={
                "title": "New Chat",
                "selected_models": ["claude-sonnet-4-5"],
            },
            content_type="application/json",
        )
        assert response.status_code == 401

    def test_create_conversation_success(self, authenticated_client):
        """Test successful conversation creation"""
        client, user = authenticated_client
        response = client.post(
            "/api/chat/conversations",
            data={
                "title": "My Chat",
                "selected_models": ["claude-sonnet-4-5", "claude-haiku-4-5"],
            },
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "My Chat"
        assert data["selected_models"] == ["claude-sonnet-4-5", "claude-haiku-4-5"]
        assert Conversation.objects.filter(id=data["id"], user=user).exists()

    def test_create_conversation_no_models(self, authenticated_client):
        """Test creating conversation with no models"""
        client, _ = authenticated_client
        response = client.post(
            "/api/chat/conversations",
            data={"title": "My Chat", "selected_models": []},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_get_conversation_unauthenticated(self, api_client):
        """Test getting conversation without authentication"""
        response = api_client.get("/api/chat/conversations/1")
        assert response.status_code == 401

    def test_get_conversation_success(self, authenticated_client):
        """Test successfully getting a conversation"""
        client, user = authenticated_client
        conversation = Conversation.objects.create(
            title="My Chat",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )
        Message.objects.create(conversation=conversation, role="user", content="Hello")
        Message.objects.create(
            conversation=conversation,
            role="assistant",
            content="Hi",
            model="claude-sonnet-4-5",
        )

        response = client.get(f"/api/chat/conversations/{conversation.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conversation.id
        assert data["title"] == "My Chat"
        assert len(data["messages"]) == 2

    def test_get_conversation_not_owner(self, authenticated_client, api_client):
        """Test getting conversation that belongs to another user"""
        client, user = authenticated_client
        other_user = User.objects.create_user(
            username="other", email="other@example.com", password="pass123"
        )
        conversation = Conversation.objects.create(
            title="Other Chat",
            selected_models=["claude-sonnet-4-5"],
            user=other_user,
        )

        response = client.get(f"/api/chat/conversations/{conversation.id}")
        assert response.status_code == 404

    def test_update_conversation_unauthenticated(self, api_client):
        """Test updating conversation without authentication"""
        response = api_client.patch(
            "/api/chat/conversations/1",
            data={"title": "Updated"},
            content_type="application/json",
        )
        assert response.status_code == 401

    def test_update_conversation_success(self, authenticated_client):
        """Test successfully updating a conversation"""
        client, user = authenticated_client
        conversation = Conversation.objects.create(
            title="Original",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )

        response = client.patch(
            f"/api/chat/conversations/{conversation.id}",
            data={"title": "Updated Title"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        conversation.refresh_from_db()
        assert conversation.title == "Updated Title"

    def test_delete_conversation_unauthenticated(self, api_client):
        """Test deleting conversation without authentication"""
        response = api_client.delete("/api/chat/conversations/1")
        assert response.status_code == 401

    def test_delete_conversation_success(self, authenticated_client):
        """Test successfully deleting a conversation"""
        client, user = authenticated_client
        conversation = Conversation.objects.create(
            title="To Delete",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )
        conv_id = conversation.id

        response = client.delete(f"/api/chat/conversations/{conv_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert not Conversation.objects.filter(id=conv_id).exists()

    def test_delete_conversation_not_owner(self, authenticated_client):
        """Test deleting conversation that belongs to another user"""
        client, user = authenticated_client
        other_user = User.objects.create_user(
            username="other", email="other@example.com", password="pass123"
        )
        conversation = Conversation.objects.create(
            title="Other Chat",
            selected_models=["claude-sonnet-4-5"],
            user=other_user,
        )

        response = client.delete(f"/api/chat/conversations/{conversation.id}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_send_message_unauthenticated(self):
        """Test sending message without authentication"""
        from django.test import AsyncClient

        client = AsyncClient()
        response = await client.post(
            "/api/chat/conversations/1/messages",
            data={"content": "Hello"},
            content_type="application/json",
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    @pytest.mark.django_db
    async def test_send_message_success(self):
        """Test successfully sending a message"""
        from django.test import AsyncClient
        from django.test import override_settings
        from unittest.mock import AsyncMock, patch
        from asgiref.sync import sync_to_async
        import uuid

        # Create user and conversation in sync context
        test_id = str(uuid.uuid4())[:8]
        user = await sync_to_async(User.objects.create_user)(
            username=f"testuser_{test_id}",
            email=f"test_{test_id}@example.com",
            password="testpass123",
        )
        conversation = await sync_to_async(Conversation.objects.create)(
            title="Test Chat",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )

        # Mock the chatbot responses
        mock_responses = [("claude-sonnet-4-5", "Hello! How can I help you?")]

        with (
            override_settings(
                ANTHROPIC_API_KEY="test-key", OLLAMA_BASE_URL="http://localhost:11434"
            ),
            patch(
                "chat.api.get_multi_model_responses", new_callable=AsyncMock
            ) as mock_get_responses,
        ):
            mock_get_responses.return_value = mock_responses

            client = AsyncClient()
            await sync_to_async(client.force_login)(user)

            # Send message
            response = await client.post(
                f"/api/chat/conversations/{conversation.id}/messages",
                data={"content": "Hello"},
                content_type="application/json",
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "assistant_messages" in data
            assert len(data["assistant_messages"]) == 1
            assert (
                data["assistant_messages"][0]["content"] == "Hello! How can I help you?"
            )

    @pytest.mark.asyncio
    @pytest.mark.django_db
    async def test_send_message_with_context_window(self):
        """Test sending message with conversation history"""
        from django.test import AsyncClient
        from django.test import override_settings
        from unittest.mock import AsyncMock, patch
        from asgiref.sync import sync_to_async
        import uuid

        # Create user and conversation in sync context
        test_id = str(uuid.uuid4())[:8]
        user = await sync_to_async(User.objects.create_user)(
            username=f"testuser_{test_id}",
            email=f"test_{test_id}@example.com",
            password="testpass123",
        )
        conversation = await sync_to_async(Conversation.objects.create)(
            title="Test Chat",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )

        # Create some previous messages
        await sync_to_async(Message.objects.create)(
            conversation=conversation, role="user", content="First message"
        )
        await sync_to_async(Message.objects.create)(
            conversation=conversation,
            role="assistant",
            content="First response",
            model="claude-sonnet-4-5",
        )

        mock_responses = [("claude-sonnet-4-5", "Second response")]

        with (
            override_settings(
                ANTHROPIC_API_KEY="test-key",
                OLLAMA_BASE_URL="http://localhost:11434",
                CHAT_CONTEXT_WINDOW_SIZE=5,
            ),
            patch(
                "chat.api.get_multi_model_responses", new_callable=AsyncMock
            ) as mock_get_responses,
        ):
            mock_get_responses.return_value = mock_responses

            client = AsyncClient()
            await sync_to_async(client.force_login)(user)

            # Send message
            response = await client.post(
                f"/api/chat/conversations/{conversation.id}/messages",
                data={"content": "Second message"},
                content_type="application/json",
            )
            assert response.status_code == 200
            # Verify that get_multi_model_responses was called with previous messages
            assert mock_get_responses.called
            call_args = mock_get_responses.call_args[0]
            previous_messages = call_args[0]
            # Should include previous messages + current message
            assert len(previous_messages) >= 2
