from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.http import HttpRequest
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


def get_user_or_none(request: HttpRequest):
    """Get the current user or None if not authenticated"""
    if request.user.is_authenticated:
        return request.user
    return None


@router.get("/conversations", response=List[ConversationListSchema])
def list_conversations(request: HttpRequest):
    """List all conversations for the current user"""
    user = get_user_or_none(request)
    if user:
        conversations = Conversation.objects.filter(user=user)
    else:
        # For unauthenticated users, return empty list
        conversations = Conversation.objects.none()
    return conversations


@router.post("/conversations", response=ConversationSchema)
def create_conversation(request: HttpRequest, payload: CreateConversationSchema):
    """Create a new conversation with multiple models"""
    # Validate at least 1 model
    if not payload.selected_models:
        return {"error": "Must select at least 1 model"}

    user = get_user_or_none(request)
    conversation = Conversation.objects.create(
        title=payload.title,
        selected_models=payload.selected_models,
        user=user,
    )
    return conversation


@router.get("/conversations/{conversation_id}", response=ConversationSchema)
def get_conversation(request: HttpRequest, conversation_id: int):
    """Get a specific conversation with all messages"""
    user = get_user_or_none(request)
    conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
    return conversation


@router.patch("/conversations/{conversation_id}", response=ConversationSchema)
def update_conversation(
    request: HttpRequest, conversation_id: int, payload: UpdateConversationSchema
):
    """Update conversation title"""
    user = get_user_or_none(request)
    conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
    conversation.title = payload.title
    conversation.save()
    return conversation


@router.delete("/conversations/{conversation_id}")
def delete_conversation(request: HttpRequest, conversation_id: int):
    """Delete a conversation"""
    user = get_user_or_none(request)
    conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
    conversation.delete()
    return {"success": True}


@router.post("/conversations/{conversation_id}/messages", response=ChatResponseSchema)
async def send_message(
    request: HttpRequest, conversation_id: int, payload: SendMessageSchema
):
    """Send a message and get responses from all selected models"""
    # Get conversation (sync operation) - verify user owns it
    user = await sync_to_async(get_user_or_none)(request)
    conversation = await sync_to_async(get_object_or_404)(
        Conversation, id=conversation_id, user=user
    )

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

    return {"message": user_message, "assistant_messages": assistant_messages}
