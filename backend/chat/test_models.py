import pytest
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from chat.models import UserProfile, Conversation, Message


@pytest.mark.django_db
class TestUserProfile:
    """Tests for UserProfile model"""

    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup unique identifiers for each test"""
        import uuid

        self.test_id = str(uuid.uuid4())[:8]
        yield
        # Cleanup: delete any users created in this test
        User.objects.filter(username__startswith=f"testuser_{self.test_id}").delete()

    def test_user_profile_created_automatically(self, setup):
        """Test that UserProfile is created automatically when User is created"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        assert UserProfile.objects.filter(user=user).exists()
        assert user.profile is not None

    def test_user_profile_one_to_one_relationship(self, setup):
        """Test that UserProfile has one-to-one relationship with User"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        profile = user.profile
        assert profile is not None
        assert profile.user == user

        # Try to create another profile for the same user (should fail)
        from django.db import transaction

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                UserProfile.objects.create(user=user)

    def test_user_profile_str_representation(self, setup):
        """Test UserProfile string representation"""
        username = f"testuser_{self.test_id}"
        user = User.objects.create_user(
            username=username,
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        profile = user.profile
        assert str(profile) == f"{username}'s profile"

    def test_user_profile_avatar_field(self, setup):
        """Test that avatar field is optional"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        profile = user.profile
        # Django ImageField returns an ImageFieldFile object, check if it has no name
        assert not profile.avatar.name


@pytest.mark.django_db
class TestConversation:
    """Tests for Conversation model"""

    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup unique identifiers for each test"""
        import uuid

        self.test_id = str(uuid.uuid4())[:8]
        yield
        # Cleanup: delete any users created in this test
        User.objects.filter(username__startswith=f"testuser_{self.test_id}").delete()

    def test_create_conversation_with_valid_models(self, setup):
        """Test creating a conversation with valid models"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test Chat",
            selected_models=["claude-sonnet-4-5", "claude-haiku-4-5"],
            user=user,
        )
        assert conversation.title == "Test Chat"
        assert conversation.selected_models == ["claude-sonnet-4-5", "claude-haiku-4-5"]
        assert conversation.user == user

    def test_conversation_default_title(self, setup):
        """Test that conversation has default title"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            selected_models=["claude-sonnet-4-5"], user=user
        )
        assert conversation.title == "New Chat"

    def test_conversation_validation_empty_models(self, setup):
        """Test that conversation must have at least one model"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation(title="Test", selected_models=[], user=user)
        with pytest.raises(ValidationError) as exc_info:
            conversation.full_clean()
        assert "Must select at least 1 model" in str(exc_info.value)

    def test_conversation_validation_invalid_model(self, setup):
        """Test that conversation rejects invalid model IDs"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation(
            title="Test",
            selected_models=["invalid-model"],
            user=user,
        )
        with pytest.raises(ValidationError) as exc_info:
            conversation.full_clean()
        assert "Invalid model" in str(exc_info.value)

    def test_conversation_validation_non_list_models(self, setup):
        """Test that selected_models must be a list"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation(
            title="Test", selected_models="not-a-list", user=user
        )
        with pytest.raises(ValidationError) as exc_info:
            conversation.full_clean()
        assert "Models must be a list" in str(exc_info.value)

    def test_conversation_all_valid_models(self, setup):
        """Test that all valid model choices work"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        valid_models = [
            "claude-sonnet-4-5",
            "claude-haiku-4-5",
            "claude-opus-4-5",
            "ollama-llama3.2",
            "ollama-llama3.1",
            "ollama-mistral",
            "ollama-phi3",
        ]
        for model in valid_models:
            conversation = Conversation.objects.create(
                title=f"Test {model}",
                selected_models=[model],
                user=user,
            )
            assert conversation.selected_models == [model]

    def test_conversation_ordering(self, setup):
        """Test that conversations are ordered by updated_at descending"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conv1 = Conversation.objects.create(
            title="First", selected_models=["claude-sonnet-4-5"], user=user
        )
        conv2 = Conversation.objects.create(
            title="Second", selected_models=["claude-sonnet-4-5"], user=user
        )
        conv3 = Conversation.objects.create(
            title="Third", selected_models=["claude-sonnet-4-5"], user=user
        )

        conversations = list(Conversation.objects.filter(user=user))
        assert conversations[0] == conv3
        assert conversations[1] == conv2
        assert conversations[2] == conv1

    def test_conversation_str_representation(self, setup):
        """Test Conversation string representation"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test Chat",
            selected_models=["claude-sonnet-4-5"],
            user=user,
        )
        str_repr = str(conversation)
        assert "Test Chat" in str_repr
        assert conversation.created_at.strftime("%Y-%m-%d") in str_repr

    def test_conversation_can_be_anonymous(self):
        """Test that conversation can be created without a user"""
        conversation = Conversation.objects.create(
            title="Anonymous Chat", selected_models=["claude-sonnet-4-5"], user=None
        )
        assert conversation.user is None


@pytest.mark.django_db
class TestMessage:
    """Tests for Message model"""

    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup unique identifiers for each test"""
        import uuid

        self.test_id = str(uuid.uuid4())[:8]
        yield
        # Cleanup: delete any users created in this test
        User.objects.filter(username__startswith=f"testuser_{self.test_id}").delete()

    def test_create_user_message(self, setup):
        """Test creating a user message"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        message = Message.objects.create(
            conversation=conversation, role="user", content="Hello, AI!"
        )
        assert message.role == "user"
        assert message.content == "Hello, AI!"
        assert message.conversation == conversation
        assert message.model is None

    def test_create_assistant_message(self, setup):
        """Test creating an assistant message"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        user_message = Message.objects.create(
            conversation=conversation, role="user", content="Hello!"
        )
        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content="Hi there!",
            model="claude-sonnet-4-5",
            parent_message=user_message,
        )
        assert assistant_message.role == "assistant"
        assert assistant_message.content == "Hi there!"
        assert assistant_message.model == "claude-sonnet-4-5"
        assert assistant_message.parent_message == user_message

    def test_message_ordering(self, setup):
        """Test that messages are ordered by created_at ascending"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        msg1 = Message.objects.create(
            conversation=conversation, role="user", content="First"
        )
        msg2 = Message.objects.create(
            conversation=conversation, role="user", content="Second"
        )
        msg3 = Message.objects.create(
            conversation=conversation, role="user", content="Third"
        )

        messages = list(Message.objects.filter(conversation=conversation))
        assert messages[0] == msg1
        assert messages[1] == msg2
        assert messages[2] == msg3

    def test_message_str_representation(self, setup):
        """Test Message string representation"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        message = Message.objects.create(
            conversation=conversation,
            role="user",
            content="This is a very long message that should be truncated",
        )
        str_repr = str(message)
        assert "user:" in str_repr.lower()
        assert len(str_repr) < len(message.content) + 10  # Should be truncated

    def test_message_cascade_delete(self, setup):
        """Test that messages are deleted when conversation is deleted"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        message = Message.objects.create(
            conversation=conversation, role="user", content="Test message"
        )
        message_id = message.id
        conversation.delete()
        assert not Message.objects.filter(id=message_id).exists()

    def test_message_parent_cascade_delete(self, setup):
        """Test that parent message deletion cascades to child messages"""
        user = User.objects.create_user(
            username=f"testuser_{self.test_id}",
            email=f"test_{self.test_id}@example.com",
            password="testpass123",
        )
        conversation = Conversation.objects.create(
            title="Test", selected_models=["claude-sonnet-4-5"], user=user
        )
        user_message = Message.objects.create(
            conversation=conversation, role="user", content="Hello"
        )
        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content="Hi",
            parent_message=user_message,
        )
        assistant_id = assistant_message.id
        user_message.delete()
        # Child message should also be deleted due to CASCADE
        assert not Message.objects.filter(id=assistant_id).exists()
