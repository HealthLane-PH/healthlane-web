"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAt,
  endAt,
  limit,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

// ---------- Types ----------
// ---------- Types ----------
type FacilityType = "Clinic" | "Laboratory" | "Hospital";

type ClinicRef = { clinicId: string; name: string };

type ClinicEntry = {
  name: string;
  address: string;
  type: FacilityType;
  clinicId?: string; // set when chosen from autocomplete
  doctorContact?: string; // optional, per-doctor contact for this clinic
};


type ClinicSuggestion = {
  id: string;
  name: string;
  address?: string;
  contact?: string;
  type?: FacilityType;
};

type DoctorDoc = {
  id?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  titles?: string;
  specializations: string[];
  contact?: string;
  email?: string;
  clinics: ClinicRef[];
  userType: "Regular" | "Premium";
  status: "Active" | "Pending" | "Suspended";
  createdAt?: unknown;
  updatedAt?: unknown;
};

const normalize = (str: string) =>
  str?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

// ---------- Component ----------
export default function ClinicsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<"doctor" | "clinic" | "admin" | "">("doctor");
  const [doctors, setDoctors] = useState<DoctorDoc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  // All clinics cached client-side for instant autocomplete
  const [allClinics, setAllClinics] = useState<ClinicSuggestion[]>([]);

  const [deleteDoctorName, setDeleteDoctorName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Subscribe once; no per-keystroke queries anymore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clinics"), (snap) => {
      const list: ClinicSuggestion[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || "",
          address: data.address || "",
          contact: data.contact || "",
          type: (data.type as any) || "Clinic",
        };
      });
      setAllClinics(list);
    });
    return () => unsub();
  }, []);

  const [form, setForm] = useState<{
    firstName: string;
    middleName: string;
    lastName: string;
    titles: string;
    specializations: string[];
    contact: string;
    email: string;
    clinicEntries: ClinicEntry[];
    userType: "Regular" | "Premium";
    status: "Active" | "Pending" | "Suspended";
  }>({
    firstName: "",
    middleName: "",
    lastName: "",
    titles: "",
    specializations: [],
    contact: "",
    email: "",
    clinicEntries: [{ name: "", address: "", type: "Clinic", doctorContact: "" }],
    userType: "Regular",
    status: "Active",
  });

  // ---------- Live list ----------
  useEffect(() => {
    const q = query(collection(db, "doctors"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DoctorDoc) }));
      setDoctors(list);
    });
    return () => unsub();
  }, []);

  // ---------- Handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClinicChange = (index: number, field: keyof ClinicEntry, value: string) => {
    const next = [...form.clinicEntries];
    if (field === "name") next[index].clinicId = undefined;
    next[index] = { ...next[index], [field]: value };
    setForm((prev) => ({ ...prev, clinicEntries: next }));
  };

  const addClinic = () =>
    setForm((prev) => {
      const last = prev.clinicEntries[prev.clinicEntries.length - 1];
      if (!last.name.trim()) return prev; // don’t add if last is still empty
      return {
        ...prev,
        clinicEntries: [
          ...prev.clinicEntries,
          { name: "", address: "", type: "Clinic", doctorContact: "" },
        ],
      };
    });



  const removeClinic = (index: number) => {
    setForm((prev) => ({
      ...prev,
      clinicEntries: prev.clinicEntries.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      middleName: "",
      lastName: "",
      titles: "",
      specializations: [],
      contact: "",
      email: "",
      clinicEntries: [{ name: "", address: "", type: "Clinic", doctorContact: "" }],
      userType: "Regular",
      status: "Active",
    });
    setEditingId(null);
    setOpenSection("doctor");
    setAlert(null);
  };

  // ---------- Duplicate detection ----------
  const findDuplicateDoctorId = async (
    firstName: string,
    middleName: string,
    lastName: string,
    ignoreId?: string | null
  ) => {
    const snap = await getDocs(collection(db, "doctors"));
    const nf = normalize(firstName);
    const nm = normalize(middleName);
    const nl = normalize(lastName);

    for (const d of snap.docs) {
      if (ignoreId && d.id === ignoreId) continue;
      const data = d.data() as DoctorDoc;
      const df = normalize(data.firstName);
      const dm = normalize(data.middleName || "");
      const dl = normalize(data.lastName);
      if (df === nf && (dl === nl || dl === nm || dm === nl)) return d.id;
    }
    return null;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // --- Validation ---
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setAlert("⚠️ Please enter the doctor's full name.");
      setLoading(false);
      return;
    }

    if (form.specializations.length === 0) {
      setAlert("⚠️ Please select at least one specialization.");
      setLoading(false);
      return;
    }

    if (form.clinicEntries.every((c) => !c.name.trim())) {
      setAlert("⚠️ Please enter at least one clinic.");
      setLoading(false);
      return;
    }

    const hasContact =
      form.contact.trim() ||
      form.email.trim() ||
      form.clinicEntries.some((c) => c.doctorContact?.trim());
    if (!hasContact) {
      setAlert("⚠️ Please provide at least one contact number or email.");
      setLoading(false);
      return;
    }

    // Prevent duplicate clinic names for the same doctor
    const clinicNames = form.clinicEntries
      .map((c) => normalize(c.name))
      .filter((n) => n.length > 0);
    const uniqueNames = new Set(clinicNames);
    if (uniqueNames.size !== clinicNames.length) {
      setAlert("⚠️ You’ve added the same clinic more than once.");
      setLoading(false);
      return;
    }


    try {
      const dupId = await findDuplicateDoctorId(form.firstName, form.middleName, form.lastName, editingId);
      if (dupId) {
        setAlert("⚠️ A doctor with a similar name already exists.");
        setLoading(false);
        return;
      }

      const clinicRefs: ClinicRef[] = [];
      for (const entry of form.clinicEntries) {
        const rawName = entry.name?.trim();
        if (!rawName) continue;

        let clinicId = entry.clinicId;
        let finalName = rawName;
        const nameLower = normalize(rawName);

        if (!clinicId) {
          const clinicsQ = query(
            collection(db, "clinics"),
            orderBy("nameLower"),
            startAt(nameLower),
            endAt(nameLower + "\uf8ff"),
            limit(5)
          );
          const found = await getDocs(clinicsQ);
          const matched = found.docs.find((d) => (d.data() as any).nameLower === nameLower);
          if (matched) {
            clinicId = matched.id;
            finalName = (matched.data() as any).name || rawName;
          } else {
            const newClinic = await addDoc(collection(db, "clinics"), {
              name: rawName,
              nameLower,
              address: entry.address || "",
              type: "Clinic",
              createdAt: serverTimestamp(),
            });
            clinicId = newClinic.id;
          }
        }

        clinicRefs.push({ clinicId: clinicId!, name: finalName });
      }

      const doctorPayload: Omit<DoctorDoc, "id"> = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        titles: form.titles,
        specializations: form.specializations,
        contact: form.contact,
        email: form.email,
        clinics: clinicRefs,
        userType: form.userType,
        status: form.status,
        ...(editingId ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
      };

      if (editingId) {
        await updateDoc(doc(db, "doctors", editingId), doctorPayload);
        setAlert("✅ Changes saved.");
      } else {
        await addDoc(collection(db, "doctors"), doctorPayload);
        setAlert("✅ Doctor successfully registered!");
      }

      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 600);
    } catch (err) {
      console.error(err);
      setAlert("❌ Error saving data.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete doctor ----------
  const handleDelete = (id: string) => {
    const doc = doctors.find((d) => d.id === id);
    if (doc) setDeleteDoctorName(formattedDoctorName(doc));
    setIsModalOpen(false); // close form first
    setTimeout(() => {
      setDeleteId(id);
      setShowDeleteModal(true);
    }, 300); // wait for modal animation to close
  };


  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, "doctors", deleteId));
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // ---------- Edit ----------
  const handleEdit = (id: string) => {
    const item = doctors.find((d) => d.id === id);
    if (!item) return;
    setForm({
      firstName: item.firstName || "",
      middleName: item.middleName || "",
      lastName: item.lastName || "",
      titles: item.titles || "",
      specializations: item.specializations || [],
      contact: item.contact || "",
      email: item.email || "",
      clinicEntries:
        item.clinics?.map((c) => {
          const matchedClinic = allClinics.find((cl) => cl.id === c.clinicId);
          return {
            name: c.name,
            address: matchedClinic?.address || "",
            contact: matchedClinic?.contact || "",
            type: matchedClinic?.type || "Clinic",
            clinicId: c.clinicId,
          };
        }) || [{ name: "", address: "", contact: "", type: "Clinic" }],

      userType: item.userType || "Regular",
      status: item.status || "Active",
    });
    setEditingId(id);
    setIsModalOpen(true);
    setOpenSection("doctor");
  };

  const formattedDoctorName = (d: DoctorDoc) =>
    [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");

  // ---------- Clinic Autocomplete ----------
  const ClinicAutocomplete = React.memo(function ClinicAutocomplete({
    index,
    value,
    allClinics,
    onSelect,
    onChange,
    disabled = false,
  }: {
    index: number;
    value: string;
    allClinics: ClinicSuggestion[];
    onSelect: (s: ClinicSuggestion) => void;
    onChange: (val: string) => void;
    disabled?: boolean;
  }) {

    const [term, setTerm] = useState(value || "");
    const [open, setOpen] = useState(false);
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [clickedSuggestion, setClickedSuggestion] = useState(false); // ✅ NEW
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
      setTerm(value || "");
    }, [value]);

    // Debounce user typing
    useEffect(() => {
      const t = setTimeout(() => setDebouncedTerm(term), 200);
      return () => clearTimeout(t);
    }, [term]);

    // Click outside to close
    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (!containerRef.current) return;
        if (!containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setIsFocused(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // Filter local suggestions
    const suggestions = useMemo(() => {
      const t = normalize(debouncedTerm);
      if (t.length < 2) return [];
      return allClinics.filter((c) => normalize(c.name).includes(t)).slice(0, 8);
    }, [debouncedTerm, allClinics]);

    // Control dropdown visibility
    useEffect(() => {
      if (isFocused && debouncedTerm.length >= 2 && suggestions.length > 0) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    }, [isFocused, debouncedTerm, suggestions]);

    return (
      <div className="relative" ref={containerRef}>
        <input
          placeholder="Clinic Name"
          className={`w-full border border-gray-300 rounded-lg px-3 pr-8 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary focus:outline-none ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
            }`}
          value={term}
          onChange={(e) => !disabled && setTerm(e.target.value)}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => {
            if (clickedSuggestion || disabled) {
              setClickedSuggestion(false);
              return;
            }
            setIsFocused(false);
            onChange(term);
          }}
          disabled={disabled}
        />


        <AnimatePresence>
          {open && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-md mt-1 w-full max-h-60 overflow-auto"
            >
              <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100">
                Did you mean:
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => setClickedSuggestion(true)} // ✅ prevent blur first
                  onClick={() => {
                    onSelect(s); // parent handles clinic fill
                    setTerm(s.name);
                    setOpen(false);
                    setIsFocused(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium text-gray-800">{s.name}</div>
                  <div className="text-gray-500 text-xs">
                    {(s.type as any) || "Clinic"}
                    {s.address ? ` • ${s.address}` : ""}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });




  // ---------- UI ----------
  return (
    <div className="w-full px-4 sm:px-8 md:px-10 lg:px-12 mx-auto">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Clinics</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primaryDark text-white text-sm sm:text-base px-4 py-3 sm:py-2 rounded-md text-center transition cursor-pointer w-full sm:w-auto"
        >
          + Add Doctor
        </button>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Registered Doctors</h2>
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Specialization</th>
                <th className="px-6 py-3">Clinics</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500 italic">
                    No doctors registered yet.
                  </td>
                </tr>
              ) : (
                doctors.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => handleEdit(item.id!)}
                  >
                    <td className="px-6 py-3 font-medium text-primary">{formattedDoctorName(item)}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {item.specializations?.length ? item.specializations.join(", ") : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-600 whitespace-pre-line">
                      {item.clinics?.length ? item.clinics.map((c) => c.name).join("\n") : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>

                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View — simplified list */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {doctors.length === 0 ? (
            <div className="text-center text-gray-500 italic py-6">
              No doctors registered yet.
            </div>
          ) : (
            doctors.map((item) => (
              <div
                key={item.id}
                onClick={() => handleEdit(item.id!)}
                className="flex justify-between items-center py-4 px-3 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
              >
                <div>
                  <div className="font-medium text-primary">
                    {formattedDoctorName(item)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.specializations?.length ? item.specializations[0] : ""}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : item.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        itemName={
          deleteId
            ? `Dr. ${doctors.find((d) => d.id === deleteId)?.firstName || ""} ${doctors.find((d) => d.id === deleteId)?.lastName || ""
            }`
            : undefined
        }
      />


      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex justify-center items-end sm:items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 80 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingId ? "Doctor Profile" : "Register New Doctor"}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-800 text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {alert && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-2 rounded mb-3 text-sm">
                  {alert}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Doctor Info */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "doctor" ? "" : "doctor")}
                    className="w-full flex justify-between items-center p-4 font-semibold text-[var(--color-primary)] cursor-pointer"
                  >
                    <span>Doctor Information</span>
                    <span>{openSection === "doctor" ? "−" : "+"}</span>
                  </button>

                  {openSection === "doctor" && (
                    <div className="p-4 pt-0 space-y-3">
                      {/* Name Fields */}
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
                            className={`w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                              ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                              : "border border-gray-300"
                              }`}
                            value={(form as any)[field]}
                            onChange={handleChange}
                            disabled={editingId ? !isEditing : false}
                            required={field !== "middleName"}
                          />
                        ))}
                      </div>

                      {/* Titles */}
                      <input
                        name="titles"
                        placeholder="Post-nominal Titles"
                        className={`w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                          ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                          : "border border-gray-300"
                          }`}
                        value={form.titles}
                        onChange={handleChange}
                        disabled={editingId ? !isEditing : false}
                      />

                      {/* Specializations */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specializations
                        </label>

                        {editingId && !isEditing ? (
                          // View Mode (show only tags)
                          <div className="flex flex-wrap gap-2 border border-gray-100 bg-gray-50 rounded-lg px-2 py-2">
                            {form.specializations.length > 0 ? (
                              form.specializations.map((spec, index) => (
                                <span
                                  key={index}
                                  className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full"
                                >
                                  {spec}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic text-sm">None</span>
                            )}
                          </div>
                        ) : (
                          // Edit Mode
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
                                      specializations: prev.specializations.filter((_, i) => i !== index),
                                    }))
                                  }
                                  className="text-primary hover:text-primaryDark cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}

                            <select
                              className="bg-transparent focus:outline-none text-sm cursor-pointer"
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value && !form.specializations.includes(value)) {
                                  setForm((prev) => ({
                                    ...prev,
                                    specializations: [...prev.specializations, value],
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
                        )}
                      </div>

                      {/* Email */}
                      <input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        className={`w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                          ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                          : "border border-gray-300"
                          }`}
                        value={form.email}
                        onChange={handleChange}
                        disabled={editingId ? !isEditing : false}
                      />
                    </div>
                  )}
                </div>

                {/* Clinics Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "clinic" ? "" : "clinic")}
                    className="w-full flex justify-between items-center p-4 font-semibold text-[var(--color-primary)] cursor-pointer"
                  >
                    <span>Clinic Information</span>
                    <span>{openSection === "clinic" ? "−" : "+"}</span>
                  </button>

                  {openSection === "clinic" && (
                    <div className="p-4 pt-0 space-y-3">
                      {form.clinicEntries.map((c, i) => (
                        <div
                          key={i}
                          className={`relative border rounded-lg p-3 mb-3 shadow-sm ${editingId && !isEditing ? "bg-gray-50 border-gray-200" : "border-gray-300"
                            }`}
                        >
                          <ClinicAutocomplete
                            index={i}
                            value={c.name}
                            allClinics={allClinics}
                            onChange={(val) => handleClinicChange(i, "name", val)}
                            onSelect={(s) => {
                              const next = [...form.clinicEntries];
                              next[i] = {
                                ...next[i],
                                name: s.name,
                                clinicId: s.id,
                                address: s.address || "",
                                type: "Clinic",
                              };
                              setForm((prev) => ({ ...prev, clinicEntries: next }));
                            }}
                            disabled={editingId ? !isEditing : false}
                          />

                          <input
                            placeholder="Clinic Address"
                            value={c.address}
                            onChange={(e) => handleClinicChange(i, "address", e.target.value)}
                            disabled={
                              (editingId ? !isEditing : false) || !!c.clinicId
                            }
                            className={`w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${(editingId && !isEditing) || c.clinicId
                                ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                                : "border border-gray-300"
                              }`}
                          />
                          {form.clinicEntries.length > 1 && isEditing && (
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => removeClinic(i)}
                                className="text-[var(--color-brandRed)] text-xs hover:underline cursor-pointer"
                              >
                                Remove clinic
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {(!editingId || isEditing) && (
                        <button
                          type="button"
                          onClick={addClinic}
                          className="text-primary text-sm font-medium hover:underline cursor-pointer"
                        >
                          + Add Another Location
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Admin Section */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "admin" ? "" : "admin")}
                    className="w-full flex justify-between items-center p-4 font-semibold text-[var(--color-primary)] cursor-pointer"
                  >
                    <span>Admin Section</span>
                    <span>{openSection === "admin" ? "−" : "+"}</span>
                  </button>

                  {openSection === "admin" && (
                    <div className="p-4 pt-0 space-y-3">
                      {["userType", "status"].map((field) => (
                        <select
                          key={field}
                          name={field}
                          value={(form as any)[field]}
                          onChange={handleChange}
                          disabled={editingId ? !isEditing : false}
                          className={`w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary cursor-pointer ${editingId && !isEditing
                            ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                            : "border border-gray-300"
                            }`}
                        >
                          {field === "userType" ? (
                            <>
                              <option>Regular</option>
                              <option>Premium</option>
                            </>
                          ) : (
                            <>
                              <option>Active</option>
                              <option>Pending</option>
                              <option>Suspended</option>
                            </>
                          )}
                        </select>
                      ))}
                    </div>
                  )}
                </div>


                {/* Footer buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                  {/* Left side — Delete (only when editing existing doctor) */}
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingId)}
                      className="flex items-center gap-1 text-[var(--color-brandRed)] text-sm font-medium hover:underline"
                    >
                      <Trash2 size={14} /> Delete Doctor
                    </button>
                  )}

                  {/* Right side — Cancel and Save */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>

                    {editingId ? (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (isEditing) {
                            handleSubmit(new Event("submit") as any);
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        className={`px-4 py-2 rounded-md transition ${loading
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : isEditing
                            ? "bg-primary text-white hover:bg-primaryDark"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                      >
                        {loading ? "Saving..." : isEditing ? "Save Changes" : "Edit"}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded-md transition ${loading
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primaryDark"
                          }`}
                      >
                        {loading ? "Saving Clinic..." : "Save Clinic"}
                      </button>
                    )}
                  </div>
                </div>


              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}