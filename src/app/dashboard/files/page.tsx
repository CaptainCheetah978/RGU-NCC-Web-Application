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
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
        } catch {
            setPageError("Unexpected error loading files.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    // Safe early return AFTER all hooks
    if (!user) return null;

    const canUpload = [Role.ANO, Role.CSUO, Role.CJUO, Role.SGT].includes(user.role);
    const canDelete = [Role.ANO, Role.CSUO].includes(user.role);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !user) return;
        if (uploadFile.size > MAX_FILE_SIZE) {
            setModalError(`File too large (${formatBytes(uploadFile.size)}). Maximum allowed is ${formatBytes(MAX_FILE_SIZE)}.`);
            return;
        }
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
                const msg = uploadError.message || "";
                if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("404") || msg.includes("Bucket not found")) {
                    setModalError("Storage bucket not configured. Ensure a Private bucket named 'files' exists in Supabase Storage with proper RLS policies.");
                } else {
                    setModalError(`Upload failed: ${msg}`);
                }
            } else {
                setIsUploadModalOpen(false);
                setUploadFile(null);
                setModalError(null);
                showToast("File uploaded successfully!", "success");
                await fetchFiles();
            }
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Upload failed unexpectedly.";
            if (errMsg.includes("fetch") || errMsg.includes("NetworkError")) {
                setModalError("Network error — check that the 'files' storage bucket exists in Supabase and has INSERT policies for authenticated users.");
            } else {
                setModalError(errMsg);
            }
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
            case "PDF": return <FileText className="w-8 h-8 text-red-600" />;
            case "IMAGE": return <ImageIcon className="w-8 h-8 text-blue-600" />;
            case "VIDEO": return <Video className="w-8 h-8 text-green-600" />;
            default: return <FileText className="w-8 h-8 text-gray-700 font-bold" />;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Documents &amp; Media</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-zinc-800 dark:text-slate-300 font-medium italic">Shared resources — secured with expiring access links.</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> Private
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchFiles} title="Refresh signed links" aria-label="Refresh secure links" className="text-gray-700 dark:text-slate-300">
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
                        <div key={i} className="h-48 bg-gray-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-600">
                        <Upload className="w-10 h-10 text-gray-400 dark:text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No files uploaded yet</h3>
                    <p className="text-zinc-800 dark:text-slate-400 mt-2 text-sm font-medium max-w-sm mx-auto">
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
                                <Card className="bg-white dark:bg-slate-800/80 hover:shadow-lg transition-all duration-300 group cursor-pointer border border-gray-100 dark:border-slate-700/60">
                                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                            {file.type === "IMAGE" && file.signedUrl ? (
                                                /* eslint-disable @next/next/no-img-element */
                                                <img
                                                    src={file.signedUrl}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    onError={(e: any) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                />
                                                /* eslint-enable @next/next/no-img-element */
                                            ) : getIcon(file.type)}
                                        </div>
                                        <div className="w-full">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate w-full max-w-[180px] mx-auto" title={file.name}>
                                                {file.name}
                                            </h3>
                                            <p className="text-xs text-zinc-800 dark:text-slate-300 mt-1 font-bold">{file.size} · {file.date}</p>
                                            <p className="text-[10px] text-zinc-700 dark:text-slate-400 font-black uppercase tracking-tight">by {file.uploadedBy}</p>
                                        </div>
                                        <div className="flex items-center justify-center space-x-2 w-full pt-2 border-t border-gray-50 dark:border-slate-700/60">
                                            <a
                                                href={file.signedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-zinc-700 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-bold"
                                                title="Download / Open (link valid 1 hour)"
                                                aria-label={`Download ${file.name}`}
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                                    className="p-2 text-zinc-700 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-bold"
                                                    title="Delete file"
                                                    aria-label={`Delete ${file.name}`}
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
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 dark:hover:bg-blue-500/5 transition-all cursor-pointer relative">
                        <input
                            type="file"
                            id="file-upload-input"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setModalError(null); }}
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.mkv"
                            aria-label="Upload resource"
                        />
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        {uploadFile ? (
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{uploadFile.name}</p>
                                <p className="text-sm text-gray-600 dark:text-slate-400">{formatBytes(uploadFile.size)}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">PDF, Images, Video</p>
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
