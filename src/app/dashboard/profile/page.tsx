"use client";

import { useAuth } from "@/lib/auth-context";
import { useCadetData } from "@/lib/cadet-context";
import { useDashboardStats } from "@/lib/dashboard-stats";
import { supabase } from "@/lib/supabase-client";
import { getColorOfTheDay, getWingAwareRank, getGenderAbbreviation } from "@/lib/utils";
import { generateVerificationToken } from "@/app/actions/jwt-actions";
import { Role, Wing, User, Cadet } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Camera, Award, Calendar, Shield, Info, Download, Printer, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { AttendanceHistory } from "@/components/profile/attendance-history";
import { CertificatesSection } from "@/components/profile/certificates-section";
import { PageLoader } from "@/components/ui/page-loader";
import Image from "next/image";

export default function ProfilePage() {
    const { user, updatePin, isLoading: isAuthLoading, unitBranding } = useAuth();
    const { updateCadet, currentUserProfile, isLoading: isDataLoading } = useCadetData();
    const getStats = useDashboardStats();

    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const idCardRef = useRef<HTMLDivElement>(null);
    const [changePinData, setChangePinData] = useState({ newPin: "", confirmPin: "" });
    const [changePinLoading, setChangePinLoading] = useState(false);
    const [changePinError, setChangePinError] = useState("");
    const [changePinSuccess, setChangePinSuccess] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [qrToken, setQrToken] = useState<string>("");
    const [isStaticQR, setIsStaticQR] = useState(false);
    const [hasEverLoaded, setHasEverLoaded] = useState(false);

    // Track whether the user has been loaded at least once
    useEffect(() => {
        if (user) {
            setHasEverLoaded(true);
        }
    }, [user]);

    // Dynamic QR: Fetch a short-lived, signed JWT every 25 seconds
    // NOTE: Only depends on currentUserProfile?.id (a stable string), NOT the user object.
    // Using the user object here caused the interval to reset every 2-3s due to reference changes.
    useEffect(() => {
        if (!currentUserProfile?.id) return;

        let isMounted = true;
        
        const fetchQrToken = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await generateVerificationToken(currentUserProfile.id, session?.access_token);
                if (res.token && isMounted) {
                    setQrToken(res.token);
                }
            } catch (err) {
                console.error("Failed to refresh dynamic QR", err);
            }
        };

        fetchQrToken(); // Initial fetch
        const tokenInterval = setInterval(fetchQrToken, 25000); // Refresh every 25s

        return () => {
            isMounted = false;
            clearInterval(tokenInterval);
        };
    }, [currentUserProfile?.id]);

    // Live ticking clock for visual liveness (defeats static screenshots)
    useEffect(() => {
        const tick = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-IN', {
                hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
            }));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    if (isAuthLoading || (isDataLoading && !currentUserProfile)) {
        return <PageLoader />;
    }
    
    // Get the most up-to-date user data directly from context
    const currentUser = currentUserProfile as (User & Partial<Cadet>);
    const stats = getStats();
    const dailyColor = getColorOfTheDay();

    if (!currentUser) return <div className="p-8 text-center">Loading profile...</div>;

    // Helper function to format unit name for display
    const getFormattedUnit = (wing: Wing | undefined, unitNumber: string | undefined, unitName?: string): string => {
        if (unitBranding) return unitBranding.name;
        if (!unitNumber) return "NCC Unit, RGU";
        const name = unitName || (wing === Wing.ARMY ? "Assam BN NCC" : wing === Wing.AIR ? "Assam Air Sqn NCC" : "Assam Naval Unit NCC");
        return `${unitNumber} ${name}`;
    };

    const handlePhotoUploadClick = () => {
        setIsDisclaimerOpen(true);
    };

    const handleDisclaimerConfirm = () => {
        setIsDisclaimerOpen(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if ((isAuthLoading || isDataLoading) && !hasEverLoaded) return;
        if (!file || !user) return;

        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setUploadError("Image must be under 2MB.");
            return;
        }

        setUploadError("");
        setUploadSuccess(false);
        setIsUploading(true);

        try {
            // Try Supabase Storage first
            const ext = file.name.split(".").pop();
            const path = `${user.id}/avatar.${ext}`;

            const { error: uploadErr } = await supabase.storage
                .from("avatars")
                .upload(path, file, { upsert: true });

            if (!uploadErr) {
                // Storage upload worked — use public URL (never expires, unlike signed URLs)
                const { data: publicData } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(path);

                if (publicData?.publicUrl) {
                    await updateCadet(user.id, { avatarUrl: publicData.publicUrl });
                    setUploadSuccess(true);
                    return;
                }
            }

            // Fallback: store as base64 directly (works without storage bucket)
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target?.result as string;
                try {
                    await updateCadet(user.id, { avatarUrl: base64 });
                    setUploadSuccess(true);
                } catch (err: unknown) {
                    setUploadError(err instanceof Error ? err.message : "Save failed.");
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(file);
            return; // setIsUploading handled inside reader.onload

        } catch (err: unknown) {
            console.error("Upload error:", err);
            setUploadError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!idCardRef.current || !currentUser?.id) return;
        setIsDownloading(true);
        setIsStaticQR(true); // Switch to stable ID-based QR for download
        
        // iOS Safari Compatibility: We must open the window synchronously in the click handler 
        // to bypass the popup blocker, as the subsequent 'await' makes the context asynchronous.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        let iosWin: Window | null = null;
        if (isIOS) {
            iosWin = window.open('about:blank', '_blank');
            if (iosWin) {
                iosWin.document.write('<p style="font-family:sans-serif; text-align:center; margin-top:50px;">Generating High-Res ID Snapshot...</p>');
            }
        }

        try {
            // Short delay to let state update and fonts/images settle
            await new Promise(r => setTimeout(r, 250));
            const dataUrl = await toPng(idCardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: '#ffffff',
                // Explicit canvas sizing prevents edge clipping on Android
                canvasWidth: idCardRef.current.offsetWidth * 3,
                canvasHeight: idCardRef.current.offsetHeight * 3,
            });
            const link = document.createElement("a");
            link.download = `NCC_ID_${currentUser.name.replace(/\s+/g, "_")}.png`;
            link.href = dataUrl;

            if (isIOS && iosWin) {
                // Populate the pre-opened window
                iosWin.document.body.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; padding:20px; box-sizing:border-box;">
                        <img src="${dataUrl}" style="max-width:100%; height:auto; box-shadow:0 20px 50px rgba(0,0,0,0.2); border-radius:20px;" alt="NCC ID">
                        <p style="margin-top:24px; font-weight:bold; color:#1D2951; text-align:center;">LONG PRESS THE IMAGE ABOVE<br>TO SAVE TO PHOTOS</p>
                        <button onclick="window.close()" style="margin-top:32px; padding:12px 24px; background:#1D2951; color:white; border:none; border-radius:12px; font-weight:bold;">Close Window</button>
                    </div>
                `;
                iosWin.document.title = "Save NCC ID Card";
            } else {
                link.click();
            }
        } catch (err) {
            console.error("Failed to download ID card:", err);
            if (iosWin) iosWin.close();
        } finally {
            setIsStaticQR(false); // Revert to dynamic JWT QR
            setIsDownloading(false);
        }
    };

    const handlePrint = async () => {
        if (!idCardRef.current || !currentUser?.id) return;
        setIsPrinting(true);
        setIsStaticQR(true); // Switch to stable ID-based QR for print
        try {
            // Wait for re-render with static QR
            await new Promise(r => setTimeout(r, 250));
            // Snapshot the wrapper to keep the white background and rounded corners
            const dataUrl = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });

            const printRoot = document.createElement("div");
            printRoot.id = "print-root";
            printRoot.style.position = "absolute";
            printRoot.style.top = "0";
            printRoot.style.left = "0";
            printRoot.style.width = "100%";
            printRoot.style.minHeight = "100vh";
            printRoot.style.backgroundColor = "white";
            printRoot.style.zIndex = "999999";
            printRoot.style.display = "flex";
            printRoot.style.justifyContent = "center";
            printRoot.style.alignItems = "flex-start";
            printRoot.style.paddingTop = "20px";

            const img = document.createElement("img");
            img.src = dataUrl;
            img.style.maxWidth = "100%";
            img.onload = () => {
                // Wait for image render before printing
                // Increased delay for iOS Safari to ensure the image buffer is fully ready
                setTimeout(() => {
                    try {
                        window.print();
                    } catch (e) {
                        console.error("Print failed", e);
                    }
                    
                    // Cleanup
                    if (document.body.contains(printRoot)) {
                        document.body.removeChild(printRoot);
                    }
                    setIsPrinting(false);
                }, 250);
            };

            printRoot.appendChild(img);
            document.body.appendChild(printRoot);
        } catch (err) {
            console.error("Failed to print ID card:", err);
        } finally {
            setIsStaticQR(false); // Revert to dynamic JWT QR
            setIsPrinting(false);
        }
    };

    const handleChangePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangePinError("");
        setChangePinSuccess(false);
        if (changePinData.newPin !== changePinData.confirmPin) {
            setChangePinError("PINs do not match.");
            return;
        }
        if (changePinData.newPin.length < 4) {
            setChangePinError("PIN must be at least 4 characters.");
            return;
        }
        setChangePinLoading(true);
        try {
            await updatePin(changePinData.newPin);
            setChangePinSuccess(true);
            setChangePinData({ newPin: "", confirmPin: "" });
        } catch (err: unknown) {
            setChangePinError(err instanceof Error ? err.message : "Failed to update PIN.");
        } finally {
            setChangePinLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12 print:p-0">
            <style jsx global>{`
                @media print {
                    /* Rock-Solid Single-Image Print Hack */
                    /* NextJS apps often break if visibility/display is toyed with deeply */
                    /* We append a #print-root holding the image snapshot to body for print. */
                    body > *:not(#print-root) {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    @page {
                        margin: 10mm;
                        size: auto;
                    }
                }
            `}</style>

            <div className="no-print">
                <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">My Profile</h1>
                <p className="text-gray-800 dark:text-slate-300 mt-1 font-bold italic">Manage your official NCC records and digital identity.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <Card className="lg:col-span-1 border-gray-200 no-print">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="relative group mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-4xl font-bold text-white relative">
                                {currentUser.avatarUrl ? (
                                    <Image src={currentUser.avatarUrl} alt={currentUser.name} fill sizes="128px" className="object-cover" />
                                ) : (
                                    currentUser.name.charAt(0)
                                )}
                            </div>
                            <button
                                onClick={handlePhotoUploadClick}
                                disabled={isUploading}
                                aria-label="Upload Profile Photo"
                                className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition-all border-4 border-white disabled:opacity-60"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5" />}
                            </button>
                        </div>
                        {uploadSuccess && (
                            <p className="text-green-600 text-xs font-semibold flex items-center gap-1 -mt-3 mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Photo saved!
                            </p>
                        )}
                        {uploadError && (
                            <p className="text-red-500 text-xs font-semibold -mt-3 mb-1 max-w-[200px] text-center">{uploadError}</p>
                        )}

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
                        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border border-red-100">
                            {currentUser.role}
                        </span>

                        <div className="mt-8 w-full space-y-4">
                            <div className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-slate-700/40 rounded-xl">
                                <div className="flex items-center text-gray-800 dark:text-slate-300 font-black">
                                    <Award className="w-4 h-4 mr-2" />
                                    <span>Regt. Number</span>
                                </div>
                                <span className="font-mono font-black text-gray-900 dark:text-white">{currentUser.regimentalNumber || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-slate-700/40 rounded-xl">
                                <div className="flex items-center text-gray-800 dark:text-slate-300 font-black">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Attendance</span>
                                </div>
                                <span className="font-black text-primary">{stats.attendanceRateValue}</span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Digital ID Card Display */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-gray-200 overflow-hidden shadow-2xl">
                        <CardHeader className="bg-gray-50 dark:bg-slate-900/30 border-b border-gray-200 dark:border-slate-700/60 flex flex-row items-center justify-between no-print">
                            <CardTitle className="text-lg flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-primary" />
                                Digital NCC ID Card
                            </CardTitle>
                            <div className="flex space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 text-[10px] font-bold uppercase ${isDownloading ? "animate-pulse" : ""}`}
                                    onClick={handleDownload}
                                    disabled={isDownloading || isPrinting}
                                >
                                    <Download className="w-3 h-3 mr-1" /> {isDownloading ? "Processing..." : "Download"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 text-[10px] font-bold uppercase ${isPrinting ? "animate-pulse" : ""}`}
                                    onClick={handlePrint}
                                    disabled={isDownloading || isPrinting}
                                >
                                    <Printer className="w-3 h-3 mr-1" /> {isPrinting ? "Processing..." : "Print"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-10 flex justify-center bg-gray-100/50 dark:bg-slate-900/30 overflow-x-auto w-full custom-scrollbar">
                            {/* The Official ID Card Component */}
                            <div className="print-container min-w-max flex justify-center py-2 px-2">
                                {/* We keep the ID Card fixed at 500x312 so the internal layout never breaks. The parent will naturally scroll horizontally on small screens. For PWA, we add a mobile scale trick via inline styles that gracefully scales down on < 500px screens */}
                                <div className="pwa-scale-wrapper">
                                    {/* Wrapping outer container specifically to be snapshotted with beautiful white padding, shadows, and rounded corners! */}
                                    <div ref={idCardRef} className="bg-white p-6 shrink-0 flex items-center justify-center rounded-3xl">
                                        <div className="w-[500px] h-[312px] shrink-0 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50 relative overflow-hidden flex flex-col p-px ring-1 ring-gray-900/5">
                                            {/* Digital Watermark - SUO Aditya Singh, NER Dte. */}
                                            <div className="absolute bottom-1 right-1 z-[40] opacity-[0.03] pointer-events-none select-none no-print">
                                                <p className="text-[5px] font-black text-black uppercase tracking-tighter leading-none">
                                                    Auth: SUO Aditya Singh, NER Dte.
                                                </p>
                                            </div>

                                            {/* Holographic shimmer overlay — visual liveness, defeats screenshots */}
                                            <div className="id-shimmer absolute inset-0 z-[16] pointer-events-none rounded-2xl overflow-hidden" />

                                            {/* Side decorative border - Ensure it's at the absolute front with no gaps */}
                                            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-red-600 via-white to-blue-800 z-30" />

                                            {/* Header Section */}
                                            <div className="p-1 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 relative z-10 pl-8">
                                                <div className="w-11 h-11 flex items-center justify-center">
                                                    <Image 
                                                        src={unitBranding?.logo_url || "/ncc-logo.png"} 
                                                        width={44} 
                                                        height={44} 
                                                        className="object-contain" 
                                                        alt="Unit Logo" 
                                                    />
                                                </div>
                                                <div className="text-center flex-1 mx-4">
                                                    <h3 className="text-[13px] font-extrabold text-[#002147] leading-tight uppercase tracking-tight">
                                                        {unitBranding?.institution_name || "The Assam Royal Global University"}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-red-700 tracking-[0.2em] leading-tight uppercase mt-0.5">National Cadet Corps</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 pr-2">
                                                    <Image 
                                                        src={unitBranding?.secondary_logo_url || "/rgu-logo.png"} 
                                                        width={44} 
                                                        height={44} 
                                                        className="w-11 h-11 object-contain" 
                                                        alt="Institution Logo" 
                                                    />
                                                    {/* Ticking clock — visual liveness proof */}
                                                    {currentTime && (
                                                        <span className="text-[8px] font-mono font-black text-gray-500 tracking-tight leading-none whitespace-nowrap">{currentTime}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Body Section */}
                                            <div className="flex-1 px-5 py-2 flex items-center overflow-hidden pl-10 relative z-10">
                                                {/* Photo Area */}
                                                <div className="w-28 h-28 border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center mr-5 shrink-0 shadow-sm relative ring-4 ring-white">
                                                    {currentUser.avatarUrl ? (
                                                        <Image src={currentUser.avatarUrl} alt={currentUser.name} fill sizes="112px" className="object-cover" />
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <Camera className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                                            <p className="text-[9px] text-gray-600 font-bold uppercase">No Photo</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info Area - Unified Grid for absolute uniform spacing */}
                                                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-6">
                                                    {/* Name Row */}
                                                    <div className="relative pt-2.5 col-span-2">
                                                        <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest absolute top-0 left-0 leading-none">Full Name</p>
                                                        <p className="text-[14px] font-bold text-gray-900 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.name}</p>
                                                    </div>

                                                    {/* Rank & Regt No Row */}
                                                    <div className="relative pt-2.5">
                                                        <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest absolute top-0 left-0 leading-none">Rank</p>
                                                        <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-none uppercase">{getWingAwareRank(currentUser.role, currentUser.wing)}</p>
                                                    </div>
                                                    <div className="relative pt-2.5">
                                                        <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest absolute top-0 left-0 leading-none">Regt. No</p>
                                                        <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.regimentalNumber || "N/A"}</p>
                                                    </div>

                                                    {/* Wing & Blood Group Row */}
                                                    <div className="relative pt-2.5">
                                                        <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest absolute top-0 left-0 leading-none">Wing</p>
                                                        <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.wing ? `${currentUser.wing} (${getGenderAbbreviation(currentUser.gender)})` : "N/A"}</p>
                                                    </div>
                                                    <div className="relative pt-2.5">
                                                        <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest absolute top-0 left-0 leading-none">Blood Group</p>
                                                        <p className="text-[11px] font-bold text-red-700 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.bloodGroup || "N/A"}</p>
                                                    </div>

                                                    {/* Unit Name Row */}
                                                    <div className="relative pt-2.5 col-span-2">
                                                        <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest absolute top-0 left-0 leading-none">Unit Name</p>
                                                        <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-tight uppercase w-max max-w-full">
                                                            {getFormattedUnit(currentUser.wing, currentUser.unitNumber, currentUser.unitName)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* QR Code + Color of the Day */}
                                                <div className="ml-3 shrink-0 flex flex-col items-center">
                                                    {/* Dual-Mode QR: High-security JWT on live screen, stable ID for Printed/Downloaded media */}
                                                    <QRCodeSVG
                                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify?${(qrToken && !isStaticQR) ? `token=${qrToken}` : `id=${currentUser.id}`}`}
                                                        size={56}
                                                        level="M"
                                                        className={`rounded transition-opacity duration-300 ${(!qrToken && !isStaticQR) ? 'opacity-50' : 'opacity-100'}`}
                                                    />
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dailyColor.hex }} title={`Today: ${dailyColor.name}`} />
                                                        <p className="text-[7px] text-gray-600 font-bold uppercase tracking-wider">Scan to verify</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Signatures Area */}
                                            <div className="px-8 pb-3.5 mt-auto flex justify-between items-end relative z-30 pl-12 shrink-0">
                                                <div className="text-center">
                                                    {/* Snapshot Reference — only on static media (Print/Download) */}
                                                    {isStaticQR && (
                                                        <div className="absolute left-[38px] bottom-0.5 whitespace-nowrap opacity-50">
                                                            <p className="text-[5px] font-black font-mono text-gray-400 uppercase tracking-tighter leading-none">
                                                                ID Snapshot: {new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {/* Spacer to match ANO side's s/d- height for perfect line alignment */}
                                                    <div className="h-[10.5px] mb-0.5" />
                                                    <div className="w-20 border-b border-gray-300 mb-1" />
                                                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Sign of Cadet</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <p className="text-[10px] italic font-serif text-gray-600 mb-0.5 leading-none">s/d-</p>
                                                        <div className="w-28 border-b border-gray-300 mb-1" />
                                                        <p className="text-[10px] font-extrabold text-gray-800 uppercase leading-none">
                                                            ANO, {unitBranding?.name || "RGU NCC"}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-gray-600 uppercase mt-0.5 tracking-wider">Digital Signature</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Instruction Block footer — tells verifiers how to authenticate */}
                                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#002147] z-20 flex items-center justify-between px-4">
                                                <p className="text-[6px] text-white/90 font-bold uppercase tracking-[0.2em] leading-none truncate">
                                                    Verify: {typeof window !== 'undefined' ? window.location.host : 'ncc-rgu.app'}/verify
                                                </p>
                                                <p className="text-[6px] text-white/50 font-black uppercase tracking-[0.1em] leading-none">
                                                    Verification Engine by {unitBranding?.name || "RGU-NCC"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                        <Card className="border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">ID Verification</h4>
                                        <p className="text-[10px] text-gray-800 dark:text-slate-400 uppercase font-black tracking-widest">Digital authenticity</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-slate-300 leading-relaxed font-bold italic">
                                    This digital ID card is automatically generated using your registered NCC profile data. It can be used for local unit identification.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Photo Requirements</h4>
                                        <p className="text-[10px] text-gray-800 dark:text-slate-400 uppercase font-black tracking-widest">Official Standards</p>
                                    </div>
                                </div>
                                <ul className="text-[11px] text-gray-800 dark:text-slate-300 space-y-2 list-disc pl-4 font-black">
                                    <li>Must be in NCC Khakhi Uniform</li>
                                    <li>No headgear/beret allowed</li>
                                    <li>Plain white background preferred</li>
                                    <li>Ensure face is clearly visible</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Change PIN — ANO only */}
                    {currentUserProfile && currentUserProfile.role === Role.ANO && (
                        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center space-x-2">
                                    <Lock className="w-4 h-4 text-red-600" />
                                    <span>Change Secure PIN</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                {changePinSuccess ? (
                                    <div className="flex items-center space-x-3 text-green-700 bg-green-50 border border-green-200 rounded-xl p-4">
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-semibold">PIN updated successfully!</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePinSubmit} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="new-pin" className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">New PIN</label>
                                                <input
                                                    id="new-pin"
                                                    type="password"
                                                    value={changePinData.newPin}
                                                    onChange={(e) => setChangePinData({ ...changePinData, newPin: e.target.value })}
                                                    placeholder="New PIN"
                                                    className="mt-1 w-full h-10 rounded-lg border border-gray-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-800 dark:text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="confirm-pin" className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">Confirm PIN</label>
                                                <input
                                                    id="confirm-pin"
                                                    type="password"
                                                    value={changePinData.confirmPin}
                                                    onChange={(e) => setChangePinData({ ...changePinData, confirmPin: e.target.value })}
                                                    placeholder="Confirm PIN"
                                                    className="mt-1 w-full h-10 rounded-lg border border-gray-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-800 dark:text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {changePinError && (
                                            <p className="text-red-500 text-xs font-medium">{changePinError}</p>
                                        )}
                                        <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={changePinLoading}>
                                            {changePinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update PIN"}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Attendance History & Certificates */}
                    <AttendanceHistory cadetId={currentUserProfile?.id || ''} />
                    <CertificatesSection userId={currentUserProfile?.id || ''} />
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {/* Uniform Disclaimer Modal */}
            <Modal
                isOpen={isDisclaimerOpen}
                onClose={() => setIsDisclaimerOpen(false)}
                title="Photo Upload Disclaimer"
            >
                <div className="space-y-4">
                    <div className="flex items-start p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white mr-4 shrink-0 shadow-lg shadow-amber-500/30">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 dark:text-amber-300">Important Requirement</h4>
                            <p className="text-sm text-amber-800/80 dark:text-amber-300/70 mt-1 leading-relaxed">
                                Please ensure the photo you are about to upload is strictly in **NCC khakhi uniform** and **without any headgear** (beret/cap).
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-slate-300 italic px-2">
                        Uploading an improper photo may lead to the rejection of your digital ID validity by the ANO.
                    </p>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsDisclaimerOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-primary text-white hover:bg-primary/95 shadow-xl shadow-primary/25"
                            onClick={handleDisclaimerConfirm}
                        >
                            I Understand, Proceed
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
