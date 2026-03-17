import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { CadetProvider, useCadetData } from '../src/lib/cadet-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Role } from '../src/types'
import React from 'react'

// --- MOCKS ---

vi.mock('../src/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', name: 'Test User', role: Role.ANO }
  })
}))

vi.mock('../src/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockImplementation(() => ({
        // Return a promise that takes a little long to resolve
        then: (cb: (val: { data: unknown[]; error: null }) => void) => new Promise((resolve) => {
            setTimeout(() => {
                resolve(cb({ 
                    data: [{
                      id: 'cadet-1',
                      full_name: 'Original Name',
                      role: 'CADET',
                      regimental_number: 'RG123',
                      status: 'active'
                    }], 
                    error: null 
                }))
            }, 50)
        })
      })),
      insert: vi.fn().mockReturnValue({ then: (cb: (val: { data: null; error: null }) => void) => Promise.resolve({ data: null, error: null }).then(cb) }),
      update: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({ then: (cb: (val: { data: null; error: null }) => void) => Promise.resolve({ data: null, error: null }).then(cb) })
      })),
      delete: vi.fn().mockReturnValue({ then: (cb: (val: { data: null; error: null }) => void) => cb({ data: null, error: null }) })
    }))
  }
}))

vi.mock('../src/lib/get-access-token', () => ({
  getAccessToken: vi.fn(() => Promise.resolve('fake-token'))
}))

vi.mock('../src/app/actions/cadet-actions', () => ({
    deleteCadetAction: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 150))),
}))

// --- TEST SETUP ---

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5000,
      },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, 
      React.createElement(CadetProvider, null, children)
    )
  Wrapper.displayName = 'CadetTestWrapper'
  return Wrapper
}

describe('CadetContext Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should optimistically update a cadet profile', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCadetData(), { wrapper })

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.cadets.length).toBeGreaterThan(0)
    }, { timeout: 3000 })

    const cadetId = 'cadet-1'
    const updates = { name: 'Updated Name' }

    // Call update (don't await promise immediately)
    const promise = result.current.updateCadet(cadetId, updates as Record<string, string>)

    // Verify optimistic state
    await waitFor(() => {
        const found = result.current.cadets.find(c => c.id === cadetId)
        expect(found?.name).toBe('Updated Name')
    }, { timeout: 1000 })

    await promise
  })

  it('should optimistically remove a deleted cadet', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCadetData(), { wrapper })

    await waitFor(() => {
      expect(result.current.cadets.length).toBeGreaterThan(0)
    }, { timeout: 3000 })

    const cadetId = 'cadet-1'
    
    // Call delete
    const promise = result.current.deleteCadet(cadetId)

    // Verify optimistic remove
    await waitFor(() => {
      const found = result.current.cadets.find(c => c.id === cadetId)
      expect(found).toBeUndefined()
    }, { timeout: 1000 })

    await promise
  })
})
