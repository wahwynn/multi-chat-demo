import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from .chatbot import (
    is_ollama_model,
    get_single_model_response_async,
    get_multi_model_responses,
)


class TestChatbotHelpers:
    """Tests for chatbot helper functions"""

    def test_is_ollama_model_true(self):
        """Test that Ollama models are correctly identified"""
        assert is_ollama_model("ollama-llama3.2") is True
        assert is_ollama_model("ollama-mistral") is True
        assert is_ollama_model("ollama-phi3") is True

    def test_is_ollama_model_false(self):
        """Test that Claude models are not identified as Ollama"""
        assert is_ollama_model("claude-sonnet-4-5") is False
        assert is_ollama_model("claude-haiku-4-5") is False
        assert is_ollama_model("claude-opus-4-5") is False


@pytest.mark.asyncio
class TestChatbotAPI:
    """Tests for chatbot API integration functions"""

    @pytest.fixture
    def sample_messages(self):
        """Sample conversation messages"""
        return [
            ("user", "Hello, how are you?"),
            ("assistant", "I'm doing well, thank you!"),
        ]

    async def test_get_single_model_response_ollama_success(self, sample_messages):
        """Test successful Ollama model response"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "message": {"content": "Hello! I'm an Ollama model."}
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            mock_client.return_value = mock_client_instance

            result = await get_single_model_response_async(
                sample_messages,
                "ollama-llama3.2",
                "dummy-key",
                "http://localhost:11434",
            )

            assert result[0] == "ollama-llama3.2"
            assert "Ollama model" in result[1]

    async def test_get_single_model_response_ollama_empty_response(
        self, sample_messages
    ):
        """Test Ollama model response with empty content"""
        mock_response = MagicMock()
        mock_response.json.return_value = {"message": {}}
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            mock_client.return_value = mock_client_instance

            result = await get_single_model_response_async(
                sample_messages,
                "ollama-llama3.2",
                "dummy-key",
                "http://localhost:11434",
            )

            assert result[0] == "ollama-llama3.2"
            assert "didn't contain any text content" in result[1]

    async def test_get_single_model_response_claude_success(self, sample_messages):
        """Test successful Claude model response"""
        mock_text_block = MagicMock()
        mock_text_block.text = "Hello! I'm Claude."
        mock_response = MagicMock()
        mock_response.content = [mock_text_block]

        with patch("anthropic.AsyncAnthropic") as mock_anthropic:
            mock_client = AsyncMock()
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            mock_anthropic.return_value = mock_client

            result = await get_single_model_response_async(
                sample_messages, "claude-sonnet-4-5", "dummy-key"
            )

            assert result[0] == "claude-sonnet-4-5"
            assert "Claude" in result[1]

    async def test_get_single_model_response_claude_empty_response(
        self, sample_messages
    ):
        """Test Claude model response with no text blocks"""
        mock_response = MagicMock()
        mock_response.content = []  # No text blocks

        with patch("anthropic.AsyncAnthropic") as mock_anthropic:
            mock_client = AsyncMock()
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            mock_anthropic.return_value = mock_client

            result = await get_single_model_response_async(
                sample_messages, "claude-sonnet-4-5", "dummy-key"
            )

            assert result[0] == "claude-sonnet-4-5"
            assert "didn't contain any text content" in result[1]

    async def test_get_single_model_response_error_handling(self, sample_messages):
        """Test error handling in model response"""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value.post = AsyncMock(
                side_effect=Exception("Network error")
            )
            mock_client.return_value = mock_client_instance

            result = await get_single_model_response_async(
                sample_messages,
                "ollama-llama3.2",
                "dummy-key",
                "http://localhost:11434",
            )

            assert result[0] == "ollama-llama3.2"
            assert "Error" in result[1]

    async def test_get_multi_model_responses_success(self, sample_messages):
        """Test successful multi-model responses"""
        # Mock both Ollama and Claude responses
        mock_ollama_response = MagicMock()
        mock_ollama_response.json.return_value = {
            "message": {"content": "Ollama response"}
        }
        mock_ollama_response.raise_for_status = MagicMock()

        mock_claude_response = MagicMock()
        mock_text_block = MagicMock()
        mock_text_block.text = "Claude response"
        mock_claude_response.content = [mock_text_block]

        with (
            patch("httpx.AsyncClient") as mock_httpx,
            patch("anthropic.AsyncAnthropic") as mock_anthropic,
        ):
            # Setup Ollama mock
            mock_httpx_instance = AsyncMock()
            mock_httpx_instance.__aenter__.return_value.post = AsyncMock(
                return_value=mock_ollama_response
            )
            mock_httpx.return_value = mock_httpx_instance

            # Setup Claude mock
            mock_claude_client = AsyncMock()
            mock_claude_client.messages.create = AsyncMock(
                return_value=mock_claude_response
            )
            mock_anthropic.return_value = mock_claude_client

            results = await get_multi_model_responses(
                sample_messages,
                ["ollama-llama3.2", "claude-sonnet-4-5"],
                "dummy-key",
            )

            assert len(results) == 2
            model_ids = [r[0] for r in results]
            assert "ollama-llama3.2" in model_ids
            assert "claude-sonnet-4-5" in model_ids

    async def test_get_multi_model_responses_with_errors(self, sample_messages):
        """Test multi-model responses when some models fail"""
        mock_response = MagicMock()
        mock_response.json.return_value = {"message": {"content": "Success"}}
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client:
            # First call succeeds, second call fails
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value.post = AsyncMock(
                side_effect=[mock_response, Exception("Error")]
            )
            mock_client.return_value = mock_client_instance

            results = await get_multi_model_responses(
                sample_messages,
                ["ollama-llama3.2", "ollama-mistral"],
                "dummy-key",
            )

            assert len(results) == 2
            # Both should return results (one success, one error)
            assert all(isinstance(r, tuple) for r in results)

    async def test_get_multi_model_responses_empty_list(self, sample_messages):
        """Test multi-model responses with empty model list"""
        results = await get_multi_model_responses(sample_messages, [], "dummy-key")
        assert results == []
