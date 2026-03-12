"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, CheckCircle2, XCircle, User, Award, Calendar } from "lucide-react";
import Image from "next/image";
import { verifyCadetById } from "@/app/actions/verify-actions";

interface VerifiedPerson {
    name: string;
    role: string;
    regimentalNumber?: string;
    wing?: string;
    unitNumber?: string;
    unitName?: string;
    bloodGroup?: string;
    enrollmentYear?: string;
    avatarUrl?: string;
}

function VerifyContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [person, setPerson] = useState<VerifiedPerson | null>(null);
    const [loading, setLoading] = useState(true);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setChecked(true);
            return;
        }

        let isMounted = true;
        verifyCadetById(id).then((result) => {
            if (!isMounted) return;
            if (result.found && result.person) {
                setPerson(result.person);
            }
            setLoading(false);
            setChecked(true);
        });

        return () => { isMounted = false; };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <p className="text-slate-400 animate-pulse">Verifying identity...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                        <Image src="/ncc-logo.png" alt="NCC" width={40} height={40} className="w-10 h-10 object-contain" />
                        <Image src="/rgu-logo.png" alt="RGU" width={40} height={40} className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-white text-xl font-bold tracking-tight">NCC RGU — ID Verification</h1>
                    <p className="text-slate-400 text-xs mt-1">The Assam Royal Global University • National Cadet Corps</p>
                </div>

                {checked && person ? (
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
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#002147] to-blue-900 flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden">
                                    {person.avatarUrl ? (
                                        <Image src={person.avatarUrl} alt={person.name} width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                        person.name?.charAt(0)
                                    )}
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
                                Verified at {new Date().toLocaleString("en-IN")} via NCC RGU Digital System
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
