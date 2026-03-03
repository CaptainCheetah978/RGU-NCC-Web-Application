"use client";

import { useAuth } from "@/lib/auth-context";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Upload, FileText, Image as ImageIcon, Video, Download, Trash2, RefreshCw, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/lib/toast-context";

type FileType = "PDF" | "IMAGE" | "VIDEO" | "OTHER";

interface StoredFile {
    id: string;
    name: string;
    type: FileType;
    size: string;
    uploadedBy: string;
    date: string;
    signedUrl: string;
    path: string;
}

const BUCKET = "files";
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour in seconds

function getFileType(name: string): FileType {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "PDF";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "IMAGE";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "VIDEO";
    return "OTHER";
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

export default function FilesPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    // ALL hooks must come before any conditional returns
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        setPageError(null);
        try {
            // 1. List files in the bucket
            const { data: listed, error: listError } = await supabase.storage
                .from(BUCKET)
                .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

            if (listError) {
                setPageError("Could not load files. Make sure the 'files' storage bucket exists in Supabase (set to Private).");
                setFiles([]);
                return;
            }

            const validFiles = (listed || []).filter(f => f.name !== ".emptyFolderPlaceholder");
            if (validFiles.length === 0) { setFiles([]); return; }

            // 2. Batch-create signed URLs (private access, expiring)
            const paths = validFiles.map(f => f.name);
            const { data: signedUrls, error: signError } = await supabase.storage
                .from(BUCKET)
                .createSignedUrls(paths, SIGNED_URL_EXPIRY);

            if (signError) {
                setPageError("Could not generate secure download links.");
                setFiles([]);
                return;
            }

            const urlMap = new Map((signedUrls || []).map(s => [s.path, s.signedUrl]));

            const mapped: StoredFile[] = validFiles.map(f => {
                const parts = f.name.split("__");
                const displayName = parts.length > 1 ? parts.slice(1).join("__").replace(/^\d+_/, "") : f.name;
                const uploader = parts.length > 1 ? parts[0].replace(/_/g, " ") : "Unknown";

                return {
                    id: f.id || f.name,
                    name: displayName,
                    type: getFileType(f.name),
                    size: f.metadata?.size ? formatBytes(f.metadata.size) : "—",
                    uploadedBy: uploader,
                    date: f.created_at
                        ? new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—",
                    signedUrl: urlMap.get(f.name) || "",
                    path: f.name,
                };
            });

            setFiles(mapped);
        } catch (e) {
            setPageError("Unexpected error loading files.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    // Safe early return AFTER all hooks
    if (!user) return null;

    const canUpload = [Role.ANO, Role.SUO, Role.UO, Role.SGT].includes(user.role);
    const canDelete = [Role.ANO, Role.SUO].includes(user.role);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !user) return;
        setIsUploading(true);
        setModalError(null);

        const safeName = user.name.replace(/\s+/g, "_");
        const timestamp = Date.now();
        const storagePath = `${safeName}__${timestamp}_${uploadFile.name}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, uploadFile, { upsert: false });

            if (uploadError) {
                setModalError(`Upload failed: ${uploadError.message}`);
            } else {
                setIsUploadModalOpen(false);
                setUploadFile(null);
                setModalError(null);
                await fetchFiles();
            }
        } catch (err: unknown) {
            setModalError(err instanceof Error ? err.message : "Upload failed unexpectedly.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (file: StoredFile) => {
        if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
        const { error: deleteError } = await supabase.storage.from(BUCKET).remove([file.path]);
        if (deleteError) {
            showToast("Failed to delete: " + deleteError.message);
        } else {
            showToast(`"${file.name}" deleted.`, "success");
            await fetchFiles();
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
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Documents &amp; Media</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500">Shared resources — secured with expiring access links.</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> Private
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchFiles} title="Refresh signed links">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    {canUpload && (
                        <Button onClick={() => setIsUploadModalOpen(true)} className="shadow-lg shadow-primary/25">
                            <Upload className="w-5 h-5 mr-2" />
                            Upload File
                        </Button>
                    )}
                </div>
            </div>

            {pageError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    ⚠️ {pageError}
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Upload className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700">No files uploaded yet</h3>
                    <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto">
                        {canUpload ? "Upload the first file to get started." : "No shared files available yet."}
                    </p>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {files.map((file, index) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer border border-gray-100">
                                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                            {file.type === "IMAGE" && file.signedUrl ? (
                                                <img
                                                    src={file.signedUrl}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                />
                                            ) : getIcon(file.type)}
                                        </div>
                                        <div className="w-full">
                                            <h3 className="font-semibold text-gray-900 truncate w-full max-w-[180px] mx-auto" title={file.name}>
                                                {file.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">{file.size} · {file.date}</p>
                                            <p className="text-[10px] text-gray-400">by {file.uploadedBy}</p>
                                        </div>
                                        <div className="flex items-center justify-center space-x-2 w-full pt-2 border-t border-gray-50">
                                            <a
                                                href={file.signedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                                                title="Download / Open (link valid 1 hour)"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete file"
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
                </AnimatePresence>
            )}

            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setUploadFile(null); setModalError(null); }}
                title="Upload Resource"
            >
                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setModalError(null); }}
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.mkv"
                        />
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        {uploadFile ? (
                            <div>
                                <p className="font-bold text-gray-900">{uploadFile.name}</p>
                                <p className="text-sm text-gray-500">{formatBytes(uploadFile.size)}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500 mt-1">PDF, Images, Video</p>
                            </div>
                        )}
                    </div>

                    {modalError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                            ⚠️ {modalError}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => { setIsUploadModalOpen(false); setUploadFile(null); setModalError(null); }}>Cancel</Button>
                        <Button type="submit" disabled={!uploadFile || isUploading} isLoading={isUploading}>
                            Upload Now
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
