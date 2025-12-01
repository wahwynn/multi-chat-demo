from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Conversation(models.Model):
    """A conversation thread containing multiple messages"""

    MODEL_CHOICES = [
        ("claude-sonnet-4-5", "Claude 4.5 Sonnet"),
        ("claude-haiku-4-5", "Claude 4.5 Haiku"),
        ("claude-opus-4-5", "Claude 4.5 Opus"),
        ("claude-opus-4-1", "Claude 4.1 Opus"),
    ]

    VALID_MODELS = [choice[0] for choice in MODEL_CHOICES]

    title = models.CharField(max_length=255, default="New Chat")
    selected_models = models.JSONField(default=list)  # Array of model IDs
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def clean(self):
        """Validate selected_models field"""
        if not isinstance(self.selected_models, list):
            raise ValidationError("Models must be a list")
        if len(self.selected_models) < 1 or len(self.selected_models) > 3:
            raise ValidationError("Must select 1-3 models")
        for model in self.selected_models:
            if model not in self.VALID_MODELS:
                raise ValidationError(f"Invalid model: {model}")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"


class Message(models.Model):
    """Individual message in a conversation"""

    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    model = models.CharField(
        max_length=50, null=True, blank=True
    )  # Which model generated this (for assistant messages)
    parent_message = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="model_responses",
    )  # Links assistant responses to the triggering user message
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
