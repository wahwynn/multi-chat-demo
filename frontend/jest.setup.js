// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()
