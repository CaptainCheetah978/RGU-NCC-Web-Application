import { describe, it, expect } from 'vitest';
import { Permissions, hasPermission } from '../src/lib/permissions';
import { Role } from '../src/types';

describe('Permissions Matrix', () => {
    it('should allow ANO to do everything except nothing', () => {
        expect(hasPermission(Role.ANO, Permissions.CAN_MANAGE_USERS)).toBe(true);
        expect(hasPermission(Role.ANO, Permissions.CAN_MANAGE_ATTENDANCE)).toBe(true);
        expect(hasPermission(Role.ANO, Permissions.CAN_MANAGE_CLASSES)).toBe(true);
        expect(hasPermission(Role.ANO, Permissions.CAN_POST_ANNOUNCEMENTS)).toBe(true);
        expect(hasPermission(Role.ANO, Permissions.CAN_VIEW_FULL_ROSTER)).toBe(true);
        expect(hasPermission(Role.ANO, Permissions.CAN_VIEW_ACTIVITY_LOG)).toBe(true);
    });

    it('should restrict Activity Log to ANO only', () => {
        const rolesToTest = [Role.CTO, Role.CSUO, Role.CJUO, Role.CSM, Role.CQMS, Role.SGT, Role.CPL, Role.LCPL, Role.CADET];
        rolesToTest.forEach(role => {
            expect(hasPermission(role, Permissions.CAN_VIEW_ACTIVITY_LOG)).toBe(false);
        });
    });

    it('should allow CTO and CSUO to manage users', () => {
        expect(hasPermission(Role.CTO, Permissions.CAN_MANAGE_USERS)).toBe(true);
        expect(hasPermission(Role.CSUO, Permissions.CAN_MANAGE_USERS)).toBe(true);
        expect(hasPermission(Role.CJUO, Permissions.CAN_MANAGE_USERS)).toBe(false);
        expect(hasPermission(Role.CADET, Permissions.CAN_MANAGE_USERS)).toBe(false);
    });

    it('should allow up to SGT to mark attendance and view roster', () => {
        const allowedRoles = [Role.ANO, Role.CTO, Role.CSUO, Role.CJUO, Role.CSM, Role.CQMS, Role.SGT];
        const restrictedRoles = [Role.CPL, Role.LCPL, Role.CADET];

        allowedRoles.forEach(role => {
            expect(hasPermission(role, Permissions.CAN_MANAGE_ATTENDANCE)).toBe(true);
            expect(hasPermission(role, Permissions.CAN_VIEW_FULL_ROSTER)).toBe(true);
        });

        restrictedRoles.forEach(role => {
            expect(hasPermission(role, Permissions.CAN_MANAGE_ATTENDANCE)).toBe(false);
            expect(hasPermission(role, Permissions.CAN_VIEW_FULL_ROSTER)).toBe(false);
        });
    });

    it('should allow up to CJUO to manage classes and announcements', () => {
        const allowedRoles = [Role.ANO, Role.CTO, Role.CSUO, Role.CJUO];
        const restrictedRoles = [Role.CSM, Role.CQMS, Role.SGT, Role.CPL, Role.LCPL, Role.CADET];

        allowedRoles.forEach(role => {
            expect(hasPermission(role, Permissions.CAN_MANAGE_CLASSES)).toBe(true);
            expect(hasPermission(role, Permissions.CAN_POST_ANNOUNCEMENTS)).toBe(true);
        });

        restrictedRoles.forEach(role => {
            expect(hasPermission(role, Permissions.CAN_MANAGE_CLASSES)).toBe(false);
            expect(hasPermission(role, Permissions.CAN_POST_ANNOUNCEMENTS)).toBe(false);
        });
    });
});
