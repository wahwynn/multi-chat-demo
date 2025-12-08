import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageInput from '../MessageInput'

describe('MessageInput', () => {
  const mockOnSend = jest.fn()

  beforeEach(() => {
    mockOnSend.mockClear()
  })

  it('renders textarea and send button', () => {
    render(<MessageInput onSend={mockOnSend} />)

    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('disables send button when message is empty', () => {
    render(<MessageInput onSend={mockOnSend} />)

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when message has content', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, 'Hello')

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).not.toBeDisabled()
  })

  it('calls onSend when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, 'Hello, world!')

    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    expect(mockOnSend).toHaveBeenCalledWith('Hello, world!')
    expect(mockOnSend).toHaveBeenCalledTimes(1)
  })

  it('clears input after sending', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i) as HTMLTextAreaElement
    await user.type(textarea, 'Test message')

    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    expect(textarea.value).toBe('')
  })

  it('trims whitespace from message before sending', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, '   Hello   ')

    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    expect(mockOnSend).toHaveBeenCalledWith('Hello')
  })

  it('sends message when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, 'Hello{Enter}')

    expect(mockOnSend).toHaveBeenCalledWith('Hello')
  })

  it('does not send message when Shift+Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}')

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('does not send empty message', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, '   ')

    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('disables input when disabled prop is true', () => {
    render(<MessageInput onSend={mockOnSend} disabled />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    expect(textarea).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('does not call onSend when disabled', async () => {
    const user = userEvent.setup()
    render(<MessageInput onSend={mockOnSend} disabled />)

    const textarea = screen.getByPlaceholderText(/type your message/i)
    await user.type(textarea, 'Hello')

    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)

    expect(mockOnSend).not.toHaveBeenCalled()
  })
})
