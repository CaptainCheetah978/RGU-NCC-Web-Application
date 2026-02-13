import { Role, User } from "@/types";

export const MOCK_USERS: User[] = [
    {
        id: "ano-1",
        name: "Capt. Sharma",
        role: Role.ANO,
        regimentalNumber: "NCC/ANO/2020/001",
    },
    {
        id: "suo-1",
        name: "SUO Rahul Singh",
        role: Role.SUO,
        regimentalNumber: "AS/20/SD/10001",
    },
    {
        id: "uo-1",
        name: "UO Priya Das",
        role: Role.UO,
        regimentalNumber: "AS/20/SW/10002",
    },
    {
        id: "sgt-1",
        name: "Sgt. Amit Kumar",
        role: Role.SGT,
        regimentalNumber: "AS/21/SD/10005",
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
