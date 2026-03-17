import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { TrainingProvider, useTrainingData } from '../src/lib/training-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// --- MOCKS ---

// Mock useAuth
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', name: 'Test User', role: 'ANO' }
  })
}))

// Mock supabase-client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockImplementation(() => ({
        // Return empty array by default
        then: (cb: any) => cb({ data: [], error: null })
      })),
      insert: vi.fn().mockReturnValue({ data: null, error: null }),
      delete: vi.fn().mockReturnValue({ data: null, error: null })
    }))
  }
}))

// Mock require-access-token
vi.mock('@/lib/require-access-token', () => ({
  requireAccessToken: vi.fn(() => Promise.resolve('fake-token'))
}))

// Mock Server Actions (dynamic imports)
const classActions = {
  addClassAction: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))),
  deleteClassAction: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50)))
}

const attendanceActions = {
  markAttendanceAction: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50)))
}

vi.mock('@/app/actions/class-actions', () => classActions)
vi.mock('@/app/actions/attendance-actions', () => attendanceActions)

// Mock crypto for optimistic IDs
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7)
  }
}

// --- TEST SETUP ---

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity, // Prevent background refetches during tests
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TrainingProvider>{children}</TrainingProvider>
    </QueryClientProvider>
  )
}

describe('TrainingContext Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should optimistically add a class', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTrainingData(), { wrapper })

    const newClass = {
      id: 'optimistic-id-123',
      title: 'New Drill Session',
      date: '2026-03-20',
      time: '08:00',
      instructorId: 'inst-1',
      description: 'Test drill',
      attendees: []
    }

    // Call addClass
    const promise = result.current.addClass(newClass)

    // Verify it exists in local state immediately (Optimistic)
    await waitFor(() => {
      expect(result.current.classes).toContainEqual(expect.objectContaining({
        title: 'New Drill Session',
        id: 'optimistic-id-123'
      }))
    })

    await promise // Wait for mutation to finish
  })

  it('should optimistically mark attendance', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useTrainingData(), { wrapper })

    const record = {
      id: 'optimistic-attendance-123',
      classId: 'class-1',
      cadetId: 'cadet-1',
      status: 'PRESENT' as const,
      timestamp: new Date().toISOString()
    }

    // Call markAttendance
    const promise = result.current.markAttendance(record)

    // Verify it exists in local attendance list
    await waitFor(() => {
      const entry = result.current.attendance.find(a => a.cadetId === 'cadet-1')
      expect(entry).toBeDefined()
      expect(entry?.status).toBe('PRESENT')
    })

    await promise
  })

  it('should rollback state on error', async () => {
    // Mock failure
    classActions.addClassAction.mockReturnValueOnce(Promise.resolve({ success: false, error: 'DB Error' }))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useTrainingData(), { wrapper })

    const newClass = {
      id: 'fail-class',
      title: 'Failing Class',
      date: '2026-03-20',
      time: '08:00',
      instructorId: 'inst-1',
      description: 'Will fail',
      attendees: []
    }

    try {
      await result.current.addClass(newClass)
    } catch (e) {
      // Expected
    }

    // Should be rolled back to empty
    await waitFor(() => {
      expect(result.current.classes).not.toContainEqual(expect.objectContaining({ id: 'fail-class' }))
    })
  })
})
