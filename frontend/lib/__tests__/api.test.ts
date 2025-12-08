// Mock axios.create to return our mock instance
interface MockAxiosInstance {
  get: jest.Mock
  post: jest.Mock
  patch: jest.Mock
  delete: jest.Mock
  put: jest.Mock
  interceptors: {
    request: { use: jest.Mock; eject: jest.Mock }
    response: { use: jest.Mock; eject: jest.Mock }
  }
  defaults: Record<string, unknown>
}

declare global {
  var __mockAxiosInstance: MockAxiosInstance | undefined
}

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios')
  // Create the mock instance inside the factory
  const instance: MockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {},
  }
  // Store it globally so tests can access it
  global.__mockAxiosInstance = instance
  return {
    ...actualAxios,
    create: jest.fn(() => instance),
  }
})

import { authApi, chatApi } from '../api'

// Get the mock instance from global
const getMockInstance = (): MockAxiosInstance => {
  const instance = global.__mockAxiosInstance
  if (!instance) {
    throw new Error('Mock axios instance not found')
  }
  return instance
}

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMe', () => {
    it('should fetch current user', async () => {
      const mockResponse = {
        data: {
          authenticated: true,
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      }
      getMockInstance().get.mockResolvedValue(mockResponse)

      const result = await authApi.getMe()

      expect(getMockInstance().get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('login', () => {
    it('should login with username and password', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      }
      getMockInstance().post.mockResolvedValue(mockResponse)

      const result = await authApi.login('testuser', 'password123')

      expect(getMockInstance().post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'newuser',
          email: 'newuser@example.com',
        },
      }
      getMockInstance().post.mockResolvedValue(mockResponse)

      const result = await authApi.register('newuser', 'newuser@example.com', 'password123')

      expect(getMockInstance().post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('logout', () => {
    it('should logout user', async () => {
      getMockInstance().post.mockResolvedValue({ data: {} })

      await authApi.logout()

      expect(getMockInstance().post).toHaveBeenCalledWith('/auth/logout')
    })
  })

  describe('uploadAvatar', () => {
    it('should upload avatar file', async () => {
      const mockFile = new File(['content'], 'avatar.png', { type: 'image/png' })
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          avatar_url: 'https://example.com/avatar.png',
        },
      }
      getMockInstance().post.mockResolvedValue(mockResponse)

      const result = await authApi.uploadAvatar(mockFile)

      expect(getMockInstance().post).toHaveBeenCalledWith(
        '/auth/avatar',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('deleteAvatar', () => {
    it('should delete avatar', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          avatar_url: null,
        },
      }
      getMockInstance().delete.mockResolvedValue(mockResponse)

      const result = await authApi.deleteAvatar()

      expect(getMockInstance().delete).toHaveBeenCalledWith('/auth/avatar')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('updateProfile', () => {
    it('should update profile with username and email', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'newname',
          email: 'newemail@example.com',
        },
      }
      getMockInstance().patch.mockResolvedValue(mockResponse)

      const result = await authApi.updateProfile('newname', 'newemail@example.com')

      expect(getMockInstance().patch).toHaveBeenCalledWith('/auth/profile', {
        username: 'newname',
        email: 'newemail@example.com',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should update profile with only username', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'newname',
          email: 'old@example.com',
        },
      }
      getMockInstance().patch.mockResolvedValue(mockResponse)

      const result = await authApi.updateProfile('newname')

      expect(getMockInstance().patch).toHaveBeenCalledWith('/auth/profile', {
        username: 'newname',
        email: undefined,
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('changePassword', () => {
    it('should change password', async () => {
      getMockInstance().post.mockResolvedValue({ data: {} })

      await authApi.changePassword('oldpass', 'newpass')

      expect(getMockInstance().post).toHaveBeenCalledWith('/auth/change-password', {
        old_password: 'oldpass',
        new_password: 'newpass',
      })
    })
  })
})

describe('chatApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getConversations', () => {
    it('should fetch all conversations', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            title: 'Chat 1',
            selected_models: ['claude-sonnet-4-5'],
          },
        ],
      }
      getMockInstance().get.mockResolvedValue(mockResponse)

      const result = await chatApi.getConversations()

      expect(getMockInstance().get).toHaveBeenCalledWith('/chat/conversations')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'New Chat',
          selected_models: ['claude-sonnet-4-5'],
        },
      }
      getMockInstance().post.mockResolvedValue(mockResponse)

      const result = await chatApi.createConversation('New Chat', ['claude-sonnet-4-5'])

      expect(getMockInstance().post).toHaveBeenCalledWith('/chat/conversations', {
        title: 'New Chat',
        selected_models: ['claude-sonnet-4-5'],
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should use default values when not provided', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'New Chat',
          selected_models: ['claude-3-5-sonnet-20241022'],
        },
      }
      getMockInstance().post.mockResolvedValue(mockResponse)

      await chatApi.createConversation()

      expect(getMockInstance().post).toHaveBeenCalledWith('/chat/conversations', {
        title: 'New Chat',
        selected_models: ['claude-3-5-sonnet-20241022'],
      })
    })
  })

  describe('getConversation', () => {
    it('should fetch a specific conversation', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'Chat 1',
          messages: [],
        },
      }
      getMockInstance().get.mockResolvedValue(mockResponse)

      const result = await chatApi.getConversation(1)

      expect(getMockInstance().get).toHaveBeenCalledWith('/chat/conversations/1')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('updateConversation', () => {
    it('should update conversation title', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'Updated Title',
        },
      }
      getMockInstance().patch.mockResolvedValue(mockResponse)

      const result = await chatApi.updateConversation(1, 'Updated Title')

      expect(getMockInstance().patch).toHaveBeenCalledWith('/chat/conversations/1', {
        title: 'Updated Title',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      getMockInstance().delete.mockResolvedValue({ data: {} })

      await chatApi.deleteConversation(1)

      expect(getMockInstance().delete).toHaveBeenCalledWith('/chat/conversations/1')
    })
  })

  describe('sendMessage', () => {
    it('should send a message and get response', async () => {
      const mockResponse = {
        data: {
          message: {
            id: 1,
            role: 'user',
            content: 'Hello',
          },
          assistant_messages: [
            {
              id: 2,
              role: 'assistant',
              content: 'Hi there!',
            },
          ],
        },
      }
      getMockInstance().post.mockResolvedValue(mockResponse)

      const result = await chatApi.sendMessage(1, 'Hello')

      expect(getMockInstance().post).toHaveBeenCalledWith('/chat/conversations/1/messages', {
        content: 'Hello',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })
})
