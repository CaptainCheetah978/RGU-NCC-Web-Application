"use client";

import { useAuth } from "@/lib/auth-context";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Image as ImageIcon, Video, Folder, Download, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Mock file types
type FileType = "PDF" | "IMAGE" | "VIDEO";

interface FileItem {
    id: string;
    name: string;
    type: FileType;
    size: string;
    uploadedBy: string;
    date: string;
    url: string;
}

const MOCK_FILES: FileItem[] = [
    { id: "1", name: "Drill Manual 2023.pdf", type: "PDF", size: "2.4 MB", uploadedBy: "ANO", date: "Oct 20, 2023", url: "#" },
    { id: "2", name: "Parade Formation.jpg", type: "IMAGE", size: "1.8 MB", uploadedBy: "SUO", date: "Oct 22, 2023", url: "#" },
    { id: "3", name: "Camp Instructions.pdf", type: "PDF", size: "0.5 MB", uploadedBy: "ANO", date: "Oct 24, 2023", url: "#" },
];

export default function FilesPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Permission logic: 
    // ANO/SUO/UO can always upload.
    // Others can only if explicitly allowed (simulated here as always allowed for demo simplicity but visually distinct)
    const canUpload = user && [Role.ANO, Role.SUO, Role.UO, Role.SGT].includes(user.role);

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !user) return;

        const type: FileType = uploadFile.type.includes("pdf") ? "PDF" : uploadFile.type.includes("image") ? "IMAGE" : "VIDEO";

        const newFile: FileItem = {
            id: Date.now().toString(),
            name: uploadFile.name,
            type,
            size: `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`,
            uploadedBy: user.name,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            url: "#"
        };

        setFiles([newFile, ...files]);
        setIsUploadModalOpen(false);
        setUploadFile(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this file?")) {
            setFiles(files.filter(f => f.id !== id));
        }
    };

    const getIcon = (type: FileType) => {
        switch (type) {
            case "PDF": return <FileText className="w-8 h-8 text-red-500" />;
            case "IMAGE": return <ImageIcon className="w-8 h-8 text-blue-500" />;
            case "VIDEO": return <Video className="w-8 h-8 text-green-500" />;
            default: return <FileText className="w-8 h-8 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Documents & Media</h2>
                    <p className="text-gray-500 mt-1">Shared resources and gallery.</p>
                </div>
                {canUpload && (
                    <Button onClick={() => setIsUploadModalOpen(true)} className="shadow-lg shadow-primary/25">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload File
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {files.map((file, index) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer border border-gray-100">
                            <div className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    {getIcon(file.type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 truncate w-full max-w-[200px]" title={file.name}>{file.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{file.size} • {file.date}</p>
                                </div>
                                <div className="flex items-center space-x-2 w-full pt-2 border-t border-gray-50">
                                    <div className="flex -space-x-2 mr-auto">
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold border-2 border-white" title={`Uploaded by ${file.uploadedBy}`}>
                                            {file.uploadedBy.charAt(0)}
                                        </div>
                                    </div>

                                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    {canUpload && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Resource">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative"
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        {uploadFile ? (
                            <div>
                                <p className="font-bold text-gray-900">{uploadFile.name}</p>
                                <p className="text-sm text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500 mt-1">PDF, Images, Video (Max 10MB)</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={!uploadFile}>Upload Now</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
