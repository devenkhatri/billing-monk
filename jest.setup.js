// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock the auth options
jest.mock('./src/lib/auth', () => ({
  authOptions: {}
}))

// Global test setup
beforeEach(() => {
  jest.clearAllMocks()
})