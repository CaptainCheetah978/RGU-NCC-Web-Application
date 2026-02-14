"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Role, Wing, Gender, Cadet, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Camera, Award, Calendar, Shield, Info, Download, Printer } from "lucide-react";
import { useState, useRef } from "react";
import { toPng } from "html-to-image";

export default function ProfilePage() {
    const { user } = useAuth();
    const { updateUser, getStats, messageableUsers } = useData();
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
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateUser(currentUser.id, { avatarUrl: base64 });
            setUploadError("");
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
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        height: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
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
                    <Card className="border-gray-200 overflow-hidden shadow-2xl no-print">
                        <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
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
                                    {/* Side decorative border */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-red-600 via-white to-blue-800" />

                                    {/* Header Section */}
                                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                                        <img src="/ncc-logo.png" className="w-14 h-14 object-contain" alt="NCC" />
                                        <div className="text-center flex-1 mx-4">
                                            <h3 className="text-[13px] font-extrabold text-[#002147] leading-tight uppercase tracking-tight">Royal Global University, Guwahati</h3>
                                            <p className="text-[11px] font-bold text-red-700 tracking-[0.25em] leading-tight uppercase mt-0.5">National Cadet Corps</p>
                                        </div>
                                        <img src="/rgu-logo.png" className="w-16 h-16 object-contain" alt="RGU" />
                                    </div>

                                    {/* Body Section */}
                                    <div className="flex-1 p-6 pb-2 flex">
                                        {/* Photo Area */}
                                        <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mr-6 shrink-0 shadow-sm relative">
                                            {currentUser.avatarUrl ? (
                                                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-2">
                                                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase">No Photo</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Area */}
                                        <div className="flex-1 space-y-3.5">
                                            <div className="relative">
                                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-tighter absolute -top-3 left-0">Full Name</p>
                                                <p className="text-[15px] font-bold text-gray-900 border-b border-gray-300 pb-0.5 leading-none">{currentUser.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                <div className="relative">
                                                    <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter absolute -top-3 left-0">Rank</p>
                                                    <p className="text-[11px] font-bold text-gray-800 border-b border-gray-300 pb-0.5 uppercase">{currentUser.role}</p>
                                                </div>
                                                <div className="relative">
                                                    <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter absolute -top-3 left-0">Regt. No</p>
                                                    <p className="text-[11px] font-bold text-gray-800 border-b border-gray-300 pb-0.5">{currentUser.regimentalNumber || "N/A"}</p>
                                                </div>
                                                <div className="relative">
                                                    <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter absolute -top-3 left-0">Wing</p>
                                                    <p className="text-[11px] font-bold text-gray-800 border-b border-gray-300 pb-0.5 uppercase">{currentUser.wing || "N/A"}</p>
                                                </div>
                                                <div className="relative">
                                                    <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter absolute -top-3 left-0">Blood Group</p>
                                                    <p className="text-[11px] font-bold text-red-700 border-b border-gray-300 pb-0.5">{currentUser.bloodGroup || "N/A"}</p>
                                                </div>
                                            </div>
                                            <div className="relative mt-1">
                                                <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter absolute -top-3 left-0">Unit Name</p>
                                                <p className="text-[11px] font-bold text-gray-800 border-b border-gray-300 pb-0.5">
                                                    {getFormattedUnit(currentUser.wing, currentUser.unitNumber, currentUser.unitName)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Signatures Area */}
                                    <div className="px-6 pb-6 mt-auto flex justify-between items-end">
                                        <div className="text-center">
                                            <div className="w-24 border-b border-gray-400 mb-1" />
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Sign of Cadet</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] italic font-serif text-gray-600 mb-0 px-2 leading-none">s/d-</p>
                                            <div className="w-28 border-b border-gray-400 mb-1" />
                                            <p className="text-[8px] font-bold text-gray-800 uppercase leading-none">ANO, RGU NCC</p>
                                            <p className="text-[7px] font-bold text-gray-400 uppercase mt-0.5 tracking-widest">Digital Signature</p>
                                        </div>
                                    </div>

                                    {/* Footer bar */}
                                    <div className="bg-[#002147] h-2 w-full mt-auto" />
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
        </div>
    );
}
