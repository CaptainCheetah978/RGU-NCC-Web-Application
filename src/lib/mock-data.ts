import { Role, User } from "@/types";

export const MOCK_USERS: User[] = [
    {
        id: "ano-1",
        name: "Lt. Dr KM Sudha",
        role: Role.ANO,
        regimentalNumber: "NCC/ANO/2024/001",
        pin: "0324",
    },
    {
        id: "suo-1",
        name: "SUO Aditya Singh",
        role: Role.SUO,
        regimentalNumber: "AS/20/SD/10001",
        pin: "3489",
    },
    {
        id: "suo-2",
        name: "SUO Gargi Sharma",
        role: Role.SUO,
        regimentalNumber: "AS/20/SW/10002",
        pin: "3489",
    },
    {
        id: "sgt-1",
        name: "Sgt. Deepjyoti Talkudar",
        role: Role.SGT,
        regimentalNumber: "AS/21/SD/10005",
        pin: "5698",
    },
    {
        id: "sgt-2",
        name: "Sgt. Thiyam Bindiya Devi",
        role: Role.SGT,
        regimentalNumber: "AS/21/SW/10006",
        pin: "5698",
    },
    {
        id: "cdt-1",
        name: "Cdt. Rohini Roy",
        role: Role.CADET,
        regimentalNumber: "AS/22/SW/10010",
    },
];

export const MOCK_CLASSES = [
    {
        id: "cls-1",
        title: "Drill Practice - Morning",
        date: "2023-10-25",
        time: "06:00 AM",
        instructorId: "suo-1",
        attendees: [],
    },
    {
        id: "cls-2",
        title: "Weapon Training Theory",
        date: "2023-10-25",
        time: "10:00 AM",
        instructorId: "ano-1",
        attendees: [],
    },
];
