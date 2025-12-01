from ninja import Schema
from datetime import datetime
from typing import List, Optional


class MessageSchema(Schema):
    id: int
    role: str
    content: str
    created_at: datetime
    model: Optional[str] = None  # Which model generated this (for assistant messages)
    parent_message_id: Optional[int] = None  # For grouping responses


class ConversationSchema(Schema):
    id: int
    title: str
    selected_models: List[str]  # Changed from single model to array
    created_at: datetime
    updated_at: datetime
    messages: List[MessageSchema] = []


class ConversationListSchema(Schema):
    id: int
    title: str
    selected_models: List[str]  # Changed from single model to array
    created_at: datetime
    updated_at: datetime


class CreateConversationSchema(Schema):
    title: str = "New Chat"
    selected_models: List[str] = ["claude-sonnet-4-5"]  # Array with default


class UpdateConversationSchema(Schema):
    title: str


class SendMessageSchema(Schema):
    content: str


class ChatResponseSchema(Schema):
    message: MessageSchema  # User message
    assistant_messages: List[MessageSchema]  # Multiple responses (one per model)
