from ninja import Router, Schema
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import HttpRequest
from typing import Optional, cast

router = Router()


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
    }
