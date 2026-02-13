import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeProvider, { useTheme } from '../ThemeProvider'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

function TestConsumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-theme">
        Toggle
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('provides light theme by default when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('restores theme from localStorage', () => {
    localStorageMock.setItem('theme', 'dark')

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('toggles theme and persists to localStorage', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

    await user.click(screen.getByTestId('toggle-theme'))

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(localStorageMock.getItem('theme')).toBe('dark')

    await user.click(screen.getByTestId('toggle-theme'))

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(localStorageMock.getItem('theme')).toBe('light')
  })

  it('applies theme to document', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    await user.click(screen.getByTestId('toggle-theme'))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

describe('useTheme outside provider', () => {
  it('returns default values when used outside ThemeProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    function StandaloneConsumer() {
      const { theme, toggleTheme } = useTheme()
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      )
    }

    render(<StandaloneConsumer />)

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(() => screen.getByRole('button').click()).not.toThrow()

    consoleSpy.mockRestore()
  })
})
