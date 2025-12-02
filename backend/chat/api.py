from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.conf import settings
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


@router.get("/conversations", response=List[ConversationListSchema])
def list_conversations(request):
    """List all conversations"""
    conversations = Conversation.objects.all()
    return conversations


@router.post("/conversations", response=ConversationSchema)
def create_conversation(request, payload: CreateConversationSchema):
    """Create a new conversation with multiple models"""
    # Validate at least 1 model
    if not payload.selected_models:
        return {"error": "Must select at least 1 model"}

    conversation = Conversation.objects.create(
        title=payload.title, selected_models=payload.selected_models
    )
    return conversation


@router.get("/conversations/{conversation_id}", response=ConversationSchema)
def get_conversation(request, conversation_id: int):
    """Get a specific conversation with all messages"""
    conversation = get_object_or_404(Conversation, id=conversation_id)
    return conversation


@router.patch("/conversations/{conversation_id}", response=ConversationSchema)
def update_conversation(
    request, conversation_id: int, payload: UpdateConversationSchema
):
    """Update conversation title"""
    conversation = get_object_or_404(Conversation, id=conversation_id)
    conversation.title = payload.title
    conversation.save()
    return conversation


@router.delete("/conversations/{conversation_id}")
def delete_conversation(request, conversation_id: int):
    """Delete a conversation"""
    conversation = get_object_or_404(Conversation, id=conversation_id)
    conversation.delete()
    return {"success": True}


@router.post("/conversations/{conversation_id}/messages", response=ChatResponseSchema)
async def send_message(request, conversation_id: int, payload: SendMessageSchema):
    """Send a message and get responses from all selected models"""
    # Get conversation (sync operation)
    conversation = await sync_to_async(get_object_or_404)(
        Conversation, id=conversation_id
    )

    # Create user message
    user_message = await sync_to_async(Message.objects.create)(
        conversation=conversation, role="user", content=payload.content
    )

    # Get all previous messages for context (only parent messages, not model variants)
    previous_messages_query = conversation.messages.filter(
        parent_message__isnull=True
    ).values_list("role", "content")
    previous_messages = await sync_to_async(list)(previous_messages_query)

    # Get responses from all selected models in parallel
    model_responses = await get_multi_model_responses(
        previous_messages, conversation.selected_models, settings.ANTHROPIC_API_KEY
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
