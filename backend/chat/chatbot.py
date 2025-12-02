import anthropic
import asyncio
from typing import List, Tuple


async def get_single_model_response_async(
    messages: list, model: str, api_key: str
) -> Tuple[str, str]:
    """
    Get a response from a single Claude model asynchronously

    Args:
        messages: List of tuples containing (role, content) for conversation history
        model: The Claude model to use for the response
        api_key: Anthropic API key

    Returns:
        Tuple of (model_id, response_text)
    """
    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)

        # Convert messages to Anthropic format
        formatted_messages = []
        for role, content in messages:
            formatted_messages.append({"role": role, "content": content})

        # Call Claude API asynchronously
        response = await client.messages.create(
            model=model, max_tokens=2048, messages=formatted_messages
        )

        # Extract text from response content blocks
        # Content can contain TextBlock, ThinkingBlock, ToolUseBlock, etc.
        # We only extract text from TextBlock types
        text_parts = []
        for block in response.content:
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
    messages: list, models: List[str], api_key: str
) -> List[Tuple[str, str]]:
    """
    Get responses from multiple Claude models in parallel

    Args:
        messages: List of tuples containing (role, content) for conversation history
        models: List of Claude model IDs to query
        api_key: Anthropic API key

    Returns:
        List of tuples: [(model_id, response_text), ...]
    """
    # Create tasks for all models
    tasks = [
        get_single_model_response_async(messages, model, api_key) for model in models
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
