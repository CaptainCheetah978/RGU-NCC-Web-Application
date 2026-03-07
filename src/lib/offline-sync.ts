import { get, update, clear } from 'idb-keyval';
import { AttendanceRecord } from '@/types';

// The key we use in IndexedDB to store pending attendance mutations
const IDB_ATTENDANCE_QUEUE_KEY = 'ncc_offline_attendance_queue';

export interface QueuedAttendancePayload {
    id: string; // `${classId}-${cadetId}`
    classId: string;
    cadetId: string;
    status: AttendanceRecord["status"];
    timestamp: string;
}

/**
 * Saves an attendance record locally into an IndexedDB queue.
 */
export async function queueAttendanceOffline(payload: QueuedAttendancePayload): Promise<void> {
    try {
        await update(IDB_ATTENDANCE_QUEUE_KEY, (existingQueue: QueuedAttendancePayload[] | undefined) => {
            const queue = existingQueue || [];
            // If we already have a pending update for this exact class+cadet combo, replace it.
            // (e.g., they marked Present, then changed mind to Absent while still offline).
            const existingIndex = queue.findIndex(item => item.id === payload.id);
            if (existingIndex !== -1) {
                queue[existingIndex] = payload;
                return queue;
            }
            return [...queue, payload];
        });
    } catch (error) {
        console.error("Failed to queue attendance offline:", error);
    }
}

/**
 * Fetches the entire offline queue.
 */
export async function getOfflineAttendanceQueue(): Promise<QueuedAttendancePayload[]> {
    try {
        const queue = await get<QueuedAttendancePayload[]>(IDB_ATTENDANCE_QUEUE_KEY);
        return queue || [];
    } catch (error) {
        console.error("Failed to get offline queue:", error);
        return [];
    }
}

/**
 * Clears the offline queue (call this AFTER a successful sync).
 */
export async function clearOfflineQueue(): Promise<void> {
    try {
        await clear();
        // Alternative: we could just delete the specific key if we use IDB for other things
        // await set(IDB_ATTENDANCE_QUEUE_KEY, []);
    } catch (error) {
        console.error("Failed to clear offline queue:", error);
    }
}
