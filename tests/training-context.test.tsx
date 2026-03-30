import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { TrainingProvider, useTrainingData } from '../src/lib/training-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

// --- MOCKS ---

vi.mock('../src/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', name: 'Test User', role: 'ANO' }
  })
}))

vi.mock('../src/lib/require-access-token', () => ({
  requireAccessToken: vi.fn(async () => 'fake-token')
}))

vi.mock('../src/app/actions/class-actions', () => ({
  getClassesAction: vi.fn(async () => ({ success: true, data: [] })),
  addClassAction: vi.fn(async () => ({ success: true })),
  deleteClassAction: vi.fn(async () => ({ success: true }))
}))

vi.mock('../src/app/actions/attendance-actions', () => ({
    getAttendanceAction: vi.fn(async () => ({ success: true, data: [] })),
    markAttendanceAction: vi.fn(async () => ({ success: true }))
}))

// --- TEST SETUP ---

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0 },
  },
})

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TrainingProvider>{children}</TrainingProvider>
  </QueryClientProvider>
);

describe('TrainingContext (Baseline)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides training data', async () => {
    const { result } = renderHook(() => useTrainingData(), { wrapper: Wrapper })
    expect(result.current).toBeDefined()
  })

  it('initializes with empty lists', async () => {
    const { result } = renderHook(() => useTrainingData(), { wrapper: Wrapper })
    await waitFor(() => {
      expect(Array.isArray(result.current.classes)).toBe(true)
    }, { timeout: 4000 })
  })
})
