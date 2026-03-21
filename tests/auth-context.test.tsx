import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../src/lib/auth-context'
import React from 'react'

// --- MOCKS ---

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  })
}))

// Mock supabase-client
const mockSignInWithPassword = vi.fn()
const mockGetSession = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockGetUser = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: (...args: unknown[]) => mockSupabaseFrom(...args)
  }
}))

// Set up default onAuthStateChange returning a dummy unsubscribe function
beforeEach(() => {
  vi.clearAllMocks()
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  })
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  
  // By default window replace mock
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { replace: vi.fn() }
    })
  }
})

describe('AuthContext', () => {

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    Wrapper.displayName = 'TestAuthWrapper';
    return Wrapper;
  }

  it('should initialize with no user if no session', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  it('should handle successful loginWithPassword', async () => {
    // Mock secure successful login
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    // Mock profile fetch success
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-user-id',
          full_name: 'Test Cadet',
          role: 'CADET',
          regimental_number: 'AS20SDA100000',
        },
        error: null
      })
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for init to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Call login
    const promise = result.current.loginWithPassword('test@nccrgu.internal', '1234')
    
    await promise

    // Verify it attempted secure password login first (pin + salt)
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@nccrgu.internal',
      password: '1234-ncc-rgu'
    })

    // Verify user profile is loaded
    await waitFor(() => {
      expect(result.current.user).toEqual({
        id: 'test-user-id',
        name: 'Test Cadet',
        role: 'CADET',
        regimentalNumber: 'AS20SDA100000',
        avatarUrl: undefined
      })
    })
  })

  it('should throw error on invalid credentials', async () => {
    // Both secure and raw login fail
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid credentials')
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Expect login to throw
    await expect(
      result.current.loginWithPassword('test@nccrgu.internal', 'wrongpin')
    ).rejects.toThrow('Invalid credentials')

    // Expect user to stay null
    expect(result.current.user).toBeNull()
  })

  it('should handle logout', async () => {
    // Initialize with a mock user
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'usr-1' } } },
      error: null
    })

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'usr-1',
          full_name: 'Logged In User',
          role: 'ANO'
        },
        error: null
      })
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.user).toBeDefined()
      expect(result.current.user?.name).toBe('Logged In User')
    })

    mockSignOut.mockResolvedValueOnce({ error: null })

    // Trigger logout
    await result.current.logout()

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' })
  })
})
