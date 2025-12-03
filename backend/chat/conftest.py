"""
Pytest configuration for chat app tests.
This file provides fixtures and configuration for all tests in the chat app.
"""

import tempfile
import shutil
from pathlib import Path
import pytest


@pytest.fixture(scope="session")
def _temp_media_dir():
    """
    Create a temporary media root directory for the test session.
    This directory is shared across all tests and cleaned up at the end.
    """
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Cleanup: remove the temporary directory and all its contents
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(autouse=True)
def temp_media_root(settings, _temp_media_dir):
    """
    Override MEDIA_ROOT setting to use a temporary directory for all tests.
    This ensures tests don't create real files in the actual media directory.

    Uses pytest-django's settings fixture to override MEDIA_ROOT.
    """
    settings.MEDIA_ROOT = _temp_media_dir
    return _temp_media_dir


@pytest.fixture(autouse=True)
def cleanup_media_files(temp_media_root):
    """
    Clean up media files after each test.
    This ensures tests don't leave files behind between test runs.
    """
    yield
    # After each test, clean up any files in the temp media directory
    media_path = Path(temp_media_root)
    if media_path.exists():
        for item in media_path.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item, ignore_errors=True)
