import anthropic
import httpx
import asyncio
from typing import List, Tuple

GITHUB_MODELS_BASE_URL = "https://models.github.ai"


# Model definitions for availability checks (must match Conversation.MODEL_CHOICES)
CLAUDE_MODELS = ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-5"]
OLLAMA_MODELS = ["ollama-llama3.2", "ollama-llama3.1", "ollama-mistral", "ollama-phi3"]
GITHUB_MODELS = [
    "github-openai/gpt-4.1",
    "github-openai/gpt-4o-mini",
    "github-openai/gpt-4o",
    "github-meta/llama-3.2-90b-vision-instruct",
]

MODEL_LABELS = {
    "claude-sonnet-4-5": "Claude 4.5 Sonnet",
    "claude-haiku-4-5": "Claude 4.5 Haiku",
    "claude-opus-4-5": "Claude 4.5 Opus",
    "ollama-llama3.2": "Ollama Llama 3.2",
    "ollama-llama3.1": "Ollama Llama 3.1",
    "ollama-mistral": "Ollama Mistral",
    "ollama-phi3": "Ollama Phi-3",
    "github-openai/gpt-4.1": "GitHub GPT-4.1",
    "github-openai/gpt-4o-mini": "GitHub GPT-4o Mini",
    "github-openai/gpt-4o": "GitHub GPT-4o",
    "github-meta/llama-3.2-90b-vision-instruct": "GitHub Llama 3.2 90B Vision",
}


def check_ollama_available(ollama_base_url: str = "http://localhost:11434") -> bool:
    """Check if Ollama is running and reachable at the given base URL."""
    try:
        with httpx.Client(timeout=2.0) as client:
            response = client.get(f"{ollama_base_url.rstrip('/')}/api/version")
            return bool(response.status_code == 200)
    except Exception:
        return False


def get_ollama_installed_models(
    ollama_base_url: str = "http://localhost:11434",
) -> set[str]:
    """
    Fetch list of installed Ollama models via /api/tags.
    Returns set of model base names (e.g. "llama3.2", "mistral").
    Ollama may return names with tags like "llama3.2:latest"; we match by prefix.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{ollama_base_url.rstrip('/')}/api/tags")
            if response.status_code != 200:
                return set()
            data = response.json()
            models = data.get("models", [])
            return {m.get("name", "").split(":")[0] for m in models if m.get("name")}
    except Exception:
        return set()


def get_available_models(
    anthropic_api_key: str = "",
    github_api_key: str = "",
    ollama_base_url: str = "http://localhost:11434",
) -> list[dict[str, str]]:
    """
    Return list of enabled models based on configured API keys and Ollama availability.
    Each item is {"value": model_id, "label": display_name}.
    """
    models = []
    if anthropic_api_key and anthropic_api_key.strip():
        for m in CLAUDE_MODELS:
            models.append({"value": m, "label": MODEL_LABELS[m]})
    if check_ollama_available(ollama_base_url):
        installed = get_ollama_installed_models(ollama_base_url)
        for m in OLLAMA_MODELS:
            # Only include Ollama models that are actually installed
            ollama_name = m.replace("ollama-", "")
            if ollama_name in installed:
                models.append({"value": m, "label": MODEL_LABELS[m]})
    if github_api_key and github_api_key.strip():
        for m in GITHUB_MODELS:
            models.append({"value": m, "label": MODEL_LABELS[m]})
    return models


def get_unavailable_model_reasons(
    selected_models: list[str],
    anthropic_api_key: str = "",
    github_api_key: str = "",
    ollama_base_url: str = "http://localhost:11434",
) -> list[tuple[str, str]]:
    """
    Return list of (model_id, reason) for models that are selected but not available.
    Used to build descriptive error messages when chatting with old conversations.
    """
    reasons: list[tuple[str, str]] = []
    ollama_available = check_ollama_available(ollama_base_url)
    ollama_installed = (
        get_ollama_installed_models(ollama_base_url) if ollama_available else set()
    )

    for model in selected_models:
        if is_ollama_model(model):
            if not ollama_available:
                reasons.append((model, "Ollama is not running"))
            else:
                ollama_name = model.replace("ollama-", "")
                if ollama_name not in ollama_installed:
                    label = MODEL_LABELS.get(model, model)
                    reasons.append(
                        (
                            model,
                            f"Model '{label}' is not installed in Ollama (run 'ollama pull {ollama_name}')",
                        )
                    )
        elif model in CLAUDE_MODELS:
            if not (anthropic_api_key and anthropic_api_key.strip()):
                reasons.append((model, "ANTHROPIC_API_KEY not configured"))
        elif model in GITHUB_MODELS:
            if not (github_api_key and github_api_key.strip()):
                reasons.append((model, "GITHUB_API_KEY not configured"))
        else:
            reasons.append((model, "Model not available"))

    return reasons


def is_ollama_model(model: str) -> bool:
    """Check if a model is an Ollama model"""
    return model.startswith("ollama-")


def is_github_model(model: str) -> bool:
    """Check if a model is a GitHub Models model"""
    return model.startswith("github-")


def get_github_model_id(model: str) -> str:
    """Convert internal model ID to GitHub Models API format (strip github- prefix)"""
    return model.replace("github-", "", 1)


async def get_single_model_response_async(
    messages: list,
    model: str,
    api_key: str,
    ollama_base_url: str = "http://localhost:11434",
    github_api_key: str = "",
) -> Tuple[str, str]:
    """
    Get a response from a single model (Claude, Ollama, or GitHub Models) asynchronously

    Args:
        messages: List of tuples containing (role, content) for conversation history
        model: The model to use for the response
        api_key: Anthropic API key (not used for Ollama or GitHub Models)
        ollama_base_url: Base URL for Ollama API
        github_api_key: GitHub API key for GitHub Models (requires models: read scope)

    Returns:
        Tuple of (model_id, response_text)
    """
    try:
        if is_ollama_model(model):
            # Extract Ollama model name (remove "ollama-" prefix)
            ollama_model = model.replace("ollama-", "")

            # Convert messages to Ollama format
            ollama_messages: list[dict[str, str]] = []
            for role, content in messages:
                ollama_messages.append({"role": role, "content": content})

            # Call Ollama API using httpx
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{ollama_base_url}/api/chat",
                    json={
                        "model": ollama_model,
                        "messages": ollama_messages,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                response_data = response.json()

            # Extract text from response
            response_text = response_data.get("message", {}).get("content", "")
            if response_text:
                return (model, response_text)
            else:
                return (
                    model,
                    "I received a response, but it didn't contain any text content.",
                )
        elif is_github_model(model) and github_api_key:
            # Use GitHub Models API
            github_model_id = get_github_model_id(model)

            # Convert messages to GitHub Models format
            github_messages: list[dict[str, str]] = []
            for role, content in messages:
                github_messages.append({"role": role, "content": content})

            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{GITHUB_MODELS_BASE_URL}/inference/chat/completions",
                    headers={
                        "Authorization": f"Bearer {github_api_key}",
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": github_model_id,
                        "messages": github_messages,
                        "stream": False,
                        "max_tokens": 2048,
                    },
                )
                response.raise_for_status()
                response_data = response.json()

            # Extract text from OpenAI-style response format
            choices = response_data.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
                if content:
                    return (model, content)

            return (
                model,
                "I received a response, but it didn't contain any text content.",
            )
        elif is_github_model(model) and not github_api_key:
            return (
                model,
                "Error: GitHub API key (GITHUB_API_KEY) is required for GitHub Models. "
                "Create a fine-grained personal access token with 'models: read' scope.",
            )
        elif not api_key or not api_key.strip():
            return (
                model,
                "Error: Anthropic API key (ANTHROPIC_API_KEY) is required for Claude models. "
                "Get your API key from https://console.anthropic.com/",
            )
        else:
            # Use Anthropic API for Claude models
            anthropic_client: anthropic.AsyncAnthropic = anthropic.AsyncAnthropic(
                api_key=api_key
            )

            # Convert messages to Anthropic format
            formatted_messages: list[dict[str, str]] = []
            for role, content in messages:
                formatted_messages.append({"role": role, "content": content})

            # Call Claude API asynchronously
            anthropic_response = await anthropic_client.messages.create(
                model=model,
                max_tokens=2048,
                messages=formatted_messages,  # type: ignore[arg-type]
            )

            # Extract text from response content blocks
            # Content can contain TextBlock, ThinkingBlock, ToolUseBlock, etc.
            # We only extract text from TextBlock types
            text_parts = []
            for block in anthropic_response.content:
                # Use getattr to safely access text attribute (only exists on TextBlock)
                text = getattr(block, "text", None)
                if text is not None:
                    text_parts.append(text)

            if text_parts:
                return (model, "".join(text_parts))
            else:
                return (
                    model,
                    "I received a response, but it didn't contain any text content.",
                )

    except Exception as e:
        return (model, f"Error with {model}: {str(e)}")


async def get_multi_model_responses(
    messages: list,
    models: List[str],
    api_key: str,
    ollama_base_url: str = "http://localhost:11434",
    github_api_key: str = "",
) -> List[Tuple[str, str]]:
    """
    Get responses from multiple models (Claude, Ollama, and/or GitHub Models) in parallel

    Args:
        messages: List of tuples containing (role, content) for conversation history
        models: List of model IDs to query (Claude, Ollama, or GitHub Models)
        api_key: Anthropic API key (not used for Ollama or GitHub Models)
        ollama_base_url: Base URL for Ollama API
        github_api_key: GitHub API key for GitHub Models (requires models: read scope)

    Returns:
        List of tuples: [(model_id, response_text), ...]
    """
    # Create tasks for all models
    tasks = [
        get_single_model_response_async(
            messages, model, api_key, ollama_base_url, github_api_key
        )
        for model in models
    ]

    # Run all tasks in parallel and handle errors gracefully
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process results and handle exceptions
    responses: List[Tuple[str, str]] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            responses.append((models[i], f"Error: {str(result)}"))
        elif isinstance(result, tuple):
            responses.append(result)

    return responses
