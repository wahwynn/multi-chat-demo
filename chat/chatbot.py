import anthropic
from django.conf import settings


def get_chatbot_response(messages: list) -> str:
    """
    Get a response from the Anthropic Claude chatbot

    Args:
        messages: List of tuples containing (role, content) for conversation history

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
            model="claude-sonnet-4-5",
            max_tokens=2048,
            messages=formatted_messages
        )

        # Extract text from response
        return response.content[0].text

    except Exception as e:
        return f"I'm sorry, I encountered an error: {str(e)}"
