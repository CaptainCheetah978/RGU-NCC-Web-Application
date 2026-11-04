"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, CheckCircle2, XCircle, User, Award, Camera, CameraOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { verifyCadetByToken, type VerifyResult } from "@/app/actions/verify-actions";
import { cn, getColorOfTheDay, getWingAwareRank, getGenderClassification } from "@/lib/utils";
import { Wing, Role } from "@/types";
import QrScanner from "qr-scanner";

type BarcodeDetectorLike = {
    detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

declare global {
    interface Window {
        BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
    }
}

interface VerifiedPerson {
    name: string;
    role: string;
    gender?: string;
    regimentalNumber?: string;
    unitNumber?: string;
    unitName?: string;
    bloodGroup?: string;
    enrollmentYear?: string;
    avatarUrl?: string;
    wing?: Wing;
}



function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [person, setPerson] = useState<VerifiedPerson | null>(null);
    const [loading, setLoading] = useState(() => !!token);
    const [checked, setChecked] = useState(() => !token);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerError, setScannerError] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const dailyColor = getColorOfTheDay();

    const stopScanner = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        qrScannerRef.current?.destroy();
        qrScannerRef.current = null;
        setScannerOpen(false);
    }, []);

    const verifyScannedValue = useCallback((rawValue: string) => {
        try {
            const scannedUrl = new URL(rawValue);
            const scannedToken = scannedUrl.searchParams.get("token");
            if (scannedToken) {
                window.history.replaceState({}, "", `/verify?token=${encodeURIComponent(scannedToken)}`);
                stopScanner();
                setLoading(true);
                setChecked(false);
                setErrorMsg("");
                verifyCadetByToken(scannedToken).then((result) => {
                    if (result.found && result.person) setPerson(result.person as unknown as VerifiedPerson);
                    else setErrorMsg(result.error || "Unable to verify scanned QR code.");
                    setLoading(false);
                    setChecked(true);
                });
                return;
            }
        } catch {
            // A raw JWT is also accepted below.
        }

        if (rawValue.split(".").length === 3) {
            stopScanner();
            setLoading(true);
            setChecked(false);
            setErrorMsg("");
            verifyCadetByToken(rawValue).then((result) => {
                if (result.found && result.person) setPerson(result.person as unknown as VerifiedPerson);
                else setErrorMsg(result.error || "Unable to verify scanned QR code.");
                setLoading(false);
                setChecked(true);
            });
            return;
        }

        setScannerError("This QR code is not an NCC verification code.");
    }, [stopScanner]);

    const startScanner = async () => {
        setScannerError("");
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            setScannerError("Camera scanning requires HTTPS and a supported mobile browser.");
            return;
        }
        try {
            if (window.BarcodeDetector) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
                streamRef.current = stream;
            }
            setScannerOpen(true);
        } catch {
            setScannerError("Camera access was denied. Allow camera access or open the QR link directly.");
        }
    };

    useEffect(() => {
        if (!scannerOpen || !videoRef.current) return;
        let cancelled = false;
        const video = videoRef.current;

        if (!window.BarcodeDetector) {
            const scanner = new QrScanner(
                video,
                (result) => verifyScannedValue(result.data),
                {
                    preferredCamera: "environment",
                    maxScansPerSecond: 4,
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                    returnDetailedScanResult: true,
                },
            );
            qrScannerRef.current = scanner;
            void scanner.start().catch(() => {
                if (!cancelled) setScannerError("Unable to start the camera. Open the QR link directly if camera scanning is unavailable.");
            });
            return () => {
                cancelled = true;
                scanner.destroy();
                qrScannerRef.current = null;
            };
        }

        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        video.srcObject = streamRef.current;

        const scan = async () => {
            if (cancelled) return;
            try {
                const results = await detector.detect(video);
                if (results[0]?.rawValue) {
                    verifyScannedValue(results[0].rawValue);
                    return;
                }
            } catch {
                // Continue polling while the camera is active.
            }
            if (!cancelled) window.setTimeout(scan, 250);
        };

        void video.play().then(scan).catch(() => {
            setScannerError("Unable to start the camera preview.");
        });
        return () => {
            cancelled = true;
        };
    }, [scannerOpen, verifyScannedValue]);

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        qrScannerRef.current?.destroy();
    }, []);

    useEffect(() => {
        if (!scannerOpen) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") stopScanner();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [scannerOpen, stopScanner]);

    useEffect(() => {
        if (!token) return;

        let isMounted = true;
        
        const verificationPromise = verifyCadetByToken(token);

        verificationPromise.then((result: VerifyResult) => {
            if (!isMounted) return;
            if (result.found && result.person) {
                setPerson(result.person as unknown as VerifiedPerson);
            } else if (result.error) {

                setErrorMsg(result.error);
            }
            setLoading(false);
            setChecked(true);
        });

        return () => { isMounted = false; };
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
                <p className="text-slate-400 animate-pulse">Verifying identity...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                        <Image src="/ncc-logo.png" alt="NCC" width={40} height={40} className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-white text-xl font-bold tracking-tight">NCC — Digital ID Verification</h1>
                    <p className="text-slate-400 text-xs mt-1">National Cadet Corps • Digital Identity Verification</p>
                </div>

                {checked && person ? (
                    /* Verified Card */
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className={cn(
                            "px-6 py-4 flex items-center space-x-3 transition-colors duration-500",
                            person.wing === Wing.NAVY ? "bg-[#002147]" : 
                            person.wing === Wing.AIR ? "bg-sky-400" : 
                            "bg-gradient-to-r from-emerald-600 to-emerald-800"
                        )}>
                            <CheckCircle2 className={cn(
                                "w-7 h-7",
                                person.wing === Wing.AIR ? "text-slate-900" : "text-white"
                            )} />
                            <div>
                                <h2 className={cn(
                                    "font-bold text-lg",
                                    person.wing === Wing.AIR ? "text-slate-900" : "text-white"
                                )}>Identity Verified</h2>
                                <p className={cn(
                                    "text-xs font-medium",
                                    person.wing === Wing.NAVY ? "text-blue-100" : 
                                    person.wing === Wing.AIR ? "text-sky-900" : 
                                    "text-emerald-100"
                                )}>This NCC ID card is authentic and valid.</p>
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
                                        {getWingAwareRank(person.role as Role, person.wing as Wing)}
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
                                        <span className="font-bold text-gray-900 uppercase">
                                            {person.wing} - {getGenderClassification(person.gender)}
                                        </span>
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
                ) : errorMsg || token ? (
                    /* Verification Error Card */
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
                                {errorMsg || "No valid signed verification token was detected. Please scan a current NCC digital ID card."}
                            </p>
                            
                            <button
                                type="button"
                                onClick={() => void startScanner()}
                                className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                <Camera className="w-4 h-4" />
                                Scan ID Card QR
                            </button>

                            {scannerError && (
                                <p className="mt-3 text-xs font-medium text-red-600">{scannerError}</p>
                            )}

                            <Link 
                                href="/"
                                className="mt-3 inline-flex items-center justify-center px-6 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Return to System Login
                            </Link>

                            <p className="text-[10px] text-gray-400 mt-6 uppercase font-black tracking-tighter">
                                Only signed NCC QR tokens are accepted. If this persists, contact the unit ANO.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Welcome Card */
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                                <Shield className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Welcome to NCC Verification</h2>
                            <p className="mt-1 text-sm text-blue-100">Quickly confirm an NCC digital ID card</p>
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-lg font-bold text-gray-900">Verify an ID card securely</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                Scan the QR code shown on a current NCC digital ID card. The verification checks its secure signature and validity.
                            </p>

                            <button
                                type="button"
                                onClick={() => void startScanner()}
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                            >
                                <Camera className="h-5 w-5" />
                                Scan ID Card QR
                            </button>

                            {scannerError && (
                                <p className="mt-3 text-xs font-medium text-red-600">{scannerError}</p>
                            )}

                            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
                                <p className="text-xs font-bold text-blue-900">For a smooth scan</p>
                                <p className="mt-1 text-xs leading-relaxed text-blue-800">
                                    Allow camera access, use good lighting, and hold the QR code steady inside the frame.
                                </p>
                            </div>

                            <Link
                                href="/"
                                className="mt-5 inline-flex items-center justify-center px-6 py-2 text-xs font-bold text-slate-600 transition-colors hover:text-primary"
                            >
                                Return to System Login
                            </Link>
                        </div>
                    </div>
                )}

                {scannerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/90 px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                <div>
                                    <h2 className="font-bold text-slate-900">Scan NCC ID Card</h2>
                                    <p className="text-xs text-slate-500">Align the QR code inside the frame.</p>
                                </div>
                                <button type="button" onClick={stopScanner} aria-label="Close scanner" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                                    <CameraOff className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="relative aspect-square bg-black">
                                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                                <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
                            </div>
                            {scannerError && <p className="px-4 py-3 text-xs font-medium text-red-600">{scannerError}</p>}
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
