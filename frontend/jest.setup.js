// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()

// Mock matchMedia for ThemeProvider
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
