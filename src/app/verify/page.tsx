"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, CheckCircle2, XCircle, User, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { verifyCadetById, verifyCadetByToken, type VerifyResult } from "@/app/actions/verify-actions";
import { getColorOfTheDay } from "@/lib/utils";

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
    const token = searchParams.get("token");
    const [person, setPerson] = useState<VerifiedPerson | null>(null);
    const [loading, setLoading] = useState(() => !!id || !!token);
    const [checked, setChecked] = useState(() => !id && !token);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const dailyColor = getColorOfTheDay();

    useEffect(() => {
        if (!id && !token) return;

        let isMounted = true;
        
        const verificationPromise = token 
            ? verifyCadetByToken(token) 
            : verifyCadetById(id!);

        verificationPromise.then((result: VerifyResult) => {
            if (!isMounted) return;
            if (result.found && result.person) {
                setPerson(result.person);
            } else if (result.error) {
                setErrorMsg(result.error);
            }
            setLoading(false);
            setChecked(true);
        });

        return () => { isMounted = false; };
    }, [id, token]);

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
                        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 flex items-center space-x-3">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                            <div>
                                <h2 className="text-white font-bold text-lg">Identity Verified</h2>
                                <p className="text-green-100 text-xs font-medium">This NCC ID card is authentic and valid.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden border-2 border-primary/10">
                                    {person.avatarUrl ? (
                                        <Image src={person.avatarUrl} alt={person.name} width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-white/50" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">{person.name}</h3>
                                    <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase mt-1 border border-primary/20">
                                        {person.role}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                {person.regimentalNumber && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500 font-medium">
                                            <Award className="w-4 h-4 mr-2 text-primary/40" /> Regt. Number
                                        </span>
                                        <span className="font-mono font-bold text-gray-900">{person.regimentalNumber}</span>
                                    </div>
                                )}
                                {person.wing && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500 font-medium">
                                            <Shield className="w-4 h-4 mr-2 text-primary/40" /> NCC Wing
                                        </span>
                                        <span className="font-bold text-gray-900 uppercase">{person.wing}</span>
                                    </div>
                                )}
                                {person.unitNumber && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-500 font-medium">
                                            <User className="w-4 h-4 mr-2 text-primary/40" /> NCC Unit
                                        </span>
                                        <span className="font-bold text-gray-900">
                                            {person.unitNumber} {person.unitName || ""}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Sensitive data hidden for public - mention officer access */}
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-[10px] text-slate-500 leading-relaxed text-center italic">
                                        Sensitive medical and enrollment data is only visible to authorized ANO officers via the Unit Dashboard.
                                    </p>
                                </div>

                                {/* Security Protocol + Color of the Day */}
                                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-2 justify-center mb-1">
                                        <div className="w-3 h-3 rounded-full shrink-0 border border-amber-300" style={{ backgroundColor: dailyColor.hex }} />
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Today&apos;s Color: {dailyColor.name}</p>
                                    </div>
                                    <p className="text-[9px] text-amber-700 leading-relaxed text-center font-semibold">
                                        SECURITY: Match the person to the photo above. If they do not match, the ID is fraudulent.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Timestamp: {new Date().toLocaleString("en-IN")}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Not Found / Error Card */
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 flex items-center space-x-3">
                            <XCircle className="w-7 h-7 text-white" />
                            <div>
                                <h2 className="text-white font-bold text-lg">Unable to Verify</h2>
                                <p className="text-red-100 text-xs font-medium">Scanning failed or record not found.</p>
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Shield className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold">{errorMsg ? "Security Verification Failed" : "Record Not Found"}</h3>
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                                {errorMsg ? errorMsg : (id 
                                    ? "The ID provided in the scan does not match any current cadet or officer in our digital registry." 
                                    : "No verification ID was detected. Please ensure you are scanning a valid NCC RGU digital ID card.")}
                            </p>
                            
                            <Link 
                                href="/"
                                className="mt-6 inline-flex items-center justify-center px-6 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                Return to System Login
                            </Link>

                            <p className="text-[10px] text-gray-400 mt-6 uppercase font-black tracking-tighter">
                                If this persists, contact the unit ANO for manual verification.
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
