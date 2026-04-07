import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Role, Wing } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a deterministic "Color of the Day" for visual security proofing.
 * Same color for all users on the same calendar day.
 * In production, the seed should come from a server-side env var.
 */
export function getColorOfTheDay(): { name: string; hex: string } {
  const colors = [
    { name: "Crimson", hex: "#E31837" },
    { name: "Royal Blue", hex: "#1D2951" },
    { name: "Emerald", hex: "#059669" },
    { name: "Amber", hex: "#D97706" },
    { name: "Purple", hex: "#7C3AED" },
    { name: "Teal", hex: "#0D9488" },
    { name: "Rose", hex: "#E11D48" },
  ];
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return colors[dayOfYear % colors.length];
}

/**
 * Transforms an underlying database rank into its Wing-appropriate title.
 */
export function getWingAwareRank(rank: Role, wing?: Wing): string {
    // Air Force mapping
    if (wing === Wing.AIR) {
        switch (rank) {
            case Role.CJUO:
                return "CUO"; // Cadet Under Officer
            case Role.CWO:
                return "CWO"; // Cadet Warrant Officer
            case Role.LCPL:
                return "LFC"; // Leading Flight Cadet
            default:
                return rank;
        }
    }
    
    // Navy mapping
    if (wing === Wing.NAVY) {
        switch (rank) {
            case Role.CSUO:
                return "SCC"; // Senior Cadet Captain
            case Role.CJUO:
                return "CC"; // Cadet Captain
            case Role.CSM:
            case Role.CQMS:
                return "CPO"; // Cadet Petty Officer
            case Role.SGT:
                return "PO CADET"; // Petty Officer Cadet
            case Role.CPL:
                return "LEADING CADET"; 
            case Role.LCPL:
                return "ABLE CADET"; 
            default:
                return rank;
        }
    }

    // Army (Default) - Keep standard CSUO/CJUO labels
    return rank;
}

/**
 * Returns the official NCC classification for a given gender.
 */
export function getGenderClassification(gender: string | null | undefined): string {
    const g = String(gender || "").toLowerCase();
    return g === 'male' || g === 'sd' ? "Senior Division (SD)" : "Senior Wing (SW)";
}

/**
 * Returns the official NCC abbreviation for a given gender.
 */
export function getGenderAbbreviation(gender: string | null | undefined): string {
    const g = String(gender || "").toLowerCase();
    return g === 'male' || g === 'sd' ? "SD" : "SW";
}
