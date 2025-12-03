# Frequently Asked Questions (FAQ)

## General Questions

### What is Multi-Chat Demo?

Multi-Chat Demo is a web application that allows you to chat with multiple AI models simultaneously. You can compare responses from different AI models like Claude, Ollama, and more in real-time.

### Do I need to pay to use this?

The application itself is free to use. However, some AI models may require API keys or have usage costs depending on your setup. Check with your administrator or the model provider for pricing details.

### Which browsers are supported?

Multi-Chat Demo works best in modern browsers:

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Account & Authentication

### How do I create an account?

Click "Sign up" on the authentication page and fill in your username, email, and password. See the [Signing Up](index.md#signing-up) section for detailed instructions.

### I forgot my password. How do I reset it?

Currently, password reset functionality is not available. Contact your administrator for assistance, or create a new account if allowed.

### Can I change my username?

Yes! Click your avatar → "Edit profile" → change your username → "Save changes".

### Can I delete my account?

Account deletion is not available through the UI. Contact your administrator if you need to delete your account.

## Conversations

### How many conversations can I have?

There's no limit to the number of conversations you can create.

### Can I export my conversations?

Export functionality is not currently available. Your conversations are stored in the database and can be accessed through the application.

### What happens if I delete a conversation?

Deleting a conversation permanently removes it and all its messages. This action cannot be undone.

### Can I search my conversations?

Search functionality is not currently available. Conversations are listed chronologically in the sidebar.

### How do I select multiple AI models?

Click the "Select Models" dropdown in the sidebar and check the boxes next to the models you want to use. You can select multiple models before creating a conversation.

## Messaging

### How do I send a message?

Type your message in the text area at the bottom and press Enter or click "Send". See [Sending Messages](index.md#sending-messages) for details.

### Can I edit or delete messages?

Message editing and deletion are not currently supported. Once sent, messages cannot be modified.

### Why are responses slow?

Response time depends on:

- The AI model's processing time
- The number of models selected (more models = more time)
- Your internet connection speed
- The complexity of your question

### Why didn't all models respond?

If you selected multiple models but only some responded, possible reasons include:

- One or more models encountered an error
- API rate limits were reached
- Network issues
- The model service is temporarily unavailable

Check your browser's console (F12) for error messages.

### Can I send images or files?

File upload functionality is not currently available. You can only send text messages.

## Profile & Settings

### How do I change my profile picture?

Click your avatar → find the avatar section → click "Upload photo" → select an image. See [Uploading an Avatar](index.md#uploading-an-avatar) for details.

### What image formats are supported for avatars?

Supported formats: JPEG, PNG, GIF, WebP. Maximum file size is 5MB.

### How do I enable dark mode?

Click your avatar → toggle "Dark mode" switch. Your preference is saved automatically.

### Can I change my email address?

Yes! Click your avatar → "Edit profile" → change your email → "Save changes".

## Technical Issues

### The page won't load

1. Check that both backend and frontend servers are running
2. Verify you're accessing the correct URL (usually `http://localhost:3000`)
3. Check your internet connection
4. Try refreshing the page (F5 or Cmd+R)

### I'm getting an error message

1. Read the error message carefully
2. Check the browser console (F12 → Console tab) for details
3. Verify your API keys are configured (if you're an administrator)
4. Try refreshing the page
5. Check the [Troubleshooting](index.md#troubleshooting) section

### Messages aren't sending

1. Ensure you have at least one model selected in the conversation
2. Check your internet connection
3. Verify the backend server is running
4. Check the browser console for errors
5. Try creating a new conversation

### Avatar won't upload

1. Verify the file format (JPEG, PNG, GIF, or WebP)
2. Check the file size (must be under 5MB)
3. Try a different image file
4. Check your internet connection
5. Verify the backend server is running

### The UI looks broken

1. Try refreshing the page (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. Clear your browser cache
3. Check that JavaScript is enabled
4. Try a different browser
5. Check the browser console for errors

## Privacy & Security

### Is my data secure?

The application uses standard web security practices. However, data security depends on your deployment configuration. Check with your administrator about security measures.

### Who can see my conversations?

Conversations are private to your account. Only you (and administrators, if applicable) can access your conversations.

### Are my messages stored?

Yes, messages are stored in the database to maintain conversation history. Check with your administrator about data retention policies.

### Can I use the app offline?

No, Multi-Chat Demo requires an active internet connection to communicate with AI models and the backend server.

## Features & Limitations

### What AI models are available?

Available models depend on your configuration. Common models include:

- Claude Sonnet 4.5
- Ollama models
- Other configured models

Check with your administrator for the complete list.

### Can I add custom AI models?

Model configuration requires backend changes. Contact your administrator or developer.

### Is there a mobile app?

Currently, Multi-Chat Demo is a web application. It should work on mobile browsers, but a dedicated mobile app is not available.

### Can I use voice input?

Voice input is not currently supported. You can only type messages.

### Is there a chat history limit?

There's no built-in limit, but very long conversations may take longer to load.

## Getting Help

### Where can I get more help?

1. Check the [Full User Guide](index.md)
2. Review the [Troubleshooting](index.md#troubleshooting) section
3. Check the [Setup Guide](../../README_SETUP.md) for technical details
4. Contact your administrator

### How do I report a bug?

Contact your administrator or the development team with:

- A description of the issue
- Steps to reproduce
- Browser and version
- Any error messages
- Screenshots if helpful

### Can I request a feature?

Feature requests should be directed to your administrator or the development team.

---

**Don't see your question?** Check the [Full User Guide](index.md) or contact your administrator.
