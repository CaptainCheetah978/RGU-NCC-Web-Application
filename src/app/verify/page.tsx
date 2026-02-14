"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_USERS } from "@/lib/mock-data";
import { Shield, CheckCircle2, XCircle, User, Award, Calendar } from "lucide-react";

function VerifyContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    // Look up the user/cadet from mock data + localStorage
    let person: Record<string, string | undefined> | null = null;

    if (id && typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let merged: any = null;

        // 1. Check mock users as base
        const mockUser = MOCK_USERS.find(u => u.id === id);
        if (mockUser) {
            merged = { ...mockUser };
        }

        // 2. Override with localStorage cadets (has the latest edits)
        try {
            const storedCadets = localStorage.getItem("ncc_cadets");
            if (storedCadets) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cadet = JSON.parse(storedCadets).find((c: any) => c.id === id);
                if (cadet) {
                    merged = { ...(merged || {}), ...cadet };
                }
            }
        } catch { /* ignore */ }

        // 3. Override with extra user data (profile-level edits like avatar, blood group changes)
        try {
            const storedExtra = localStorage.getItem("ncc_extra_user_data");
            if (storedExtra) {
                const extras = JSON.parse(storedExtra);
                if (extras[id]) {
                    merged = { ...(merged || {}), ...extras[id] };
                }
            }
        } catch { /* ignore */ }

        if (merged) {
            person = {
                name: merged.name,
                role: merged.role,
                regimentalNumber: merged.regimentalNumber,
                wing: merged.wing,
                unitNumber: merged.unitNumber,
                unitName: merged.unitName,
                bloodGroup: merged.bloodGroup,
                enrollmentYear: merged.enrollmentYear?.toString(),
            };
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                        <img src="/ncc-logo.png" alt="NCC" className="w-10 h-10 object-contain" />
                        <img src="/rgu-logo.png" alt="RGU" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-white text-xl font-bold tracking-tight">NCC RGU — ID Verification</h1>
                    <p className="text-slate-400 text-xs mt-1">The Assam Royal Global University • National Cadet Corps</p>
                </div>

                {person ? (
                    /* Verified Card */
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center space-x-3">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                            <div>
                                <h2 className="text-white font-bold text-lg">Identity Verified</h2>
                                <p className="text-green-100 text-xs">This NCC ID card is authentic and valid.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#002147] to-blue-900 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                                    {person.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{person.name}</h3>
                                    <span className="inline-block px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase mt-1 border border-red-100">
                                        {person.role}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                {person.regimentalNumber && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500">
                                            <Award className="w-4 h-4 mr-2" /> Regt. Number
                                        </span>
                                        <span className="font-mono font-bold text-gray-900">{person.regimentalNumber}</span>
                                    </div>
                                )}
                                {person.wing && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500">
                                            <Shield className="w-4 h-4 mr-2" /> Wing
                                        </span>
                                        <span className="font-bold text-gray-900 uppercase">{person.wing}</span>
                                    </div>
                                )}
                                {person.unitNumber && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500">
                                            <User className="w-4 h-4 mr-2" /> Unit
                                        </span>
                                        <span className="font-bold text-gray-900">
                                            {person.unitNumber} {person.unitName || ""}
                                        </span>
                                    </div>
                                )}
                                {person.bloodGroup && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Blood Group</span>
                                        <span className="font-bold text-red-600">{person.bloodGroup}</span>
                                    </div>
                                )}
                                {person.enrollmentYear && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500">
                                            <Calendar className="w-4 h-4 mr-2" /> Enrollment
                                        </span>
                                        <span className="font-bold text-gray-900">{person.enrollmentYear}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-3 text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                Verified at {new Date().toLocaleString("en-IN")} • NCC RGU Digital System
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Not Found Card */
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4 flex items-center space-x-3">
                            <XCircle className="w-7 h-7 text-white" />
                            <div>
                                <h2 className="text-white font-bold text-lg">Verification Failed</h2>
                                <p className="text-red-100 text-xs">This ID could not be verified in our system.</p>
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">No cadet or officer found for this ID.</p>
                            <p className="text-gray-400 text-sm mt-2">
                                {id ? `ID: ${id}` : "No ID was provided in the scan."}
                            </p>
                            <p className="text-xs text-gray-400 mt-4">
                                If you believe this is an error, please contact the ANO at RGU NCC.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <p className="text-slate-400 animate-pulse">Verifying identity...</p>
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
