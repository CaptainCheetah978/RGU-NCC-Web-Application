export function normalizeRegistrationNumber(value: string): string {
    return value.replace(/\s+/g, "").trim().toLowerCase();
}

export function getStableAuthEmail(regimentalNumber: string): string {
    return `reg_${normalizeRegistrationNumber(regimentalNumber)}@ncc.internal`;
}

export function getLoginUsername(regimentalNumber: string): string {
    const digits = regimentalNumber.replace(/\D/g, "");
    return digits.length >= 4 ? `C${digits.slice(-4)}` : "";
}

export function normalizeLoginUsername(value: string): string {
    return value.replace(/\s+/g, "").trim().toUpperCase();
}
