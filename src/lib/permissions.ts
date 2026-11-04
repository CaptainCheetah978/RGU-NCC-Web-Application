import { Role } from "@/types";

export const Permissions = {
    // CTO is staff-level: above cadet leadership operationally, below ANO.
    // Only ANO may delete profiles or manage the activity-log authority.
    CAN_MANAGE_USERS: new Set([Role.ANO, Role.CTO, Role.CSUO]),
    CAN_MANAGE_ATTENDANCE: new Set([Role.ANO, Role.CTO, Role.CSUO, Role.CJUO, Role.CWO, Role.CSM, Role.CQMS, Role.SGT]),
    CAN_MANAGE_CLASSES: new Set([Role.ANO, Role.CTO, Role.CSUO, Role.CJUO, Role.CWO]),
    CAN_POST_ANNOUNCEMENTS: new Set([Role.ANO, Role.CTO, Role.CSUO, Role.CJUO, Role.CWO]),
    CAN_VIEW_FULL_ROSTER: new Set([Role.ANO, Role.CTO, Role.CSUO, Role.CJUO, Role.CWO, Role.CSM, Role.CQMS, Role.SGT]),
    CAN_VIEW_ACTIVITY_LOG: new Set([Role.ANO, Role.CTO]),
} as const;

export function hasPermission(role: Role, permissionSet: Set<Role>): boolean {
    return permissionSet.has(role);
}
