import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { CadetProvider, useCadetData } from '@/lib/cadet-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Role } from '@/types'
import React from 'react'

// --- MOCKS ---

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', name: 'Test User', role: Role.ANO }
  })
}))

vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockImplementation(() => ({
        then: (cb: any) => cb({ data: [], error: null })
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

vi.mock('@/lib/require-access-token', () => ({
    requireAccessToken: vi.fn(() => Promise.resolve('fake-token'))
}))

vi.mock('@/lib/get-access-token', () => ({
  getAccessToken: vi.fn(() => Promise.resolve('fake-token'))
}))

vi.mock('@/app/actions/cadet-actions', () => ({
    deleteCadetAction: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 10))),
}))

vi.mock('@/app/actions/profile-actions', () => ({
    getProfilesAction: vi.fn(() => Promise.resolve({ 
        success: true, 
        data: [{
            id: 'cadet-1',
            full_name: 'Original Name',
            role: Role.CADET,
            regimental_number: 'RG123',
            status: 'active'
        }]
    })),
    updateProfileAction: vi.fn(() => Promise.resolve({ success: true })),
    getProfileByIdAction: vi.fn((id) => Promise.resolve({ id, full_name: 'Test User', role: Role.ANO }))
}))

vi.mock('@/app/actions/certificate-actions', () => ({
    getCertificatesAction: vi.fn(() => Promise.resolve({ success: true, data: [] }))
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
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CadetProvider>{children}</CadetProvider>
    </QueryClientProvider>
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
    })

    const cadetId = 'cadet-1'
    const updates = { name: 'Updated Name' }

    // Call update
    result.current.updateCadet(cadetId, updates)

    // Verify optimistic state
    await waitFor(() => {
        const found = result.current.cadets.find(c => c.id === cadetId)
        expect(found?.name).toBe('Updated Name')
    }, { timeout: 3000 })
  })

  it('should optimistically remove a deleted cadet', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCadetData(), { wrapper })

    await waitFor(() => {
      expect(result.current.cadets.length).toBeGreaterThan(0)
    })

    const cadetId = 'cadet-1'
    
    // Call delete
    result.current.deleteCadet(cadetId)

    // Verify optimistic remove
    await waitFor(() => {
      const found = result.current.cadets.find(c => c.id === cadetId)
      expect(found).toBeUndefined()
    }, { timeout: 3000 })
  })
})
