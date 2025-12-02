from ninja import Router, Schema, File, UploadedFile
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import HttpRequest
from typing import Optional, cast
from .models import UserProfile

router = Router()


def get_avatar_url(request: HttpRequest, user: User) -> Optional[str]:
    """Get the full URL for a user's avatar"""
    try:
        profile = user.profile  # type: ignore[attr-defined]
        if profile.avatar:
            return request.build_absolute_uri(profile.avatar.url)
    except UserProfile.DoesNotExist:
        pass
    return None


class LoginSchema(Schema):
    username: str
    password: str


class RegisterSchema(Schema):
    username: str
    email: str
    password: str


class UserSchema(Schema):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None


class MessageResponseSchema(Schema):
    message: str


class ErrorResponseSchema(Schema):
    error: str


class AuthStatusSchema(Schema):
    authenticated: bool
    user: Optional[UserSchema] = None


@router.get("/me", response={200: AuthStatusSchema})
def get_current_user(request: HttpRequest):
    """Get current authenticated user info"""
    if request.user.is_authenticated:
        user = cast(User, request.user)
        return {
            "authenticated": True,
            "user": {
                "id": user.pk,
                "username": user.username,
                "email": user.email,
                "avatar_url": get_avatar_url(request, user),
            },
        }
    return {
        "authenticated": False,
        "user": None,
    }


@router.post("/login", response={200: UserSchema, 401: ErrorResponseSchema})
def login_user(request: HttpRequest, payload: LoginSchema):
    """Login with username and password"""
    user = authenticate(request, username=payload.username, password=payload.password)
    if user is not None:
        user = cast(User, user)
        login(request, user)
        return 200, {
            "id": user.pk,
            "username": user.username,
            "email": user.email,
            "avatar_url": get_avatar_url(request, user),
        }
    return 401, {"error": "Invalid username or password"}


@router.post("/logout", response=MessageResponseSchema)
def logout_user(request: HttpRequest):
    """Logout current user"""
    logout(request)
    return {"message": "Logged out successfully"}


@router.post("/register", response={201: UserSchema, 400: ErrorResponseSchema})
def register_user(request: HttpRequest, payload: RegisterSchema):
    """Register a new user"""
    # Check if username already exists
    if User.objects.filter(username=payload.username).exists():
        return 400, {"error": "Username already exists"}

    # Check if email already exists
    if User.objects.filter(email=payload.email).exists():
        return 400, {"error": "Email already exists"}

    # Validate password length
    if len(payload.password) < 6:
        return 400, {"error": "Password must be at least 6 characters"}

    # Create user
    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
    )

    # Log the user in
    login(request, user)

    return 201, {
        "id": user.pk,
        "username": user.username,
        "email": user.email,
        "avatar_url": None,  # New users don't have avatars yet
    }


@router.post(
    "/avatar",
    response={200: UserSchema, 400: ErrorResponseSchema, 401: ErrorResponseSchema},
)
def upload_avatar(request: HttpRequest, file: UploadedFile = File(...)):  # type: ignore[assignment]
    """Upload or update user avatar"""
    if not request.user.is_authenticated:
        return 401, {"error": "Authentication required"}

    user = cast(User, request.user)

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        return 400, {"error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"}

    # Validate file size (max 5MB)
    if file.size and file.size > 5 * 1024 * 1024:
        return 400, {"error": "File too large. Maximum size is 5MB"}

    # Get or create profile
    profile, _ = UserProfile.objects.get_or_create(user=user)

    # Delete old avatar if exists
    if profile.avatar:
        profile.avatar.delete(save=False)

    # Save new avatar
    profile.avatar = file
    profile.save()

    return 200, {
        "id": user.pk,
        "username": user.username,
        "email": user.email,
        "avatar_url": get_avatar_url(request, user),
    }


@router.delete("/avatar", response={200: UserSchema, 401: ErrorResponseSchema})
def delete_avatar(request: HttpRequest):
    """Delete user avatar"""
    if not request.user.is_authenticated:
        return 401, {"error": "Authentication required"}

    user = cast(User, request.user)

    try:
        profile = user.profile  # type: ignore[attr-defined]
        if profile.avatar:
            profile.avatar.delete(save=True)
    except UserProfile.DoesNotExist:
        pass

    return 200, {
        "id": user.pk,
        "username": user.username,
        "email": user.email,
        "avatar_url": None,
    }
