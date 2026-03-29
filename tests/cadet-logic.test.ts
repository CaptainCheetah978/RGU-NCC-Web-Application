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

// fetchProfiles and fetchCertificates now use server actions via dynamic import.
// Mock the profile-actions module so dynamic import resolves correctly.
vi.mock('../src/app/actions/profile-actions', () => ({
  getAllProfilesAction: vi.fn(() => Promise.resolve({
    success: true,
    data: [{
      id: 'cadet-1',
      full_name: 'Original Name',
      role: 'CADET',
      regimental_number: 'RG123',
      status: 'active',
    }]
  })),
  getAllCertificatesAction: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  // Delay simulates real async latency so the optimistic UI update has time
  // to render before the mutation resolves and triggers a background refetch.
  updateProfileAction: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))),
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
