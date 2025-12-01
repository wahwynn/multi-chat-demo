from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .schemas import (
    ConversationSchema,
    ConversationListSchema,
    CreateConversationSchema,
    UpdateConversationSchema,
    SendMessageSchema,
    ChatResponseSchema,
)
from .chatbot import get_chatbot_response

router = Router()


@router.get("/conversations", response=List[ConversationListSchema])
def list_conversations(request):
    """List all conversations"""
    conversations = Conversation.objects.all()
    return conversations


@router.post("/conversations", response=ConversationSchema)
def create_conversation(request, payload: CreateConversationSchema):
    """Create a new conversation"""
    conversation = Conversation.objects.create(title=payload.title)
    return conversation


@router.get("/conversations/{conversation_id}", response=ConversationSchema)
def get_conversation(request, conversation_id: int):
    """Get a specific conversation with all messages"""
    conversation = get_object_or_404(Conversation, id=conversation_id)
    return conversation


@router.patch("/conversations/{conversation_id}", response=ConversationSchema)
def update_conversation(request, conversation_id: int, payload: UpdateConversationSchema):
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
def send_message(request, conversation_id: int, payload: SendMessageSchema):
    """Send a message and get a response from the chatbot"""
    conversation = get_object_or_404(Conversation, id=conversation_id)

    # Create user message
    user_message = Message.objects.create(
        conversation=conversation,
        role='user',
        content=payload.content
    )

    # Get all previous messages for context
    previous_messages = list(
        conversation.messages.values_list('role', 'content')
    )

    # Get chatbot response
    bot_response = get_chatbot_response(previous_messages)

    # Create assistant message
    assistant_message = Message.objects.create(
        conversation=conversation,
        role='assistant',
        content=bot_response
    )

    # Update conversation timestamp
    conversation.save()

    return {
        "message": user_message,
        "assistant_message": assistant_message
    }
