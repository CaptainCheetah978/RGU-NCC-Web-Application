"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Certificate, Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Award, Upload, Trash2, Eye, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

const CERT_TYPES = [
    { value: "A", label: "A Certificate" },
    { value: "B", label: "B Certificate" },
    { value: "C", label: "C Certificate" },
    { value: "Camp", label: "Camp Attendance" },
    { value: "Award", label: "Best Cadet Award" },
    { value: "Other", label: "Other" },
] as const;

const CERT_COLORS: Record<string, string> = {
    A: "bg-amber-50 text-amber-700 border-amber-200",
    B: "bg-blue-50 text-blue-700 border-blue-200",
    C: "bg-green-50 text-green-700 border-green-200",
    Camp: "bg-purple-50 text-purple-700 border-purple-200",
    Award: "bg-red-50 text-red-700 border-red-200",
    Other: "bg-gray-50 text-gray-600 border-gray-200",
};

export function CertificatesSection({ userId }: { userId: string }) {
    const { getCertificates, addCertificate, deleteCertificate, logActivity } = useData();
    const { user } = useAuth();
    const certs = getCertificates(userId);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [certType, setCertType] = useState<Certificate["type"]>("A");
    const [certName, setCertName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = () => {
        if (!uploadFile || !certName) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            const cert: Certificate = {
                id: `cert-${Date.now()}`,
                userId,
                name: certName,
                type: certType,
                fileData: base64,
                uploadDate: new Date().toISOString(),
            };
            addCertificate(cert);
            if (user) {
                logActivity("Uploaded certificate", user.id, user.name, certName);
            }
            setIsUploadOpen(false);
            setUploadFile(null);
            setCertName("");
            setCertType("A");
        };
        reader.readAsDataURL(uploadFile);
    };

    const canDelete = (cert: Certificate) => {
        if (!user) return false;
        // Owner can delete
        if (user.id === cert.userId) return true;
        // ANO can delete anyone's
        return user.role === Role.ANO;
    };

    const handleDelete = (cert: Certificate) => {
        if (!canDelete(cert)) return;
        if (confirm(`Delete "${cert.name}"?`)) {
            deleteCertificate(cert.id);
            if (user) {
                logActivity("Deleted certificate", user.id, user.name, cert.name);
            }
        }
    };

    return (
        <>
            <Card className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Award className="w-5 h-5 mr-2 text-secondary" />
                        Certificates & Achievements
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setIsUploadOpen(true)} className="text-xs h-8">
                        <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                    </Button>
                </CardHeader>
                <CardContent>
                    {certs.length === 0 ? (
                        <div className="py-8 text-center text-gray-400">
                            <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">No certificates uploaded yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {certs.map((cert, i) => (
                                <motion.div
                                    key={cert.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center p-3 rounded-xl bg-gray-50 border border-gray-100 group hover:shadow-sm transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center mr-3 shrink-0">
                                        {cert.fileData.startsWith("data:image") ? (
                                            <img src={cert.fileData} alt={cert.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{cert.name}</p>
                                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${CERT_COLORS[cert.type]}`}>
                                            {cert.type === "A" || cert.type === "B" || cert.type === "C" ? `${cert.type} Cert` : cert.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setViewingCert(cert)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-white transition-colors">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {canDelete(cert) && (
                                            <button onClick={() => handleDelete(cert)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Modal */}
            <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Certificate">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary/80 ml-1">Certificate Name</label>
                        <input
                            type="text"
                            placeholder="e.g. NCC B Certificate 2024"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            value={certName}
                            onChange={(e) => setCertName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary/80 ml-1">Certificate Type</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            value={certType}
                            onChange={(e) => setCertType(e.target.value as Certificate["type"])}
                        >
                            {CERT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        {uploadFile ? (
                            <p className="font-bold text-gray-900 text-sm">{uploadFile.name}</p>
                        ) : (
                            <p className="text-sm text-gray-500">Click to select file (Image or PDF)</p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!uploadFile || !certName}>Upload</Button>
                    </div>
                </div>
            </Modal>

            {/* View Certificate Modal */}
            <Modal isOpen={!!viewingCert} onClose={() => setViewingCert(null)} title={viewingCert?.name || "Certificate"}>
                {viewingCert && (
                    <div className="space-y-4">
                        {viewingCert.fileData.startsWith("data:image") ? (
                            <img src={viewingCert.fileData} alt={viewingCert.name} className="w-full rounded-xl border border-gray-100" />
                        ) : (
                            <div className="p-8 bg-gray-50 rounded-xl text-center">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">PDF preview not available</p>
                                <a href={viewingCert.fileData} download={viewingCert.name} className="text-primary text-sm font-bold mt-2 inline-block hover:underline">
                                    Download File
                                </a>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${CERT_COLORS[viewingCert.type]}`}>
                                {viewingCert.type === "A" || viewingCert.type === "B" || viewingCert.type === "C" ? `${viewingCert.type} Certificate` : viewingCert.type}
                            </span>
                            <span className="text-gray-400 text-xs">
                                Uploaded {new Date(viewingCert.uploadDate).toLocaleDateString("en-IN")}
                            </span>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
