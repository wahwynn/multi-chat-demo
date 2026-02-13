import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthPage from '../AuthPage'
import { authApi } from '@/lib/api'

jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}))

const mockOnLogin = jest.fn()

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form by default', () => {
    render(<AuthPage onLogin={mockOnLogin} />)

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByTestId('username-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
    expect(screen.getByText(/Sign up/)).toBeInTheDocument()
  })

  it('shows register form when toggled', async () => {
    const user = userEvent.setup()
    render(<AuthPage onLogin={mockOnLogin} />)

    await user.click(screen.getByText(/Sign up/))

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('create-account-button')).toBeInTheDocument()
  })

  it('calls onLogin with user when login succeeds', async () => {
    const user = userEvent.setup()
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    ;(authApi.login as jest.Mock).mockResolvedValue(mockUser)

    render(<AuthPage onLogin={mockOnLogin} />)

    await user.type(screen.getByTestId('username-input'), 'testuser')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('sign-in-button'))

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('testuser', 'password123')
      expect(mockOnLogin).toHaveBeenCalledWith(mockUser)
    })
  })

  it('calls onLogin with user when register succeeds', async () => {
    const user = userEvent.setup()
    const mockUser = { id: 1, username: 'newuser', email: 'new@example.com' }
    ;(authApi.register as jest.Mock).mockResolvedValue(mockUser)

    render(<AuthPage onLogin={mockOnLogin} />)

    await user.click(screen.getByText(/Sign up/))
    await user.type(screen.getByTestId('username-input'), 'newuser')
    await user.type(screen.getByTestId('email-input'), 'new@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.type(screen.getByTestId('confirm-password-input'), 'password123')
    await user.click(screen.getByTestId('create-account-button'))

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123')
      expect(mockOnLogin).toHaveBeenCalledWith(mockUser)
    })
  })

  it('shows error when passwords do not match on register', async () => {
    const user = userEvent.setup()
    render(<AuthPage onLogin={mockOnLogin} />)

    await user.click(screen.getByText(/Sign up/))
    await user.type(screen.getByTestId('username-input'), 'newuser')
    await user.type(screen.getByTestId('email-input'), 'new@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.type(screen.getByTestId('confirm-password-input'), 'different')
    await user.click(screen.getByTestId('create-account-button'))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      expect(authApi.register).not.toHaveBeenCalled()
    })
  })

  it('shows error when login fails', async () => {
    const user = userEvent.setup()
    ;(authApi.login as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    })

    render(<AuthPage onLogin={mockOnLogin} />)

    await user.type(screen.getByTestId('username-input'), 'testuser')
    await user.type(screen.getByTestId('password-input'), 'wrong')
    await user.click(screen.getByTestId('sign-in-button'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      expect(mockOnLogin).not.toHaveBeenCalled()
    })
  })

  it('shows generic error when API error has no message', async () => {
    const user = userEvent.setup()
    ;(authApi.login as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<AuthPage onLogin={mockOnLogin} />)

    await user.type(screen.getByTestId('username-input'), 'testuser')
    await user.type(screen.getByTestId('password-input'), 'password')
    await user.click(screen.getByTestId('sign-in-button'))

    await waitFor(() => {
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    let resolveLogin: (value: unknown) => void
    ;(authApi.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve })
    )

    render(<AuthPage onLogin={mockOnLogin} />)

    await user.type(screen.getByTestId('username-input'), 'testuser')
    await user.type(screen.getByTestId('password-input'), 'password')
    const button = screen.getByTestId('sign-in-button')
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(screen.getByText(/Signing in/)).toBeInTheDocument()

    resolveLogin!({ id: 1, username: 'testuser', email: 'test@example.com' })
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('clears password fields when toggling between login and register', async () => {
    const user = userEvent.setup()
    render(<AuthPage onLogin={mockOnLogin} />)

    await user.type(screen.getByTestId('password-input'), 'secret')
    await user.click(screen.getByText(/Sign up/))

    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
    expect(passwordInput.value).toBe('')
  })
})
