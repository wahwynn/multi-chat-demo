from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.http import HttpRequest, Http404
from asgiref.sync import sync_to_async
from .models import Conversation, Message
from .schemas import (
    ConversationSchema,
    ConversationListSchema,
    CreateConversationSchema,
    UpdateConversationSchema,
    SendMessageSchema,
    ChatResponseSchema,
)
from .chatbot import get_multi_model_responses

router = Router()


class AuthenticationRequired(Exception):
    """Raised when authentication is required but user is not authenticated"""

    pass


def get_authenticated_user(request: HttpRequest):
    """Get the current user or raise AuthenticationRequired if not authenticated"""
    if request.user.is_authenticated:
        return request.user
    raise AuthenticationRequired("Authentication required")


@router.get("/conversations", response={200: List[ConversationListSchema], 401: dict})
def list_conversations(request: HttpRequest):
    """List all conversations for the current user"""
    try:
        user = get_authenticated_user(request)
        conversations = Conversation.objects.filter(user=user)
        return 200, list(conversations)
    except AuthenticationRequired:
        return 401, {"error": "Authentication required"}


@router.post("/conversations", response={200: ConversationSchema, 400: dict, 401: dict})
def create_conversation(request: HttpRequest, payload: CreateConversationSchema):
    """Create a new conversation with multiple models"""
    try:
        user = get_authenticated_user(request)
    except AuthenticationRequired:
        return 401, {"error": "Authentication required"}

    # Validate at least 1 model
    if not payload.selected_models:
        return 400, {"error": "Must select at least 1 model"}

    conversation = Conversation.objects.create(
        title=payload.title,
        selected_models=payload.selected_models,
        user=user,
    )
    return 200, conversation


@router.get(
    "/conversations/{conversation_id}", response={200: ConversationSchema, 401: dict}
)
def get_conversation(request: HttpRequest, conversation_id: int):
    """Get a specific conversation with all messages"""
    try:
        user = get_authenticated_user(request)
    except AuthenticationRequired:
        return 401, {"error": "Authentication required"}
    # Fetch conversation first, then explicitly verify ownership
    # This prevents user=None from matching conversations with user IS NULL
    conversation = get_object_or_404(Conversation, id=conversation_id)
    if conversation.user != user:
        raise Http404("Conversation not found")
    return 200, conversation


@router.patch(
    "/conversations/{conversation_id}", response={200: ConversationSchema, 401: dict}
)
def update_conversation(
    request: HttpRequest, conversation_id: int, payload: UpdateConversationSchema
):
    """Update conversation title"""
    try:
        user = get_authenticated_user(request)
    except AuthenticationRequired:
        return 401, {"error": "Authentication required"}
    # Fetch conversation first, then explicitly verify ownership
    # This prevents user=None from matching conversations with user IS NULL
    conversation = get_object_or_404(Conversation, id=conversation_id)
    if conversation.user != user:
        raise Http404("Conversation not found")
    conversation.title = payload.title
    conversation.save()
    return 200, conversation


@router.delete("/conversations/{conversation_id}", response={200: dict, 401: dict})
def delete_conversation(request: HttpRequest, conversation_id: int):
    """Delete a conversation"""
    try:
        user = get_authenticated_user(request)
    except AuthenticationRequired:
        return 401, {"error": "Authentication required"}
    # Fetch conversation first, then explicitly verify ownership
    # This prevents user=None from matching conversations with user IS NULL
    conversation = get_object_or_404(Conversation, id=conversation_id)
    if conversation.user != user:
        raise Http404("Conversation not found")
    conversation.delete()
    return 200, {"success": True}


@router.post(
    "/conversations/{conversation_id}/messages",
    response={200: ChatResponseSchema, 401: dict},
)
async def send_message(
    request: HttpRequest, conversation_id: int, payload: SendMessageSchema
):
    """Send a message and get responses from all selected models"""
    # Get conversation (sync operation) - verify user owns it
    try:
        user = await sync_to_async(get_authenticated_user)(request)
    except AuthenticationRequired:
        return 401, {"error": "Authentication required"}

    # Fetch conversation first with user preloaded, then explicitly verify ownership
    # This prevents user=None from matching conversations with user IS NULL
    def get_conversation_with_user():
        return Conversation.objects.select_related("user").get(id=conversation_id)

    try:
        conversation = await sync_to_async(get_conversation_with_user)()
    except Conversation.DoesNotExist:
        raise Http404("Conversation not found")
    # Explicitly verify ownership - this comparison is safe in async context
    # because user is already loaded via select_related
    if conversation.user != user:
        raise Http404("Conversation not found")

    # Create user message
    user_message = await sync_to_async(Message.objects.create)(
        conversation=conversation, role="user", content=payload.content
    )

    # Get recent messages within context window (default: last 10 messages)
    # This provides conversation context while limiting the history
    CONTEXT_WINDOW_SIZE = getattr(settings, "CHAT_CONTEXT_WINDOW_SIZE", 10)

    def get_recent_messages():
        # Get recent messages before the current one, ordered chronologically
        # Use created_at to exclude the message we just created
        user_msg_created_at = user_message.created_at
        all_messages = list(
            Message.objects.filter(
                conversation=conversation, created_at__lt=user_msg_created_at
            ).order_by("created_at")
        )

        # Get the last CONTEXT_WINDOW_SIZE messages
        # Ensure window_size is positive to avoid negative indexing errors
        window_size = max(1, CONTEXT_WINDOW_SIZE)
        recent_messages = all_messages[-window_size:] if all_messages else []

        # Always include the current user message so the chatbot knows what to respond to
        recent_messages.append(user_message)

        # Convert to list of (role, content) tuples
        return [(msg.role, msg.content) for msg in recent_messages]

    previous_messages: List[tuple[str, str]] = await sync_to_async(
        get_recent_messages
    )()

    # Get responses from all selected models in parallel
    model_responses = await get_multi_model_responses(
        previous_messages,
        conversation.selected_models,
        settings.ANTHROPIC_API_KEY,
        settings.OLLAMA_BASE_URL,
    )

    # Create assistant messages for each model response
    assistant_messages = []
    for model_id, response_text in model_responses:
        assistant_msg = await sync_to_async(Message.objects.create)(
            conversation=conversation,
            role="assistant",
            content=response_text,
            model=model_id,
            parent_message=user_message,
        )
        assistant_messages.append(assistant_msg)

    # Update conversation timestamp
    await sync_to_async(conversation.save)()

    return 200, {"message": user_message, "assistant_messages": assistant_messages}
