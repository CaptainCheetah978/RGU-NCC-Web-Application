import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queueAttendanceOffline, getOfflineAttendanceQueue, clearOfflineQueue } from '../src/lib/offline-sync'
// Mock idb-keyval
vi.mock('idb-keyval', () => {
    let store: Record<string, unknown> = {}
    return {
        get: vi.fn((key: string) => Promise.resolve(store[key])),
        update: vi.fn((key: string, cb: (val: unknown) => unknown) => {
            store[key] = cb(store[key])
            return Promise.resolve()
        }),
        del: vi.fn((key: string) => {
            delete store[key]
            return Promise.resolve()
        }),
        clear: vi.fn(() => {
            store = {}
            return Promise.resolve()
        }),
        set: vi.fn((key, val) => {
            store[key] = val
            return Promise.resolve()
        })
    }
})

describe('Offline Sync Logic', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        await clearOfflineQueue()
    })

    it('should add a new record to the queue', async () => {
        const payload = {
            id: 'class1-cadet1',
            classId: 'class1',
            cadetId: 'cadet1',
            status: 'PRESENT' as const,
            timestamp: '2026-03-20T10:00:00Z'
        }

        await queueAttendanceOffline(payload)
        const queue = await getOfflineAttendanceQueue()

        expect(queue).toHaveLength(1)
        expect(queue[0]).toEqual(payload)
    })

    it('should update an existing record if the same ID is queued again', async () => {
        const payload1 = {
            id: 'class1-cadet1',
            classId: 'class1',
            cadetId: 'cadet1',
            status: 'PRESENT' as const,
            timestamp: '2026-03-20T10:00:00Z'
        }

        const payload2 = {
            id: 'class1-cadet1',
            classId: 'class1',
            cadetId: 'cadet1',
            status: 'ABSENT' as const, // Changed status
            timestamp: '2026-03-20T10:05:00Z'
        }

        await queueAttendanceOffline(payload1)
        await queueAttendanceOffline(payload2)

        const queue = await getOfflineAttendanceQueue()

        expect(queue).toHaveLength(1)
        expect(queue[0].status).toBe('ABSENT')
    })

    it('should clear the queue successfully', async () => {
        await queueAttendanceOffline({
            id: 'c1-d1',
            classId: 'c1',
            cadetId: 'd1',
            status: 'PRESENT' as const,
            timestamp: '...'
        })

        await clearOfflineQueue()
        const queue = await getOfflineAttendanceQueue()

        expect(queue).toHaveLength(0)
    })
})
