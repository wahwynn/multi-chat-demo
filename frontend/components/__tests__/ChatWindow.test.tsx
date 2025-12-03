import { render, screen } from '@testing-library/react'
import ChatWindow from '../ChatWindow'
import { Message, User } from '@/lib/types'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  avatar_url: 'https://example.com/avatar.png',
}

describe('ChatWindow', () => {
  it('renders welcome message when no messages', () => {
    render(<ChatWindow messages={[]} expectedModelCount={1} />)

    expect(screen.getByText(/welcome to multi-chat/i)).toBeInTheDocument()
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument()
  })

  it('renders user messages', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello, AI!',
        created_at: '2024-01-01T12:00:00Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={1} user={mockUser} />)

    expect(screen.getByText('Hello, AI!')).toBeInTheDocument()
  })

  it('renders assistant messages', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Hi there!',
        model: 'claude-sonnet-4-5',
        parent_message_id: 1,
        created_at: '2024-01-01T12:00:01Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={1} user={mockUser} />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('groups messages by user message and responses', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Question 1',
        created_at: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Response 1',
        model: 'claude-sonnet-4-5',
        parent_message_id: 1,
        created_at: '2024-01-01T12:00:01Z',
      },
      {
        id: 3,
        role: 'user',
        content: 'Question 2',
        created_at: '2024-01-01T12:00:02Z',
      },
      {
        id: 4,
        role: 'assistant',
        content: 'Response 2',
        model: 'claude-haiku-4-5',
        parent_message_id: 3,
        created_at: '2024-01-01T12:00:03Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={1} user={mockUser} />)

    expect(screen.getByText('Question 1')).toBeInTheDocument()
    expect(screen.getByText('Response 1')).toBeInTheDocument()
    expect(screen.getByText('Question 2')).toBeInTheDocument()
    expect(screen.getByText('Response 2')).toBeInTheDocument()
  })

  it('displays user avatar when provided', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T12:00:00Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={1} user={mockUser} />)

    const avatar = screen.getByAltText('testuser')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('displays default avatar when user not provided', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T12:00:00Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={1} />)

    const avatar = screen.getByAltText('User')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', '/default-avatar.svg')
  })

  it('displays model labels for assistant messages', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Response',
        model: 'claude-sonnet-4-5',
        parent_message_id: 1,
        created_at: '2024-01-01T12:00:01Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={1} user={mockUser} />)

    expect(screen.getByText(/claude.*sonnet/i)).toBeInTheDocument()
  })

  it('shows loading placeholders for pending responses', () => {
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Response 1',
        model: 'claude-sonnet-4-5',
        parent_message_id: 1,
        created_at: '2024-01-01T12:00:01Z',
      },
    ]

    render(<ChatWindow messages={messages} expectedModelCount={3} user={mockUser} />)

    // Should show 2 loading placeholders (3 expected - 1 received)
    const loadingTexts = screen.getAllByText(/waiting for response/i)
    expect(loadingTexts.length).toBeGreaterThan(0)
  })
})
