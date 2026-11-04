export function normalizeRegistrationNumber(value: string): string {
    return value.replace(/\s+/g, "").trim().toLowerCase();
}

export function getStableAuthEmail(regimentalNumber: string): string {
    return `reg_${normalizeRegistrationNumber(regimentalNumber)}@ncc.internal`;
}
