from django.contrib import admin
from .models import Conversation, Message, UserProfile


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "created_at", "updated_at"]
    list_filter = ["created_at"]
    search_fields = ["title"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "conversation", "role", "content_preview", "created_at"]
    list_filter = ["role", "created_at"]
    search_fields = ["content"]

    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = "Content"  # type: ignore[attr-defined]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "has_avatar", "updated_at"]
    list_filter = ["updated_at"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["updated_at"]

    def has_avatar(self, obj):
        return bool(obj.avatar)

    has_avatar.boolean = True  # type: ignore[attr-defined]
    has_avatar.short_description = "Has Avatar"  # type: ignore[attr-defined]
