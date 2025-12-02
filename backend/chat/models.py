import uuid
import os
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver


def avatar_upload_path(instance: "UserProfile", filename: str) -> str:
    """Generate a unique filename for avatar uploads"""
    ext = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    return f"avatars/{unique_filename}"


class UserProfile(models.Model):
    """Extended user profile with avatar support"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"


# Automatically create UserProfile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Ensure profile exists for existing users
    UserProfile.objects.get_or_create(user=instance)


class Conversation(models.Model):
    """A conversation thread containing multiple messages"""

    MODEL_CHOICES = [
        ("claude-sonnet-4-5", "Claude 4.5 Sonnet"),
        ("claude-haiku-4-5", "Claude 4.5 Haiku"),
        ("claude-opus-4-5", "Claude 4.5 Opus"),
        ("ollama-llama3.2", "Ollama Llama 3.2"),
        ("ollama-llama3.1", "Ollama Llama 3.1"),
        ("ollama-mistral", "Ollama Mistral"),
        ("ollama-phi3", "Ollama Phi-3"),
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
        if len(self.selected_models) < 1:
            raise ValidationError("Must select at least 1 model")
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
