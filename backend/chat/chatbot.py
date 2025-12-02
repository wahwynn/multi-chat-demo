import anthropic
from django.conf import settings
import asyncio
from typing import List, Tuple


def get_chatbot_response(messages: list, model: str = "claude-sonnet-4-5") -> str:
    """
    Get a response from the Anthropic Claude chatbot (synchronous version)

    Args:
        messages: List of tuples containing (role, content) for conversation history
        model: The Claude model to use for the response

    Returns:
        The chatbot's response as a string
    """
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        # Convert messages to Anthropic format
        formatted_messages = []
        for role, content in messages:
            formatted_messages.append({
                "role": role,
                "content": content
            })

        # Call Claude API
        response = client.messages.create(
            model=model,
            max_tokens=2048,
            messages=formatted_messages
        )

        # Extract text from response
        return response.content[0].text

    except Exception as e:
        return f"I'm sorry, I encountered an error: {str(e)}"


async def get_single_model_response_async(
    messages: list,
    model: str,
    api_key: str
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
            formatted_messages.append({
                "role": role,
                "content": content
            })

        # Call Claude API asynchronously
        response = await client.messages.create(
            model=model,
            max_tokens=2048,
            messages=formatted_messages
        )

        # Extract text from response
        return (model, response.content[0].text)

    except Exception as e:
        return (model, f"Error with {model}: {str(e)}")


async def get_multi_model_responses(
    messages: list,
    models: List[str],
    api_key: str
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
        get_single_model_response_async(messages, model, api_key)
        for model in models
    ]

    # Run all tasks in parallel and handle errors gracefully
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process results and handle exceptions
    responses = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            responses.append((models[i], f"Error: {str(result)}"))
        else:
            responses.append(result)

    return responses
