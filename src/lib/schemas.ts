/**
 * Shared Zod schemas — used by both client-side form validation and
 * server-side Server Action validation so the same rules apply in both places.
 */
import { z } from "zod";

// ─── Primitives ────────────────────────────────────────────────────────────────

const RoleEnum = z.enum(["ANO", "SUO", "UO", "SGT", "CPL", "LCPL", "CADET"]);
const WingEnum = z.enum(["Army", "Air", "Navy"]);
const GenderEnum = z.enum(["Male", "Female"]);

// PIN: 4-12 characters, digits or alphanumeric
const PinSchema = z
    .string()
    .min(4, "PIN must be at least 4 characters")
    .max(12, "PIN must be at most 12 characters")
    .regex(/^[a-zA-Z0-9]+$/, "PIN must only contain letters and numbers");

// ─── Cadet Creation ────────────────────────────────────────────────────────────

export const CreateCadetSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name must be at most 80 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes"),
    regimentalNumber: z
        .string()
        .min(1, "Regimental number is required")
        .max(20, "Regimental number too long"),
    rank: RoleEnum,
    wing: WingEnum,
    gender: GenderEnum,
    unitNumber: z
        .string()
        .min(1, "Unit number is required")
        .max(10, "Unit number too long"),
    unitName: z
        .string()
        .min(1, "Unit name is required")
        .max(80, "Unit name too long"),
    enrollmentYear: z
        .number()
        .int()
        .min(2000, "Enrollment year must be 2000 or later")
        .max(new Date().getFullYear() + 1, "Enrollment year is in the future"),
    bloodGroup: z
        .string()
        .regex(/^(A|B|AB|O)[+-]$/, "Invalid blood group format")
        .optional()
        .or(z.literal("")),
    pin: PinSchema,
});

export type CreateCadetInput = z.infer<typeof CreateCadetSchema>;

// ─── PIN Update ────────────────────────────────────────────────────────────────

export const UpdatePinSchema = z.object({
    cadetId: z.string().uuid("Invalid cadet ID"),
    newPin: PinSchema,
});

export type UpdatePinInput = z.infer<typeof UpdatePinSchema>;

// ─── Note ──────────────────────────────────────────────────────────────────────

export const NoteIdSchema = z.object({
    noteId: z.string().uuid("Invalid note ID"),
});

// ─── Attendance ────────────────────────────────────────────────────────────────

export const AttendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export const MarkAttendanceSchema = z.object({
    classId: z.string().uuid("Invalid class ID"),
    cadetId: z.string().uuid("Invalid cadet ID"),
    status: AttendanceStatusEnum,
});

export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
