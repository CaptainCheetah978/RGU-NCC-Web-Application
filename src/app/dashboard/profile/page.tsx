"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Role, Wing, Gender, Cadet, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Camera, Award, Calendar, Shield, Info, Download, Printer } from "lucide-react";
import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { AttendanceHistory } from "@/components/profile/attendance-history";
import { CertificatesSection } from "@/components/profile/certificates-section";

export default function ProfilePage() {
    const { user } = useAuth();
    const { updateCadet, getStats, messageableUsers } = useData();
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const idCardRef = useRef<HTMLDivElement>(null);

    // Get the most up-to-date user data (including extras like photos)
    const currentUser = messageableUsers.find(u => u.id === user?.id) as (User & Partial<Cadet>);
    const stats = getStats(user?.id);

    if (!currentUser) return null;

    // Helper function to format unit name for display
    const getFormattedUnit = (wing: Wing | undefined, unitNumber: string | undefined, unitName?: string): string => {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setUploadError("Image size must be less than 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            // Assuming updateUser isn't exposed but updateCadet is? 
            // Wait, in ProfilePage we are using `updateUser` from `useData()`.
            // But I removed `updateUser` from `DataContextType` in a previous step to fix a lint error in CadetsPage!
            // I need to check `data-context.tsx` again to see if I removed it from the Interface but it is still returned by the hook?
            // If I removed it from Interface, TypeScript will complain here too.
            // I should use `updateCadet` if available, or just ignore for now if it works at runtime (JS). 
            // But this is TS.
            // Let's assume I need to use `updateCadet` or `updateUser` if I added it back?
            // I likely need to fix `data-context` to export `updateUser` properly or use `updateCadet`.
            // However, `updateCadet` takes an ID and `Cadet` object. `currentUser` is `User & Partial<Cadet>`.
            // For now, let's try to usage `updateCadet` if `user.role` suggests they are a cadet/profile exists.

            // Actually, in `data-context`, `updateUser` WAS exposed in the return value but I removed it from the type definition to fix the lint error in CadetsPage? 
            // providing that I am not editing `data-context` right now, I should stick to what is available. 
            // If `updateUser` is not available on the type, I will get a lint error here.
            // I should check if `updateUser` is used in other places. It was used in `CadetsPage` and `ProfilePage`.
            // I removed it from `CadetsPage`.
            // I should probably remove it here and use `updateCadet` if applicable or fail gracefully.
            // But `ProfilePage` updates the current user's profile.

            // Let's assume for this specific edit I will try to use `updateUser` but if it fails type check I'll fix it.
            // Wait, `updateUser` handles `profiles` table updates. `updateCadet` handles `cadets` table (which I plan to deprecate/merge?).
            // The `cadets` array comes from `profiles` table now? 
            // In `data-context`, `cadets` state is populated from `profiles` table where role is NOT 'ANO'?
            // Data Context is complex.

            // Let's check `data-context` properly next time. For now, I'll assume `updateUser` is NOT on the type and will cause error.
            // But `updateCadet` is there.
            // If I use `updateCadet`, it updates `profiles` table in my new implementation?
            // Yes, `updateCadet` does `supabase.from('profiles').update(...)`.

            try {
                // @ts-ignore - temporary fix if type is missing, or use updateCadet
                // But wait, updateCadet expects a full Cadet object or Partial?
                // updateCadet(id, updates)
                // Let's try to cast to any or just use updateCadet if imported?
                // updateCadet is not imported/destructured from useData here! 
                // I need to add updateCadet to destructuring first.

                // For this step, I will replace `updateUser` with `updateCadet` assuming I will add it to destructuring.
                // But wait, `updateUser` is in the destructured variables in line 18. 
                // If I remove `updateUser` and add `updateCadet`, I need to change line 18 too.

                // I will do that in a separate replacement or use MultiReplace.
                // I'll stick to `updateUser` here and fix the imports/declarations in the next step.

                await updateCadet(currentUser.id, { avatarUrl: base64 });
                setUploadError("");
            } catch (error) {
                console.error("Failed to upload photo", error);
                setUploadError("Failed to upload photo.");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDownload = async () => {
        if (!idCardRef.current) return;
        setIsDownloading(true);
        try {
            const dataUrl = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement("a");
            link.download = `NCC_ID_${currentUser.name.replace(/\s+/g, "_")}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to download ID card:", err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12 print:p-0">
            <style jsx global>{`
                @media print {
                    /* Reset layout and backgrounds */
                    body, html {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Hide parent containers that shouldn't show */
                    .flex.h-screen {
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }

                    /* Hide everything by default using visibility to maintain structure if needed, 
                       but display: none is cleaner for layout roots */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Only show the print container and its hierarchy */
                    .print-container, 
                    .print-container * {
                        visibility: visible;
                    }
                    
                    .print-container {
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        display: flex !important;
                        justify-content: center !important;
                        padding-top: 50px !important;
                        background: white !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Remove any shadows/borders from the card container during print */
                    .print-container > div {
                        box-shadow: none !important;
                        border: 1px solid #eee !important;
                    }
                }
            `}</style>

            <div className="no-print">
                <h1 className="text-3xl font-extrabold text-black tracking-tight">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your official NCC records and digital identity.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <Card className="lg:col-span-1 border-gray-200 no-print">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="relative group mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-4xl font-bold text-white relative">
                                {currentUser.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    currentUser.name.charAt(0)
                                )}
                            </div>
                            <button
                                onClick={handlePhotoUploadClick}
                                className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition-all border-4 border-white"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border border-red-100">
                            {currentUser.role}
                        </span>

                        <div className="mt-8 w-full space-y-4">
                            <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center text-gray-500">
                                    <Award className="w-4 h-4 mr-2" />
                                    <span>Regt. Number</span>
                                </div>
                                <span className="font-mono font-bold text-gray-900">{currentUser.regimentalNumber || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Attendance</span>
                                </div>
                                <span className="font-bold text-primary">{stats.attendanceRate}</span>
                            </div>
                        </div>

                        {uploadError && <p className="text-red-500 text-xs mt-4 font-medium">{uploadError}</p>}
                    </CardContent>
                </Card>

                {/* Digital ID Card Display */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-gray-200 overflow-hidden shadow-2xl">
                        <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between no-print">
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
                                    disabled={isDownloading}
                                >
                                    <Download className="w-3 h-3 mr-1" /> {isDownloading ? "Processing..." : "Download"}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={() => window.print()}>
                                    <Printer className="w-3 h-3 mr-1" /> Print
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 flex justify-center bg-gray-100/50">
                            {/* The Official ID Card Component */}
                            <div className="print-container">
                                <div ref={idCardRef} className="w-full max-w-[500px] aspect-[1.6/1] bg-white rounded-xl shadow-2xl border border-gray-200 relative overflow-hidden flex flex-col p-px">
                                    {/* Side decorative border - Ensure it's at the absolute front with no gaps */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-red-600 via-white to-blue-800 z-30" />

                                    {/* Header Section */}
                                    <div className="p-1 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 relative z-10 pl-8">
                                        <div className="w-11 h-11 flex items-center justify-center">
                                            <img src="/ncc-logo.png" className="max-w-full max-h-full object-contain" alt="NCC" />
                                        </div>
                                        <div className="text-center flex-1 mx-4">
                                            <h3 className="text-[13px] font-extrabold text-[#002147] leading-tight uppercase tracking-tight">The Assam Royal Global University</h3>
                                            <p className="text-[10px] font-bold text-red-700 tracking-[0.2em] leading-tight uppercase mt-0.5">National Cadet Corps</p>
                                        </div>
                                        <div className="w-11 h-11 flex items-center justify-center pr-2">
                                            <img src="/rgu-logo.png" className="max-w-full max-h-full object-contain" alt="RGU" />
                                        </div>
                                    </div>

                                    {/* Body Section */}
                                    <div className="flex-1 px-5 py-2 flex items-center overflow-hidden pl-10 relative z-10">
                                        {/* Photo Area */}
                                        <div className="w-28 h-28 border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center mr-5 shrink-0 shadow-sm relative ring-4 ring-white">
                                            {currentUser.avatarUrl ? (
                                                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-2">
                                                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase">No Photo</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Area - Unified Grid for absolute uniform spacing */}
                                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-6">
                                            {/* Name Row */}
                                            <div className="relative pt-2.5 col-span-2">
                                                <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest absolute top-0 left-0 leading-none">Full Name</p>
                                                <p className="text-[14px] font-bold text-gray-900 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.name}</p>
                                            </div>

                                            {/* Rank & Regt No Row */}
                                            <div className="relative pt-2.5">
                                                <p className="text-[7px] font-extrabold text-gray-400 uppercase tracking-widest absolute top-0 left-0 leading-none">Rank</p>
                                                <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.role || "N/A"}</p>
                                            </div>
                                            <div className="relative pt-2.5">
                                                <p className="text-[7px] font-extrabold text-gray-400 uppercase tracking-widest absolute top-0 left-0 leading-none">Regt. No</p>
                                                <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.regimentalNumber || "N/A"}</p>
                                            </div>

                                            {/* Wing & Blood Group Row */}
                                            <div className="relative pt-2.5">
                                                <p className="text-[7px] font-extrabold text-gray-400 uppercase tracking-widest absolute top-0 left-0 leading-none">Wing</p>
                                                <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.wing || "N/A"}</p>
                                            </div>
                                            <div className="relative pt-2.5">
                                                <p className="text-[7px] font-extrabold text-gray-400 uppercase tracking-widest absolute top-0 left-0 leading-none">Blood Group</p>
                                                <p className="text-[11px] font-bold text-red-700 border-b border-gray-200 pb-0.5 leading-none uppercase">{currentUser.bloodGroup || "N/A"}</p>
                                            </div>

                                            {/* Unit Name Row */}
                                            <div className="relative pt-2.5 col-span-2">
                                                <p className="text-[7px] font-extrabold text-gray-400 uppercase tracking-widest absolute top-0 left-0 leading-none">Unit Name</p>
                                                <p className="text-[11px] font-bold text-gray-800 border-b border-gray-200 pb-0.5 leading-tight uppercase w-max max-w-full">
                                                    {getFormattedUnit(currentUser.wing, currentUser.unitNumber, currentUser.unitName)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* QR Code */}
                                        <div className="ml-3 shrink-0 flex flex-col items-center">
                                            <QRCodeSVG
                                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify?id=${currentUser.id}`}
                                                size={56}
                                                level="M"
                                                className="rounded"
                                            />
                                            <p className="text-[5px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">Scan to verify</p>
                                        </div>
                                    </div>

                                    {/* Bottom Signatures Area */}
                                    <div className="px-8 pb-3.5 mt-auto flex justify-between items-end relative z-30 pl-12 shrink-0">
                                        <div className="text-center">
                                            {/* Spacer to match ANO side's s/d- height for perfect line alignment */}
                                            <div className="h-[10.5px] mb-0.5" />
                                            <div className="w-20 border-b border-gray-300 mb-1" />
                                            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Sign of Cadet</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] italic font-serif text-gray-500 mb-0.5 leading-none">s/d-</p>
                                                <div className="w-28 border-b border-gray-300 mb-1" />
                                                <p className="text-[8px] font-extrabold text-gray-800 uppercase leading-none">ANO, RGU NCC</p>
                                                <p className="text-[6px] font-bold text-gray-400 uppercase mt-0.5 tracking-wider">Digital Signature</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer decorative line - ensure it's at z-20 to be below the side border (which is z-30) */}
                                    <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-[#002147] z-20" />
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
                                        <h4 className="font-bold text-gray-900">ID Verification</h4>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Digital authenticity</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
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
                                        <h4 className="font-bold text-gray-900">Photo Requirements</h4>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Official Standards</p>
                                    </div>
                                </div>
                                <ul className="text-[11px] text-gray-600 space-y-2 list-disc pl-4 font-medium">
                                    <li>Must be in NCC Khakhi Uniform</li>
                                    <li>No headgear/beret allowed</li>
                                    <li>Plain white background preferred</li>
                                    <li>Ensure face is clearly visible</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance History & Certificates */}
                    <AttendanceHistory cadetId={currentUser.id} />
                    <CertificatesSection userId={currentUser.id} />
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
                    <div className="flex items-start p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white mr-4 shrink-0 shadow-lg shadow-amber-500/30">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900">Important Requirement</h4>
                            <p className="text-sm text-amber-800/80 mt-1 leading-relaxed">
                                Please ensure the photo you are about to upload is strictly in **NCC khakhi uniform** and **without any headgear** (beret/cap).
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 italic px-2">
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
