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

vi.mock('../src/lib/require-access-token', () => ({
    requireAccessToken: vi.fn(async () => 'fake-token')
}))

vi.mock('../src/lib/get-access-token', () => ({
  getAccessToken: vi.fn(async () => 'fake-token')
}))

vi.mock('../src/app/actions/cadet-actions', () => ({
    deleteCadetAction: vi.fn(async () => ({ success: true })),
}))

vi.mock('../src/app/actions/profile-actions', () => ({
    getProfilesAction: vi.fn(async () => ({ 
        success: true, 
        data: [{
            id: 'cadet-1',
            full_name: 'Original Name',
            role: Role.CADET,
            regimental_number: 'RG123',
            status: 'active'
        }]
    })),
    updateProfileAction: vi.fn(async () => ({ success: true })),
    getProfileByIdAction: vi.fn(async (id) => ({ id, full_name: 'Test User', role: Role.ANO }))
}))

vi.mock('../src/app/actions/certificate-actions', () => ({
    getCertificatesAction: vi.fn(async () => ({ success: true, data: [] }))
}))

// --- TEST SETUP ---

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      }
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

describe('CadetContext (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes cadets correctly', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCadetData(), { wrapper })

    await waitFor(() => {
      expect(result.current.cadets).toBeDefined()
    }, { timeout: 3000 })
  })

  it('can update a cadet name', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCadetData(), { wrapper })

    await result.current.updateCadet('cadet-1', { name: 'Updated' })
  })
})
