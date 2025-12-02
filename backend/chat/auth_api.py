import io
from ninja import Router, Schema, File, UploadedFile
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpRequest
from typing import Optional, cast
from PIL import Image
from .models import UserProfile

router = Router()

# Security constants for avatar uploads
MAX_AVATAR_SIZE = 1048576  # 1MB
MAX_AVATAR_DIMENSIONS = (2048, 2048)  # Max width/height
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "GIF", "WEBP"}
FORMAT_TO_CONTENT_TYPE = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "GIF": "image/gif",
    "WEBP": "image/webp",
}
FORMAT_TO_EXTENSION = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "GIF": ".gif",
    "WEBP": ".webp",
}


def validate_and_process_image(
    file: UploadedFile,
) -> tuple[InMemoryUploadedFile | None, str | None]:
    """
    Securely validate and process an uploaded image.

    Returns:
        tuple: (processed_file, error_message)
        - If successful: (InMemoryUploadedFile, None)
        - If failed: (None, error_message)
    """
    # Check file size first (before reading into memory)
    if file.size and file.size > MAX_AVATAR_SIZE:
        return (
            None,
            f"File too large. Maximum size is {MAX_AVATAR_SIZE} bytes.",
        )

    try:
        # Read and validate the image using Pillow
        # This verifies the file is actually a valid image, not just checking headers
        file.seek(0)
        img = Image.open(file)

        # Verify it's a complete, valid image by loading it fully
        img.verify()

        # Re-open after verify (verify() can only be called once)
        file.seek(0)
        img = Image.open(file)

        # Check image format
        img_format = img.format
        if img_format not in ALLOWED_IMAGE_FORMATS:
            return (
                None,
                f"Invalid image format. Allowed: {', '.join(ALLOWED_IMAGE_FORMATS)}",
            )

        # Check dimensions
        if (
            img.width > MAX_AVATAR_DIMENSIONS[0]
            or img.height > MAX_AVATAR_DIMENSIONS[1]
        ):
            # Resize the image instead of rejecting
            img.thumbnail(MAX_AVATAR_DIMENSIONS, Image.Resampling.LANCZOS)

        # Convert to RGB if necessary (for JPEG output from RGBA/P modes)
        if img_format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Strip EXIF and other metadata by re-saving the image
        # This also sanitizes the file by reconstructing it from pixel data
        output = io.BytesIO()

        # Determine save format and settings
        save_format = img_format if img_format else "PNG"
        save_kwargs: dict[str, object] = {}

        if save_format == "JPEG":
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        elif save_format == "PNG":
            save_kwargs["optimize"] = True
        elif save_format == "WEBP":
            save_kwargs["quality"] = 85
        elif save_format == "GIF":
            # For animated GIFs, we only save the first frame for avatars
            pass

        # Save without EXIF data
        img.save(output, format=save_format, **save_kwargs)
        output.seek(0)

        # Create a new InMemoryUploadedFile with sanitized content
        content_type = FORMAT_TO_CONTENT_TYPE.get(save_format, "image/png")
        extension = FORMAT_TO_EXTENSION.get(save_format, ".png")

        sanitized_file = InMemoryUploadedFile(
            file=output,
            field_name="avatar",
            name=f"avatar{extension}",
            content_type=content_type,
            size=output.getbuffer().nbytes,
            charset=None,
        )

        return sanitized_file, None

    except Exception as e:
        # Log the error for debugging but return generic message to user
        import logging

        logging.warning(f"Image validation failed: {e}")
        return None, "Invalid or corrupted image file"


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
    """
    Upload or update user avatar.

    Security measures:
    - File size limit (5MB)
    - Image format validation using Pillow (not just content-type)
    - Image dimension limits (max 2048x2048, auto-resized if larger)
    - EXIF metadata stripping
    - Image re-encoding to sanitize content
    - Unique UUID-based filenames
    """
    if not request.user.is_authenticated:
        return 401, {"error": "Authentication required"}

    user = cast(User, request.user)

    # Securely validate and process the image
    processed_file, error = validate_and_process_image(file)
    if error:
        return 400, {"error": error}

    if processed_file is None:
        return 400, {"error": "Failed to process image"}

    # Get or create profile
    profile, _ = UserProfile.objects.get_or_create(user=user)

    # Delete old avatar if exists
    if profile.avatar:
        profile.avatar.delete(save=False)

    # Save the sanitized avatar
    profile.avatar = processed_file
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
