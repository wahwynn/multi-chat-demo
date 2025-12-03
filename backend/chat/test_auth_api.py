import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
from .models import UserProfile


@pytest.mark.django_db
class TestAuthAPI:
    """Tests for authentication API endpoints"""

    @pytest.fixture
    def api_client(self):
        """Create a test client"""
        from django.test import Client

        return Client()

    @pytest.fixture
    def authenticated_client(self, api_client):
        """Create an authenticated test client"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        api_client.force_login(user)
        return api_client, user

    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user when not authenticated"""
        response = api_client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is False
        assert data["user"] is None

    def test_get_current_user_authenticated(self, authenticated_client):
        """Test getting current user when authenticated"""
        client, user = authenticated_client
        response = client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["user"]["id"] == user.id
        assert data["user"]["username"] == user.username
        assert data["user"]["email"] == user.email

    def test_login_success(self, api_client):
        """Test successful login"""
        User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        response = api_client.post(
            "/api/auth/login",
            data={"username": "testuser", "password": "testpass123"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"

    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        response = api_client.post(
            "/api/auth/login",
            data={"username": "testuser", "password": "wrongpassword"},
            content_type="application/json",
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_logout(self, authenticated_client):
        """Test logout"""
        client, _ = authenticated_client
        response = client.post("/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_register_success(self, api_client):
        """Test successful user registration"""
        response = api_client.post(
            "/api/auth/register",
            data={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "password123",
            },
            content_type="application/json",
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert User.objects.filter(username="newuser").exists()

    def test_register_duplicate_username(self, api_client):
        """Test registration with duplicate username"""
        User.objects.create_user(
            username="existing", email="existing@example.com", password="pass123"
        )
        response = api_client.post(
            "/api/auth/register",
            data={
                "username": "existing",
                "email": "new@example.com",
                "password": "password123",
            },
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "username" in data["error"].lower()

    def test_register_duplicate_email(self, api_client):
        """Test registration with duplicate email"""
        User.objects.create_user(
            username="user1", email="test@example.com", password="pass123"
        )
        response = api_client.post(
            "/api/auth/register",
            data={
                "username": "user2",
                "email": "test@example.com",
                "password": "password123",
            },
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "email" in data["error"].lower()

    def test_register_short_password(self, api_client):
        """Test registration with password too short"""
        response = api_client.post(
            "/api/auth/register",
            data={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "12345",  # Less than 6 characters
            },
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "password" in data["error"].lower()

    def test_upload_avatar_unauthenticated(self, api_client):
        """Test uploading avatar without authentication"""
        # Create a simple test image
        img = Image.new("RGB", (100, 100), color="red")
        img_io = io.BytesIO()
        img.save(img_io, format="PNG")
        img_io.seek(0)

        response = api_client.post(
            "/api/auth/avatar",
            {"avatar": SimpleUploadedFile("test.png", img_io.read(), "image/png")},
        )
        assert response.status_code == 401

    def test_upload_avatar_success(self, authenticated_client):
        """Test successful avatar upload"""
        client, user = authenticated_client
        # Create a simple test image
        img = Image.new("RGB", (100, 100), color="red")
        img_io = io.BytesIO()
        img.save(img_io, format="PNG")
        img_io.seek(0)

        response = client.post(
            "/api/auth/avatar",
            {"avatar": SimpleUploadedFile("test.png", img_io.read(), "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["avatar_url"] is not None
        assert UserProfile.objects.get(user=user).avatar is not None

    def test_upload_avatar_invalid_format(self, authenticated_client):
        """Test uploading avatar with invalid format"""
        client, _ = authenticated_client
        # Create a text file instead of image
        response = client.post(
            "/api/auth/avatar",
            {"avatar": SimpleUploadedFile("test.txt", b"not an image", "text/plain")},
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_upload_avatar_too_large(self, authenticated_client):
        """Test uploading avatar that's too large"""
        client, _ = authenticated_client
        # Create a large image (simulate by creating a file larger than 1MB)
        large_data = b"x" * (2 * 1024 * 1024)  # 2MB
        response = client.post(
            "/api/auth/avatar",
            {"avatar": SimpleUploadedFile("large.png", large_data, "image/png")},
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_delete_avatar_unauthenticated(self, api_client):
        """Test deleting avatar without authentication"""
        response = api_client.delete("/api/auth/avatar")
        assert response.status_code == 401

    def test_delete_avatar_success(self, authenticated_client):
        """Test successful avatar deletion"""
        client, user = authenticated_client
        # First upload an avatar
        img = Image.new("RGB", (100, 100), color="red")
        img_io = io.BytesIO()
        img.save(img_io, format="PNG")
        img_io.seek(0)
        client.post(
            "/api/auth/avatar",
            {"avatar": SimpleUploadedFile("test.png", img_io.read(), "image/png")},
        )

        # Then delete it
        response = client.delete("/api/auth/avatar")
        assert response.status_code == 200
        data = response.json()
        assert data["avatar_url"] is None
        profile = UserProfile.objects.get(user=user)
        assert not profile.avatar or profile.avatar.name == ""

    def test_update_profile_unauthenticated(self, api_client):
        """Test updating profile without authentication"""
        response = api_client.patch(
            "/api/auth/profile",
            data={"username": "newname"},
            content_type="application/json",
        )
        assert response.status_code == 401

    def test_update_profile_success(self, authenticated_client):
        """Test successful profile update"""
        client, user = authenticated_client
        response = client.patch(
            "/api/auth/profile",
            data={"username": "newname", "email": "newemail@example.com"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newname"
        assert data["email"] == "newemail@example.com"
        user.refresh_from_db()
        assert user.username == "newname"
        assert user.email == "newemail@example.com"

    def test_update_profile_duplicate_username(self, api_client):
        """Test updating profile with duplicate username"""
        User.objects.create_user(
            username="existing", email="existing@example.com", password="pass123"
        )
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        client = api_client
        client.force_login(user)
        response = client.patch(
            "/api/auth/profile",
            data={"username": "existing"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_change_password_unauthenticated(self, api_client):
        """Test changing password without authentication"""
        response = api_client.post(
            "/api/auth/change-password",
            data={"old_password": "old", "new_password": "new"},
            content_type="application/json",
        )
        assert response.status_code == 401

    def test_change_password_success(self, authenticated_client):
        """Test successful password change"""
        client, user = authenticated_client
        response = client.post(
            "/api/auth/change-password",
            data={"old_password": "testpass123", "new_password": "newpass123"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        user.refresh_from_db()
        assert user.check_password("newpass123")

    def test_change_password_wrong_old_password(self, authenticated_client):
        """Test changing password with wrong old password"""
        client, _ = authenticated_client
        response = client.post(
            "/api/auth/change-password",
            data={"old_password": "wrong", "new_password": "newpass123"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_change_password_too_short(self, authenticated_client):
        """Test changing password to one that's too short"""
        client, _ = authenticated_client
        response = client.post(
            "/api/auth/change-password",
            data={"old_password": "testpass123", "new_password": "12345"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_change_password_same_as_old(self, authenticated_client):
        """Test changing password to the same as old password"""
        client, _ = authenticated_client
        response = client.post(
            "/api/auth/change-password",
            data={"old_password": "testpass123", "new_password": "testpass123"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
