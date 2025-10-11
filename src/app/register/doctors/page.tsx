"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "@/firebaseConfig";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "firebase/firestore";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from "firebase/storage";
import { notify } from "@/components/ToastConfig";



// Default city & province
const DEFAULT_CITY = "Naga City";
const DEFAULT_PROVINCE = "Camarines Sur";



// Spinner component
const Spinner = () => (
    <svg
        className="animate-spin h-4 w-4 text-white inline-block ml-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        ></circle>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
    </svg>
);

export default function DoctorRegisterPage() {
    const [openSection, setOpenSection] = useState<"doctor" | "clinic" | "">("doctor");
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);


    const [form, setForm] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        nameExtension: "",
        titles: "",
        specializations: [] as string[],
        contact: "",
        email: "",
        clinics: [
            {
                name: "",
                buildingStreet: "",
                city: DEFAULT_CITY,
                province: DEFAULT_PROVINCE,
                type: "Clinic",
            },
        ],
        consent: false,
        prcFile: null as File | null,

    });

    const toTitleCase = (str: string) =>
        str
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())
            .trim();

    // -------- Handlers --------
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const { name, value } = target;

        setForm((prev) => ({
            ...prev,
            [name]:
                target instanceof HTMLInputElement && target.type === "checkbox"
                    ? target.checked
                    : value,
        }));
    };


    const handleClinicChange = (index: number, field: string, value: string) => {
        const next = [...form.clinics];
        next[index] = { ...next[index], [field]: value };
        setForm((prev) => ({ ...prev, clinics: next }));
    };

    const addClinic = () =>
        setForm((prev) => ({
            ...prev,
            clinics: [
                ...prev.clinics,
                {
                    name: "",
                    buildingStreet: "",
                    city: DEFAULT_CITY,
                    province: DEFAULT_PROVINCE,
                    type: "Clinic",
                },
            ],
        }));

    const removeClinic = (index: number) =>
        setForm((prev) => ({
            ...prev,
            clinics: prev.clinics.filter((_, i) => i !== index),
        }));

    // -------- Submit --------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAlert(null);

        if (!form.firstName.trim() || !form.lastName.trim()) {
            notify.warning("Please enter your full name.");
            setLoading(false);
            return;
        }

        if (!form.email.trim()) {
            notify.warning("Please provide your email address.");
            setLoading(false);
            return;
        }

        if (form.specializations.length === 0) {
            notify.warning("Please select at least one specialization.");
            setLoading(false);
            return;
        }

        if (!form.prcFile) {
            notify.warning("Please upload a photo of your PRC ID.");
            setLoading(false);
            return;
        }

        if (form.clinics.length === 0 || !form.clinics[0].name.trim()) {
            notify.warning("Please provide at least one clinic name.");
            setLoading(false);
            return;
        }


        // Upload PRC file to Firebase Storage (no immediate read)
        const file = form.prcFile!;
        const fileRef = ref(storage, `prcIDs/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        await new Promise<void>((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(prog);
                },
                (error) => reject(error),
                () => resolve()
            );
        });

        // Save only the storage path (not download URL)
        const prcIdPath = uploadTask.snapshot.ref.fullPath; // e.g. "prcIDs/1760...jpg"



        if (!form.consent) {
            notify.warning("You must agree to the consent form before submitting.");
            setLoading(false);
            return;
        }

        try {
            const cleaned = {
                ...form,
                firstName: toTitleCase(form.firstName),
                middleName: toTitleCase(form.middleName),
                lastName: toTitleCase(form.lastName),
                titles: form.titles.trim().toUpperCase(),
                clinics: form.clinics.map((c) => ({
                    ...c,
                    name: toTitleCase(c.name),
                    buildingStreet: toTitleCase(c.buildingStreet),
                    city: toTitleCase(c.city),
                    province: toTitleCase(c.province),
                })),
            };

            // Exclude the actual file before saving
            const { prcFile, ...cleanedWithoutFile } = cleaned;

            await addDoc(collection(db, "doctors"), {
                ...cleanedWithoutFile,
                specializations: cleaned.specializations,
                prcIdPath, // ✅ store only the storage path
                status: "Pending",
                userType: "Regular",
                createdAt: serverTimestamp(),
            });

            notify.success("Registration submitted! Our team will verify your account soon.");

            setForm({
                firstName: "",
                middleName: "",
                lastName: "",
                nameExtension: "",
                titles: "",
                specializations: [],
                contact: "",
                email: "",
                clinics: [
                    {
                        name: "",
                        buildingStreet: "",
                        city: DEFAULT_CITY,
                        province: DEFAULT_PROVINCE,
                        type: "Clinic",
                    },
                ],
                consent: false,
                prcFile: null,
            });
            setUploadedUrl(null);
            setPreviewUrl(null);
        } catch (err) {
            console.error(err);
            setAlert("❌ Error submitting form.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-10">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 sm:p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Doctor Registration
                </h1>

               


                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Doctor Info Accordion */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() =>
                                setOpenSection(openSection === "doctor" ? "" : "doctor")
                            }
                            className="w-full flex justify-between items-center p-4 font-semibold text-primary cursor-pointer"
                        >
                            <span>Doctor Information</span>
                            <span>{openSection === "doctor" ? "−" : "+"}</span>
                        </button>

                        <AnimatePresence>
                            {openSection === "doctor" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 pt-0 space-y-3"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {["firstName", "middleName", "lastName"].map((field, i) => (
                                            <input
                                                key={i}
                                                name={field}
                                                placeholder={
                                                    field === "firstName"
                                                        ? "First Name"
                                                        : field === "middleName"
                                                            ? "Middle Name"
                                                            : "Last Name"
                                                }
                                                className="capitalize w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                                value={form[field as keyof typeof form] as string}
                                                onChange={handleChange}
                                                required={field !== "middleName"}
                                            />
                                        ))}
                                    </div>

                                    {/* Suffix */}
                                    <input
                                        name="nameExtension"
                                        placeholder="Suffix (Jr., III, etc.)"
                                        value={form.nameExtension || ""}
                                        onChange={handleChange}
                                        className="uppercase w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                    />


                                    <input
                                        name="titles"
                                        placeholder="Post-nominal Titles (e.g. MD, FPPA)"
                                        className="uppercase w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                        value={form.titles}
                                        onChange={handleChange}
                                    />

                                    {/* Specializations */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Specializations
                                        </label>
                                        <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg px-2 py-2">
                                            {form.specializations.map((spec, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full flex items-center gap-2"
                                                >
                                                    {spec}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                specializations: prev.specializations.filter(
                                                                    (_, i) => i !== index
                                                                ),
                                                            }))
                                                        }
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                            <select
                                                className="bg-transparent text-sm cursor-pointer"
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (
                                                        value &&
                                                        !form.specializations.includes(value)
                                                    ) {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            specializations: [
                                                                ...prev.specializations,
                                                                value,
                                                            ],
                                                        }));
                                                    }
                                                }}
                                                value=""
                                            >
                                                <option value="" disabled>
                                                    + Add specialization
                                                </option>
                                                {[
                                                    "General Medicine",
                                                    "Pediatrics",
                                                    "Cardiology",
                                                    "Dermatology",
                                                    "Obstetrics and Gynecology",
                                                    "Neurology",
                                                    "Orthopedics",
                                                    "Psychiatry",
                                                ].map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email Address"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                        value={form.email}
                                        onChange={handleChange}
                                    />


                                    <input
                                        name="contact"
                                        placeholder="Contact Number"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                        value={form.contact}
                                        onChange={handleChange}
                                    />

                                    {/* PRC ID Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Upload Professional ID (PRC Card)
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Your PRC ID helps us verify your credentials and keep HealthLane a trusted space for healthcare providers and patients alike.
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <label
                                                htmlFor="prcUpload"
                                                className="cursor-pointer border border-primary text-primary hover:bg-primary/5 text-sm px-4 py-2 rounded-md transition"
                                            >
                                                {previewUrl ? "Replace Photo" : "Upload Photo"}
                                            </label>
                                            <input
                                                id="prcUpload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setForm((prev) => ({ ...prev, prcFile: file }));
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            {previewUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm((prev) => ({ ...prev, prcFile: null }));
                                                        setPreviewUrl(null);
                                                    }}
                                                    className="text-red-500 text-sm hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        {previewUrl && (
                                            <img
                                                src={previewUrl}
                                                alt="Uploaded PRC ID"
                                                className="mt-3 w-48 rounded-md border border-gray-200 shadow-sm"
                                            />
                                        )}
                                    </div>


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Clinic Info Accordion */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() =>
                                setOpenSection(openSection === "clinic" ? "" : "clinic")
                            }
                            className="w-full flex justify-between items-center p-4 font-semibold text-primary cursor-pointer"
                        >
                            <span>Clinic Information</span>
                            <span>{openSection === "clinic" ? "−" : "+"}</span>
                        </button>

                        <AnimatePresence>
                            {openSection === "clinic" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 pt-0 space-y-3"
                                >
                                    {form.clinics.map((c, i) => (
                                        <div
                                            key={i}
                                            className="border border-gray-300 rounded-lg p-3 mb-3"
                                        >
                                            <input
                                                placeholder="Clinic Name"
                                                value={c.name}
                                                onChange={(e) =>
                                                    handleClinicChange(i, "name", e.target.value)
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary"
                                            />
                                            <input
                                                placeholder="Building & Street"
                                                value={c.buildingStreet}
                                                onChange={(e) =>
                                                    handleClinicChange(i, "buildingStreet", e.target.value)
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary"
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input
                                                    placeholder="City"
                                                    value={c.city}
                                                    onChange={(e) =>
                                                        handleClinicChange(i, "city", e.target.value)
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                                />
                                                <input
                                                    placeholder="Province"
                                                    value={c.province}
                                                    onChange={(e) =>
                                                        handleClinicChange(i, "province", e.target.value)
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            {form.clinics.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeClinic(i)}
                                                    className="text-red-600 text-xs mt-2 hover:underline"
                                                >
                                                    Remove clinic
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addClinic}
                                        className="text-primary text-sm hover:underline"
                                    >
                                        + Add another location
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Consent */}
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            name="consent"
                            checked={form.consent}
                            onChange={handleChange}
                            className="mt-1"
                        />
                        <span>
                            I agree to the terms outlined in the{" "}
                            <button
                                type="button"
                                onClick={() => setShowConsentModal(true)}
                                className="text-primary underline hover:text-primaryDark"
                            >
                                Consent Form
                            </button>

                            .
                        </span>
                    </label>

                    {/* Submit */}
                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`mx-auto block px-10 mt-4 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${loading
                                ? "bg-primary text-white opacity-80 cursor-wait"
                                : "bg-primary text-white hover:bg-primaryDark"
                                }`}
                        >
                            {loading ? (
                                <>
                                    Submitting
                                    <Spinner />
                                </>
                            ) : (
                                "Register"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Consent Form Modal */}
            <AnimatePresence>
                {showConsentModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                        >
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Consent Form</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                This is placeholder text for the Consent Form. You can update this later with
                                the official content.
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowConsentModal(false)}
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primaryDark transition"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}