"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
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
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { auth } from "@/firebaseConfig";
import { storage } from "@/firebaseConfig";
import { Pencil, Trash2, ZoomIn } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { format } from "date-fns";



// Put this right after your imports, before your component starts
const DEFAULT_CITY = "Naga City";
const DEFAULT_PROVINCE = "Camarines Sur";


// ---------- Types ----------
type FacilityType = "Clinic" | "Laboratory" | "Hospital";

type ClinicRef = { clinicId: string; name: string };

type ClinicEntry = {
  name: string;
  buildingStreet: string;
  city: string;
  province: string;
  type: FacilityType;
  clinicId?: string;
  doctorContact?: string;
};

type ClinicSuggestion = {
  id: string;
  name: string;
  buildingStreet?: string;
  city?: string;
  province?: string;
  contact?: string;
  type?: FacilityType;
};

type DoctorDoc = {
  id?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension?: string; // e.g., Jr., Sr., III
  profilePicPath?: string | null;
  profilePicUrl?: string; // derived for display
  profilePicUploadedAt?: { seconds: number } | null;
  titles?: string;
  specializations: string[];
  contact?: string;
  email?: string;
  clinics: ClinicRef[];
  userType: "Regular" | "Premium";
  status: "Active" | "Pending" | "Suspended";
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  prcIdPath?: string | null;
  prcIdUploadedAt?: { seconds: number } | null;
  prcExpiryDate?: string;
  // ✅ add this derived helper for display only
  prcIdUrl?: string;
};

const normalize = (str: string) =>
  str?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

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

  // For PRC image management
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [uploadingPrc, setUploadingPrc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [prcUploadProgress, setPrcUploadProgress] = useState<number | null>(null);



  const [deleteDoctorName, setDeleteDoctorName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [showCityDropdown, setShowCityDropdown] = useState(false);


  // ---------- Filters ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [activeStatus, setActiveStatus] = useState<"Pending" | "Active" | "Suspended" | "All">("All");

  console.log("Current user:", auth.currentUser);

  useEffect(() => {
    const savedCities = localStorage.getItem("selectedCities");
    const savedStatus = localStorage.getItem("activeStatus");
    if (savedCities) setSelectedCities(JSON.parse(savedCities));
    if (savedStatus) setActiveStatus(savedStatus as typeof activeStatus);
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedCities", JSON.stringify(selectedCities));
    localStorage.setItem("activeStatus", activeStatus);
  }, [selectedCities, activeStatus]);


  // Extract unique city names for filter dropdown
  const cityOptions = useMemo(() => {
    const unique = new Set(allClinics.map((c) => c.city || DEFAULT_CITY));
    return Array.from(unique).sort();
  }, [allClinics]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative")) setShowCityDropdown(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);


  // Subscribe once; no per-keystroke queries anymore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clinics"), (snap) => {
      const list: ClinicSuggestion[] = snap.docs.map((d) => {
        const data = d.data() as {
          name?: string;
          buildingStreet?: string;
          city?: string;
          province?: string;
          contact?: string;
          type?: FacilityType;
        };
        return {
          id: d.id,
          name: data.name || "",
          buildingStreet: data.buildingStreet || "",
          city: data.city || DEFAULT_CITY,
          province: data.province || DEFAULT_PROVINCE,
          contact: data.contact || "",
          type: (data.type ?? "Clinic") as FacilityType,
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
    nameExtension?: string;
    titles: string;
    specializations: string[];
    contact: string;
    email: string;
    clinicEntries: ClinicEntry[];
    userType: "Regular" | "Premium";
    status: "Active" | "Pending" | "Suspended";
    prcImageUrl?: string;
    prcExpiryDate?: string;
    clinics?: ClinicRef[];

    // 🟢 new fields
    prcIdPath?: string;
    prcIdUploadedAt?: { seconds: number } | null;
    prcIdUrl?: string;
    profilePicPath?: string;
    profilePicUrl?: string;
    profilePicUploadedAt?: { seconds: number } | null;
  }>({
    firstName: "",
    middleName: "",
    lastName: "",
    titles: "",
    specializations: [],
    contact: "",
    email: "",
    clinicEntries: [
      {
        name: "",
        buildingStreet: "",
        city: DEFAULT_CITY,
        province: DEFAULT_PROVINCE,
        type: "Clinic",
        doctorContact: "",
      },
    ],
    userType: "Regular",
    status: "Active",
    prcImageUrl: "",
    prcExpiryDate: "",

    // 🟢 initial values
    prcIdPath: "",
    prcIdUploadedAt: null,
    prcIdUrl: "",
  });



  // ---------- Live list ----------
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "doctors"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() as DoctorDoc;
          let prcIdUrl: string | undefined;

          if (data.prcIdPath) {
            try {
              prcIdUrl = await getDownloadURL(ref(storage, data.prcIdPath));
            } catch (err) {
              console.error("⚠️ Failed to fetch PRC ID image:", err);
            }
          }

          return { id: d.id, ...data, prcIdUrl };

        })
      );

      setDoctors(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);



  // ---------- Derived filtered list ----------
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {

      // Search filter (multi-term, across first/middle/last/specs/clinics)
      const matchSearch = (() => {
        const q = normalize(searchTerm);
        if (!q) return true; // no query → always match

        // Split the query into words ("joseph aluzan" -> ["joseph","aluzan"])
        const terms = q.split(/\s+/).filter(Boolean);

        // One big searchable string for this doctor
        const fullText = normalize(
          [
            doc.firstName,
            doc.middleName ?? "",
            doc.lastName,
            doc.specializations.join(" "),
            ...doc.clinics.map((c) => c.name),
          ].join(" ")
        );

        // Every term must appear somewhere (order doesn't matter)
        return terms.every((t) => fullText.includes(t));
      })();


      // City filter
      const matchCity =
        selectedCities.length === 0 ||
        doc.clinics.some((c) =>
          allClinics.some(
            (clinic) =>
              clinic.id === c.clinicId &&
              selectedCities.includes(clinic.city || DEFAULT_CITY)
          )
        );

      // Status filter
      const matchStatus =
        activeStatus === "All" || doc.status === activeStatus;

      return matchSearch && matchCity && matchStatus;
    });
  }, [doctors, searchTerm, selectedCities, activeStatus, allClinics]);

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
          {
            name: "",
            buildingStreet: "",
            city: DEFAULT_CITY,
            province: DEFAULT_PROVINCE,
            type: "Clinic",
            doctorContact: "",
          },
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
      clinicEntries: [
        {
          name: "",
          buildingStreet: "",
          city: DEFAULT_CITY,
          province: DEFAULT_PROVINCE,
          type: "Clinic",
          doctorContact: "",
        },
      ],
      userType: "Regular",
      status: "Active",
    });
    setEditingId(null);
    setOpenSection("doctor");
    setAlert(null);
    setIsEditing(false); // ensure edit mode always resets
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

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/(^|\s|[-])\w/g, (match) => match.toUpperCase()) // capitalize after space or hyphen
      .replace(/'S\b/g, "'s") // fix possessives like "Hermione's"
      .trim();
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

      // --- Clean capitalization before saving ---
      const cleanedForm = {
        ...form,
        firstName: toTitleCase(form.firstName),
        middleName: toTitleCase(form.middleName),
        lastName: toTitleCase(form.lastName),
        titles: form.titles.trim(),
        clinicEntries: form.clinicEntries.map((c) => ({
          ...c,
          name: toTitleCase(c.name),
          buildingStreet: toTitleCase(c.buildingStreet),
          city: toTitleCase(c.city),
          province: toTitleCase(c.province),
        })),
      };

      const dupId = await findDuplicateDoctorId(cleanedForm.firstName, cleanedForm.middleName, cleanedForm.lastName, editingId);
      if (dupId) {
        setAlert("⚠️ A doctor with a similar name already exists.");
        setLoading(false);
        return;
      }

      const clinicRefs: ClinicRef[] = [];
      for (const entry of cleanedForm.clinicEntries) {
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
          const matched = found.docs.find((d) => {
            const data = d.data() as { nameLower?: string };
            return data.nameLower === nameLower;
          });
          if (matched) {
            const data = matched.data() as { name?: string };
            clinicId = matched.id;
            finalName = data.name || rawName;
          }
          else {
            const newClinic = await addDoc(collection(db, "clinics"), {
              name: rawName,
              nameLower,
              buildingStreet: entry.buildingStreet || "",
              city: entry.city || DEFAULT_CITY, // default for now
              province: entry.province || DEFAULT_PROVINCE, // default for now
              type: "Clinic",
              createdAt: serverTimestamp(),
            });
            clinicId = newClinic.id;
          }
        }

        clinicRefs.push({ clinicId: clinicId!, name: finalName });
      }

      // Get current logged-in staff user
      const user = auth.currentUser;

      // Preserve existing record (for partial edits like profile pic only)
      const existingDoctor = editingId
        ? doctors.find((d) => d.id === editingId)
        : undefined;


      const doctorPayload: Omit<DoctorDoc, "id"> = {
        firstName: cleanedForm.firstName,
        middleName: cleanedForm.middleName,
        lastName: cleanedForm.lastName,
        titles: cleanedForm.titles,
        specializations: cleanedForm.specializations,
        contact: cleanedForm.contact,
        email: cleanedForm.email,
        clinics: clinicRefs,
        userType: cleanedForm.userType,
        status: cleanedForm.status,
        prcIdPath: form.prcIdPath || existingDoctor?.prcIdPath || null,
        prcIdUploadedAt: form.prcIdUploadedAt || existingDoctor?.prcIdUploadedAt || null,

        nameExtension: cleanedForm.nameExtension || "",
        profilePicPath: form.profilePicPath || existingDoctor?.profilePicPath || null,
        profilePicUploadedAt: form.profilePicUploadedAt || existingDoctor?.profilePicUploadedAt || null,

        ...(editingId
          ? {
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || "system",
            updatedByName: user?.displayName || user?.email || "System",
          }
          : {
            createdAt: serverTimestamp(),
            createdBy: user?.uid || "system",
            createdByName: user?.displayName || user?.email || "System",
          }),
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
            buildingStreet: matchedClinic?.buildingStreet || "",
            city: matchedClinic?.city || DEFAULT_CITY,
            province: matchedClinic?.province || DEFAULT_PROVINCE,
            contact: matchedClinic?.contact || "",
            type: matchedClinic?.type || "Clinic",
            clinicId: c.clinicId,
          };
        }) || [
          {
            name: "",
            buildingStreet: "",
            city: DEFAULT_CITY,
            province: DEFAULT_PROVINCE,
            contact: "",
            type: "Clinic",
          },
        ],
      userType: item.userType || "Regular",
      status: item.status || "Active",
    });

    // ✅ Set existing PRC + new nameExtension
    setForm((prev) => ({
      ...prev,
      prcIdUrl: doctors.find((doc) => doc.id === id)?.prcIdUrl || "",
      nameExtension: item.nameExtension || "",
    }));

    // ✅ Load profile picture asynchronously
    (async () => {
      if (item.profilePicPath) {
        try {
          const url = await getDownloadURL(ref(storage, item.profilePicPath));
          setForm((prev) => ({
            ...prev,
            profilePicUrl: url,
            profilePicPath: item.profilePicPath || "",
          }));
        } catch (err) {
          console.warn("⚠️ Failed to load profile picture:", err);
        }
      } else {
        setForm((prev) => ({
          ...prev,
          profilePicUrl: "",
          profilePicPath: "",
        }));
      }
    })();

    setEditingId(id);
    setIsModalOpen(true);
    setOpenSection("doctor");
  };

  // -------- Handle PRC Replacement (Preview-only until Save) --------
  const handleReplacePrc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPrc(true);
      const storageRef = ref(storage, `prcIDs/temp/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snap) => setPrcUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        (err) => {
          console.error("Upload error:", err);
          setPrcUploadProgress(null);
          setUploadingPrc(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          setForm((prev) => ({
            ...prev,
            prcIdUrl: url,
            prcIdPath: uploadTask.snapshot.ref.fullPath,
            prcIdUploadedAt: { seconds: Math.floor(Date.now() / 1000) },
          }));

          setPrcUploadProgress(null);
          setUploadingPrc(false);
        }
      );
    } catch (error) {
      console.error("Error uploading PRC ID preview:", error);
      setUploadingPrc(false);
    }
  };


  // -------- Handle PRC Removal --------
  const handleRemovePrc = async (doctor?: DoctorDoc) => {
    if (!confirm("Are you sure you want to remove this PRC ID?")) return;

    // 🧩 Fallback: use doctor from form if parameter is undefined
    const docId = doctor?.id || editingId;
    if (!docId) {
      console.error("❌ No valid doctor ID found for deletion.");
      return;
    }

    try {
      // 🟢 Use prcIdPath (the actual storage reference path)
      const filePath = doctor?.prcIdPath || form.prcIdPath;
      if (filePath) {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef).catch(() => null); // ignore if already deleted
      }

      // 🟢 Clear PRC-related fields in Firestore
      await updateDoc(doc(db, "doctors", docId), {
        prcIdPath: deleteField(),
        prcIdUploadedAt: deleteField(),
        prcExpiryDate: deleteField(),
      });

      // 🟢 Update local UI state
      setForm((prev) => ({
        ...prev,
        prcIdPath: "",
        prcIdUploadedAt: null,
        prcIdUrl: "",
      }));

    } catch (error) {
      console.error("❌ Error deleting PRC:", error);
    }
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
                    {(s.type as FacilityType) || "Clinic"}
                    {s.buildingStreet ? ` • ${s.buildingStreet}` : ""}
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

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Clinics</h1>

        {/* Desktop: full button */}
        <button
          onClick={() => {
            resetForm();
            setSearchTerm("");
            setIsModalOpen(true);
          }}
          className="hidden sm:block bg-primary hover:bg-primaryDark text-white text-sm px-4 py-2 rounded-md transition"
        >
          + Add Doctor
        </button>

        {/* Mobile: compact green square button */}
        <button
          onClick={() => {
            resetForm();
            setSearchTerm("");
            setIsModalOpen(true);
          }}
          className="sm:hidden bg-primary hover:bg-primaryDark text-white font-extrabold text-[1.5rem] leading-none w-11 h-11 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          aria-label="Add Doctor"
        >
          +
        </button>
      </div>


      {/* Search + Location Filter + Tabs */}
      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by doctor, specialization, or clinic..."
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
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Location Multi-Select */}
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

          {/* Dropdown */}
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


      {/* Status Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 text-sm font-medium">
        {["Pending", "Active", "Suspended", "All"].map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status as typeof activeStatus)}
            className={`pb-2 ${activeStatus === status
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {status === "All"
              ? `All (${doctors.length})`
              : `${status} (${doctors.filter((d) => d.status === status).length
              })`}
          </button>
        ))}
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
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500 italic">
                    No doctors registered yet.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 hover:bg-gray-50 hover:-translate-y-[1px] transition-all duration-150 cursor-pointer"
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
          {loading ? (
            <div className="space-y-3 p-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between border-b border-gray-100 pb-3">
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
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center text-gray-500 italic py-6">
              No doctors registered yet.
            </div>
          ) : (
            filteredDoctors.map((item) => (
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
                      setIsEditing(false); // reset edit mode
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
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          name="firstName"
                          placeholder="First Name"
                          className={`capitalize w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                            ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                            : "border border-gray-300"
                            }`}
                          value={form.firstName}
                          onChange={handleChange}
                          disabled={editingId ? !isEditing : false}
                          required
                        />

                        <input
                          name="middleName"
                          placeholder="Middle Name"
                          className={`capitalize w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                            ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                            : "border border-gray-300"
                            }`}
                          value={form.middleName}
                          onChange={handleChange}
                          disabled={editingId ? !isEditing : false}
                        />

                        <input
                          name="lastName"
                          placeholder="Last Name"
                          className={`capitalize w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                            ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                            : "border border-gray-300"
                            }`}
                          value={form.lastName}
                          onChange={handleChange}
                          disabled={editingId ? !isEditing : false}
                          required
                        />

                        {/* 🟢 New field — optional suffix */}
                        <input
                          name="nameExtension"
                          placeholder="Suffix (Jr., III, etc.)"
                          className={`uppercase w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
                            ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                            : "border border-gray-300"
                            }`}
                          value={form.nameExtension}
                          onChange={handleChange}
                          disabled={editingId ? !isEditing : false}
                        />
                      </div>


                      {/* Titles */}
                      <input
                        name="titles"
                        placeholder="Post-nominal Titles"
                        className={`uppercase w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${editingId && !isEditing
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

                      {/* 🩺 Profile + PRC ID side by side */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-6">
                        {/* Profile Picture */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Picture
                          </label>

                          {form.profilePicUrl ? (
                            <div className="relative inline-block">
                              <img
                                src={form.profilePicUrl}
                                alt="Profile Picture"
                                className="w-24 h-24 rounded-full border border-gray-200 shadow-sm object-cover cursor-pointer hover:opacity-90"
                                onClick={() => setZoomedImage(form.profilePicUrl ?? "")}
                              />
                              <button
                                onClick={() => setZoomedImage(form.profilePicUrl ?? "")}
                                className="absolute bottom-1 right-1 bg-white/80 p-1 rounded-full shadow hover:bg-white"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
                              No photo
                            </div>
                          )}

                          {uploadProgress !== null && (
                            <div className="w-24 h-1 bg-gray-200 rounded-full mt-1">
                              <div
                                className="h-1 bg-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          )}


                          {isEditing && (
                            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                              <label className="flex items-center gap-1 hover:text-primary cursor-pointer">
                                <Pencil className="w-3 h-3" />
                                {form.profilePicUrl ? "Replace" : "Upload"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const storageRef = ref(storage, `profilePics/temp/${Date.now()}_${file.name}`);
                                    const uploadTask = uploadBytesResumable(storageRef, file);
                                    uploadTask.on(
                                      "state_changed",
                                      (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                                      (err) => {
                                        console.error("Upload error:", err);
                                        setUploadProgress(null);
                                      },
                                      async () => {
                                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                                        setForm((prev) => ({
                                          ...prev,
                                          profilePicUrl: url,
                                          profilePicPath: uploadTask.snapshot.ref.fullPath,
                                          profilePicUploadedAt: { seconds: Math.floor(Date.now() / 1000) },
                                        }));
                                        setUploadProgress(null);
                                      }
                                    );
                                  }}
                                />
                              </label>

                              {form.profilePicUrl && (
                                <button
                                  onClick={() =>
                                    setForm((prev) => ({
                                      ...prev,
                                      profilePicUrl: "",
                                      profilePicPath: "",
                                      profilePicUploadedAt: null,
                                    }))
                                  }
                                  className="flex items-center gap-1 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* PRC ID */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PRC ID
                          </label>

                          <div className="relative inline-block">
                            {form.prcIdUrl ? (
                              <>
                                <img
                                  src={form.prcIdUrl}
                                  alt="PRC ID"
                                  className="w-32 h-auto rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-90"
                                  onClick={() => setZoomedImage(form.prcIdUrl ?? "")}
                                />
                                <button
                                  onClick={() => setZoomedImage(form.prcIdUrl ?? "")}
                                  className="absolute bottom-1 right-1 bg-white/80 p-1 rounded-full shadow hover:bg-white"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-600" />
                                </button>
                              </>
                            ) : (
                              <div className="w-32 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
                                No image uploaded
                              </div>
                            )}
                          </div>

                          {prcUploadProgress !== null && (
                            <div className="w-32 h-1 bg-gray-200 rounded-full mt-1">
                              <div
                                className="h-1 bg-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${prcUploadProgress}%` }}
                              />
                            </div>
                          )}

                          {isEditing && (
                            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                              <label className="flex items-center gap-1 hover:text-primary cursor-pointer">
                                <Pencil className="w-3 h-3" />
                                {form.prcIdUrl ? "Replace" : "Upload"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleReplacePrc}
                                />
                              </label>

                              {form.prcIdUrl && (
                                <button
                                  onClick={() => handleRemovePrc(form as DoctorDoc)}
                                  className="flex items-center gap-1 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>



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
                                buildingStreet: s.buildingStreet || "",
                                city: s.city || DEFAULT_CITY,
                                province: s.province || DEFAULT_PROVINCE,
                                type: "Clinic",
                              };
                              setForm((prev) => ({ ...prev, clinicEntries: next }));
                            }}
                            disabled={editingId ? !isEditing : false}
                          />

                          <input
                            placeholder="Building & Street Address"
                            value={c.buildingStreet}
                            onChange={(e) => handleClinicChange(i, "buildingStreet", e.target.value)}
                            disabled={(editingId ? !isEditing : false) || !!c.clinicId}
                            className={`capitalize w-full rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-primary ${(editingId && !isEditing) || c.clinicId
                              ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                              : "border border-gray-300"
                              }`}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            <input
                              placeholder="City"
                              value={c.city}
                              onChange={(e) => handleClinicChange(i, "city", e.target.value)}
                              disabled={(editingId ? !isEditing : false) || !!c.clinicId}
                              className={`capitalize w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary ${(editingId && !isEditing) || c.clinicId
                                ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                                : "border border-gray-300"
                                }`}
                            />
                            <input
                              placeholder="Province"
                              value={c.province}
                              onChange={(e) => handleClinicChange(i, "province", e.target.value)}
                              disabled={(editingId ? !isEditing : false) || !!c.clinicId}
                              className={`capitalize w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary ${(editingId && !isEditing) || c.clinicId
                                ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                                : "border border-gray-300"
                                }`}
                            />
                          </div>

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
                          value={form[field as keyof typeof form] as string}
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
                            const fakeForm = document.createElement("form");
                            handleSubmit({ preventDefault: () => { }, currentTarget: fakeForm } as unknown as React.FormEvent<HTMLFormElement>);
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${loading
                          ? "bg-primary text-white opacity-80 cursor-wait"
                          : isEditing
                            ? "bg-primary text-white hover:bg-primaryDark"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                      >
                        {loading ? (
                          <>
                            Saving
                            <Spinner />
                          </>
                        ) : isEditing ? (
                          "Save Changes"
                        ) : (
                          "Edit"
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${loading
                          ? "bg-primary text-white opacity-80 cursor-wait"
                          : "bg-primary text-white hover:bg-primaryDark"
                          }`}
                      >
                        {loading ? (
                          <>
                            Saving
                            <Spinner />
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {editingId && (
                  <div className="text-xs text-gray-400 border-t border-gray-100 mt-4 pt-2">
                    <p>
                      Created by:{" "}
                      {doctors.find((d) => d.id === editingId)?.createdByName || "Unknown"}
                    </p>
                    <p>
                      Last updated by:{" "}
                      {doctors.find((d) => d.id === editingId)?.updatedByName || "—"}
                    </p>
                  </div>
                )}

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Modal Overlay */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
          >
            <motion.img
              src={zoomedImage}
              alt="Zoomed PRC ID"
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div >
  );
}