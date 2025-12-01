from ninja import Schema
from datetime import datetime
from typing import List


class MessageSchema(Schema):
    id: int
    role: str
    content: str
    created_at: datetime


class ConversationSchema(Schema):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageSchema] = []


class ConversationListSchema(Schema):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime


class CreateConversationSchema(Schema):
    title: str = "New Chat"


class SendMessageSchema(Schema):
    content: str


class ChatResponseSchema(Schema):
    message: MessageSchema
    assistant_message: MessageSchema
