"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender, Cadet } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Trash2, Camera, Info, Download, Lock, Key } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { CertificatesSection } from "@/components/profile/certificates-section";
import { createCadetAccount, updateCadetPin } from "@/app/actions/cadet-actions";

export default function CadetsPage() {
    const { cadets, updateCadet, deleteCadet, logActivity, refreshData } = useData();
    const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false); // New modal for PIN
    const [editingCadet, setEditingCadet] = useState<Cadet | null>(null);
    const [viewingCadet, setViewingCadet] = useState<Cadet | null>(null);
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filterRole, setFilterRole] = useState<string>("ALL");

    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        regimentalNumber: "",
        rank: Role.CADET,
        wing: Wing.ARMY,
        gender: Gender.MALE,
        unitNumber: "30",
        unitName: "Assam BN NCC",
        enrollmentYear: new Date().getFullYear(),
        bloodGroup: "O+",
        pin: "1234", // Default PIN
    });

    // ... (Keep existing states) ...
    const [editFormData, setEditFormData] = useState<any>({});
    const [newPin, setNewPin] = useState("");

    const filteredCadets = useMemo(() => {
        return cadets.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === "ALL" || c.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [cadets, searchQuery, filterRole]);

    if (!user) return null;

    const canEdit = user && [Role.ANO, Role.SUO].includes(user.role);
    const isANO = user.role === Role.ANO;
    // Only ANO and SUO can see PINs? Actually user asked "ANO/SUO view, ANO edit".
    const canViewPin = [Role.ANO, Role.SUO].includes(user.role);

    // ... (Keep existing handlers) ...

    const handleEdit = (cadet: Cadet) => {
        setEditingCadet(cadet);
        setEditFormData({
            // ... (Populate existing fields)
            name: cadet.name,
            role: cadet.role,
            regimentalNumber: cadet.regimentalNumber,
            wing: cadet.wing,
            gender: cadet.gender,
            unitNumber: cadet.unitNumber,
            unitName: cadet.unitName,
            enrollmentYear: cadet.enrollmentYear,
            bloodGroup: cadet.bloodGroup,
            // Pin is not edited here, it has its own modal
        });
        setIsEditModalOpen(true);
    };

    const handlePinEdit = (cadet: Cadet) => {
        setEditingCadet(cadet);
        setNewPin(cadet.access_pin || ""); // Pre-fill? Or empty?
        setIsPinModalOpen(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Server Action Call
        const result = await createCadetAccount(formData);

        if (result.success) {
            // Refresh local data
            await refreshData();
            setIsModalOpen(false);
            // Reset form
            setFormData({
                name: "",
                regimentalNumber: "",
                rank: Role.CADET,
                wing: Wing.ARMY,
                gender: Gender.MALE,
                unitNumber: "30",
                unitName: "Assam BN NCC",
                enrollmentYear: new Date().getFullYear(),
                bloodGroup: "O+",
                pin: "1234",
            });
            alert(`Cadet Enrolled! Login ID: ${result.userId} (Internal). They can login with Rank_Name and PIN.`);
        } else {
            alert("Enrollment Failed: " + result.error);
        }
        setIsLoading(false);
    };

    const handlePinUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCadet) return;
        setIsLoading(true);

        const result = await updateCadetPin(editingCadet.id, newPin);

        if (result.success) {
            await refreshData();
            setIsPinModalOpen(false);
            alert("PIN Updated successfully.");
        } else {
            alert("Failed to update PIN: " + result.error);
        }
        setIsLoading(false);
    };

    // ... (Keep rest of UI, insert new Columns and Modals) ...
}
