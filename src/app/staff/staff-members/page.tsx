"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth, storage } from "@/firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Trash2, Upload } from "lucide-react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { Timestamp, FieldValue } from "firebase/firestore";

function formatFirestoreDate(date?: Timestamp | FieldValue): string {
  if (!date) return "";
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  // It's still a serverTimestamp placeholder
  return "";
}

type RoleType = "owner" | "admin" | "staff";
type StatusType = "Pending" | "Active" | "On Leave" | "Resigned" | "Suspended" | "All";

interface StaffDoc {
  id?: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  role: RoleType;
  assignedCity?: string;
  status: Exclude<StatusType, "All">;
  photoURL?: string;

  // ✅ Firestore timestamps
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;

  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
}


export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRole, setActiveRole] = useState<RoleType | "All">("All");
  const [activeStatus, setActiveStatus] = useState<StatusType>("All");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<StaffDoc>({
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    phone: "",
    role: "staff",
    assignedCity: "",
    status: "Pending",
    photoURL: "",
  });

  // ---------- Firestore Subscription ----------
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("firstName", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as StaffDoc) }));
      setStaffList(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ---------- Derived Filters ----------
  const cityOptions = useMemo(() => {
    const cities = new Set(staffList.map((s) => s.assignedCity || "Naga City"));
    return Array.from(cities).sort();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return staffList.filter((s) => {
      // Role filter
      if (activeRole !== "All" && s.role !== activeRole) return false;

      // Status filter
      if (activeStatus !== "All" && s.status !== activeStatus) return false;

      // City filter
      if (
        selectedCities.length > 0 &&
        !selectedCities.includes(s.assignedCity || "Naga City")
      )
        return false;

      // Search term filter
      if (term) {
        const fields = [
          s.firstName,
          s.lastName,
          s.preferredName,
          s.email,
          s.assignedCity,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const words = term.split(/\s+/).filter(Boolean);
        if (!words.every((word) => fields.includes(word))) return false;
      }

      return true;
    });
  }, [staffList, searchTerm, activeRole, activeStatus, selectedCities]);


  // ---------- Handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      preferredName: "",
      email: "",
      phone: "",
      role: "staff",
      assignedCity: "",
      status: "Pending",
      photoURL: "",
    });
    setEditingId(null);
    setAlert(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setAlert("⚠️ Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      const payload: Omit<StaffDoc, "id"> = {
        ...form,
        firstName: capitalize(form.firstName),
        lastName: capitalize(form.lastName),
        preferredName: capitalize(form.preferredName || ""),
        assignedCity: capitalize(form.assignedCity || ""),
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "system",
        createdByName: user?.displayName || user?.email || "System",
      };

      if (editingId) {
        // When editing an existing staff record
        await updateDoc(doc(db, "users", editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || "system",
          updatedByName: user?.displayName || user?.email || "System",
        });
        setAlert("✅ Changes saved.");
      } else {
        // When adding a new staff record
        await addDoc(collection(db, "users"), payload);
        setAlert("✅ Staff added successfully!");
      }


      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 600);
    } catch (err) {
      console.error(err);
      setAlert("❌ Error saving data.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, "users", deleteId));
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleEdit = (id: string) => {
    const s = staffList.find((x) => x.id === id);
    if (!s) return;
    setForm(s);
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileRef = ref(storage, `staff_photos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    setUploadProgress(0); // start showing progress

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        setUploadProgress(null);
        setAlert("❌ Upload failed. Please try again.");
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setForm((prev) => ({ ...prev, photoURL: url }));
        setUploadProgress(null); // hide progress when done
      }
    );
  };


  const capitalize = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // Simple inline spinner component
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

  // ---------- UI ----------
  return (
    <div className="w-full px-4 sm:px-8 md:px-10 lg:px-12 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Staff</h1>

        {/* Desktop: full button */}
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="hidden sm:block bg-primary hover:bg-primaryDark text-white text-sm px-4 py-2 rounded-md transition"
        >
          + Add Staff
        </button>

        {/* Mobile: compact button */}
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="sm:hidden bg-primary hover:bg-primaryDark text-white font-extrabold text-[1.5rem] leading-none w-11 h-11 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          aria-label="Add Staff"
        >
          +
        </button>


      </div>



      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50 focus:bg-white transition"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
          </svg>
        </div>

        {/* Status Dropdown */}
        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value as StatusType)}
          className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary cursor-pointer w-full md:w-48"
        >
          {["All", "Active", "On Leave", "Resigned", "Suspended"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* Location Dropdown */}
        <div className="relative w-full md:w-64">
          <button
            onClick={() => setShowCityDropdown((p) => !p)}
            className="w-full border border-gray-200 bg-gray-50 hover:bg-white rounded-lg px-3 py-3 text-sm flex justify-between items-center focus:ring-2 focus:ring-primary transition"
          >
            <span className="truncate text-gray-700">
              {selectedCities.length === 0
                ? "Filter by location..."
                : `${selectedCities.length} selected`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 text-gray-500 transform transition ${showCityDropdown ? "rotate-180" : ""
                }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCityDropdown && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-60 overflow-auto text-sm">
              <div className="p-2 border-b border-gray-100 flex justify-between items-center">
                <button
                  className="text-xs text-gray-500 hover:underline"
                  onClick={() => setSelectedCities([])}
                >
                  Clear
                </button>
                <button
                  className="text-xs text-gray-500 hover:underline"
                  onClick={() => setSelectedCities([...cityOptions])}
                >
                  Select all
                </button>
              </div>
              {cityOptions.map((city) => (
                <label
                  key={city}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(city)}
                    onChange={() =>
                      setSelectedCities((prev) =>
                        prev.includes(city)
                          ? prev.filter((c) => c !== city)
                          : [...prev, city]
                      )
                    }
                    className="text-primary focus:ring-primary"
                  />
                  <span>{city}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 text-sm font-medium">
        {["All", "owner", "admin", "staff"].map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role as RoleType | "All")}
            className={`pb-2 ${activeRole === role
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {role === "All"
              ? `All (${staffList.length})`
              : `${capitalize(role)} (${staffList.filter((s) => s.role === role).length
              })`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Registered Staff</h2>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Staff Member</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">City</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // 🩶 shimmer skeleton loader (desktop)
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-t border-gray-100">
                    <td colSpan={5} className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                        <div className="flex flex-col gap-2 w-full">
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-2 bg-gray-100 rounded w-1/4"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500 italic">
                    No staff found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleEdit(s.id!)}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-3 flex items-center gap-3">
                      {s.photoURL ? (
                        <img
                          src={s.photoURL}
                          alt={s.firstName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {initials(s.preferredName || s.firstName)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-primary">
                          {s.preferredName || s.firstName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {`${s.firstName} ${s.lastName}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 capitalize">{s.role}</td>
                    <td className="px-6 py-3">{s.assignedCity || "—"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : s.status === "On Leave"
                            ? "bg-yellow-100 text-yellow-700"
                            : s.status === "Resigned"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-100 text-red-700"
                          }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{s.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Flat List Layout */}
        <div className="sm:hidden divide-y divide-gray-100 border-t border-b border-gray-100 px-3">
          {loading ? (
            // 🩶 shimmer skeleton loader (mobile)
            <div className="space-y-3 p-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center justify-between border-b border-gray-100 pb-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-2 bg-gray-100 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-gray-100 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center text-gray-500 italic py-6">
              No staff found.
            </div>
          ) : (
            filteredStaff.map((s) => (
              <div
                key={s.id}
                onClick={() => handleEdit(s.id!)}
                className="flex items-center justify-between py-3 px-1 cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  {s.photoURL ? (
                    <img
                      src={s.photoURL}
                      alt={s.firstName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      {initials(s.preferredName || s.firstName)}
                    </div>
                  )}

                  <div>
                    <div className="font-semibold text-gray-800">
                      {s.preferredName || s.firstName}
                    </div>
                    <div className="text-xs text-gray-500">{s.assignedCity || "—"}</div>
                    <div className="text-xs text-gray-400 italic">{capitalize(s.role)}</div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : s.status === "On Leave"
                      ? "bg-yellow-100 text-yellow-700"
                      : s.status === "Resigned"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  {s.status}
                </span>
              </div>
            ))
          )}
        </div>


      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        itemName={
          deleteId
            ? staffList.find((s) => s.id === deleteId)?.preferredName || "staff"
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
                  {editingId ? "Edit Staff" : "Add New Staff"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-800 text-lg"
                >
                  ✕
                </button>
              </div>

              {alert && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-2 rounded mb-3 text-sm">
                  {alert}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* --- Top Section: Photo + Names --- */}
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start mb-4">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center">
                    {form.photoURL ? (
                      <img
                        src={form.photoURL}
                        alt="avatar"
                        className="w-24 h-24 rounded-full object-cover mb-2 shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-2xl mb-2">
                        {initials(form.preferredName || form.firstName || "N")}
                      </div>
                    )}
                    <div className="flex flex-col items-center mt-1 w-full">
                      <label className="cursor-pointer text-sm text-primary hover:underline">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="flex items-center gap-1">
                          <Upload size={14} /> Upload Photo
                        </div>
                      </label>

                      {uploadProgress !== null && (
                        <div className="w-full mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Uploading... {uploadProgress.toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Name and City Fields */}
                  <div className="flex flex-col gap-3 w-[85%]">
                    <input
                      name="preferredName"
                      placeholder="Preferred Name"
                      value={form.preferredName}
                      onChange={handleChange}
                      className="text-lg font-semibold text-gray-800 border border-transparent focus:border-gray-300 focus:ring-0 px-2 py-1 rounded-md bg-gray-50 focus:bg-white transition"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          name="firstName"
                          placeholder=" "
                          value={form.firstName}
                          onChange={handleChange}
                          className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white transition"
                          required
                        />
                        <label className="absolute left-3 top-1.5 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all">
                          First Name
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          name="lastName"
                          placeholder=" "
                          value={form.lastName}
                          onChange={handleChange}
                          className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white transition"
                          required
                        />
                        <label className="absolute left-3 top-1.5 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all">
                          Last Name
                        </label>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        name="assignedCity"
                        placeholder=" "
                        value={form.assignedCity}
                        onChange={handleChange}
                        className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white transition"
                      />
                      <label className="absolute left-3 top-1.5 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all">
                        Location / Assigned City
                      </label>
                    </div>
                  </div>
                </div>


                <div className="h-px bg-gray-200 my-4"></div>

                {/* Contact Information */}
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h3>

                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      placeholder=" "
                      value={form.email}
                      onChange={handleChange}
                      className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white transition"
                      required
                    />
                    <label className="absolute left-3 top-1.5 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all">
                      Email Address
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      name="phone"
                      placeholder=" "
                      value={form.phone}
                      onChange={handleChange}
                      className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white transition"
                    />
                    <label className="absolute left-3 top-1.5 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all">
                      Phone Number
                    </label>
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-4"></div>

                <h3 className="text-sm font-semibold text-gray-700 mb-2">Role & Status</h3>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary w-full"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary w-full"
                >
                  <option>Pending</option>
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Resigned</option>
                  <option>Suspended</option>
                </select>

                <div className="flex justify-between items-center pt-4">
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingId)}
                      className="flex items-center gap-1 text-brandRed text-sm font-medium hover:underline"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : (
                    <div /> // keeps layout spacing even when delete isn’t visible
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${saving
                        ? "bg-primary text-white opacity-80 cursor-wait"
                        : "bg-primary text-white hover:bg-primaryDark"
                        }`}
                    >
                      {saving ? (
                        <>
                          Saving
                          <Spinner />
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>

                  </div>
                </div>

                {/* Audit Trail */}
                {(form.createdByName || form.updatedByName) && (
                  <div className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2 space-y-0.5">
                    {form.createdByName && (
                      <div>
                        Created by {form.createdByName}
                        {form.createdAt && (
                          <> on {formatFirestoreDate(form.createdAt)}</>
                        )}
                      </div>
                    )}
                    {form.updatedByName && (
                      <div>
                        Last edited by {form.updatedByName}
                        {form.updatedAt && (
                          <> on {formatFirestoreDate(form.updatedAt)}</>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}