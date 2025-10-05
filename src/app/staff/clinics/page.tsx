"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp, query, getDocs } from "firebase/firestore";


export default function ClinicsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    titles: "",
    specializations: [] as string[],
    contact: "",
    email: "",
    clinics: [{ name: "", address: "", contact: "" }],
    userType: "Regular",
    status: "Active",
  });

  const [openSection, setOpenSection] = useState("doctor");

  // ------------------------------
  // FORM HANDLERS
  // ------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSpecializationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setForm({ ...form, specializations: selected });
  };

  const handleClinicChange = (index: number, field: string, value: string) => {
    const updated = [...form.clinics];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, clinics: updated });
  };

  const addClinic = () => {
    setForm({
      ...form,
      clinics: [...form.clinics, { name: "", address: "", contact: "" }],
    });
  };

  // ------------------------------
  // SUBMIT TO FIREBASE
  // ------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      // Normalize names for comparison
      const normalize = (str: string) =>
        str?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

      const [firstName, middleName, lastName] = form.fullName.split(" ");
      const q = query(collection(db, "clinics"));
      const snapshot = await getDocs(q);

      let duplicateFound = false;

      snapshot.forEach((doc) => {
        const data = doc.data() as { fullName?: string };
        if (!data.fullName) return;

        const [f, m, l] = data.fullName.split(" ");
        if (
          normalize(f) === normalize(firstName) &&
          (normalize(l) === normalize(lastName) ||
            normalize(l) === normalize(middleName))
        ) {
          duplicateFound = true;
        }
      });

      if (duplicateFound) {
        setAlert("⚠️ A doctor with a similar name already exists. Please review before adding.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "clinics"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      setAlert("✅ Clinic successfully registered!");
      setForm({
        fullName: "",
        titles: "",
        specializations: [],
        contact: "",
        email: "",
        clinics: [{ name: "", address: "", contact: "" }],
        userType: "Regular",
        status: "Active",
      });
      setLoading(false);
      setTimeout(() => setIsModalOpen(false), 1000);
    } catch (error) {
      console.error(error);
      setAlert("❌ Failed to save clinic data. Please try again.");
      setLoading(false);
    }
  };


  // ------------------------------
  // UI
  // ------------------------------

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Clinics</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primaryDark text-white text-sm sm:text-base px-4 py-2 rounded-md text-center transition"
        >
          + Add Clinic
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-medium text-gray-600">Total Patients</h2>
          <p className="text-2xl font-bold text-green-600 mt-2">132</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-medium text-gray-600">Upcoming Appointment</h2>
          <p className="text-2xl font-bold text-green-600 mt-2">8</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-medium text-gray-600">Active Clinics</h2>
          <p className="text-2xl font-bold text-green-600 mt-2">3</p>
        </div>
      </div>

      {/* MODAL */}
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
                <h2 className="text-lg font-semibold">Register New Clinic</h2>
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
                {/* STEP-BASED FORM */}
                <div className="space-y-4">
                  {/* Doctor Info Section */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === "doctor" ? "" : "doctor")}
                      className="w-full flex justify-between items-center p-4 font-medium text-gray-800"
                    >
                      <span className="flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          1
                        </span>
                        Doctor Information
                      </span>
                      <span>{openSection === "doctor" ? "−" : "+"}</span>
                    </button>

                    {openSection === "doctor" && (
                      <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
                        <input
                          name="fullName"
                          placeholder="Full Name"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                          value={form.fullName}
                          onChange={handleChange}
                          required
                        />
                        <input
                          name="titles"
                          placeholder="Post-nominal Titles"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
                                    setForm({
                                      ...form,
                                      specializations: form.specializations.filter((_, i) => i !== index),
                                    })
                                  }
                                  className="text-primary hover:text-primaryDark"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}

                            <select
                              className="bg-transparent focus:outline-none text-sm"
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value && !form.specializations.includes(value)) {
                                  setForm({
                                    ...form,
                                    specializations: [...form.specializations, value],
                                  });
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
                              ].map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            name="contact"
                            placeholder="Contact Number"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            value={form.contact}
                            onChange={handleChange}
                          />
                          <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            value={form.email}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clinic Info Section */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === "clinic" ? "" : "clinic")}
                      className="w-full flex justify-between items-center p-4 font-medium text-gray-800"
                    >
                      <span className="flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          2
                        </span>
                        Clinic Information
                      </span>
                      <span>{openSection === "clinic" ? "−" : "+"}</span>
                    </button>

                    {openSection === "clinic" && (
                      <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
                        {form.clinics.map((c, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3 shadow-sm">
                            <input
                              placeholder="Clinic Name"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary focus:outline-none"
                              value={c.name}
                              onChange={(e) => handleClinicChange(i, "name", e.target.value)}
                            />
                            <input
                              placeholder="Clinic Address"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary focus:outline-none"
                              value={c.address}
                              onChange={(e) => handleClinicChange(i, "address", e.target.value)}
                            />
                            <input
                              placeholder="Clinic Contact Number"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                              value={c.contact}
                              onChange={(e) => handleClinicChange(i, "contact", e.target.value)}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addClinic}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          + Add Another Location
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Admin Section */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === "admin" ? "" : "admin")}
                      className="w-full flex justify-between items-center p-4 font-medium text-gray-800"
                    >
                      <span className="flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          3
                        </span>
                        Admin Section
                      </span>
                      <span>{openSection === "admin" ? "−" : "+"}</span>
                    </button>

                    {openSection === "admin" && (
                      <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
                        <select
                          name="userType"
                          onChange={handleChange}
                          value={form.userType}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                          <option>Regular</option>
                          <option>Premium</option>
                        </select>
                        <select
                          name="status"
                          onChange={handleChange}
                          value={form.status}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                          <option>Active</option>
                          <option>Pending</option>
                          <option>Suspended</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primaryDark"
                    >
                      {loading ? "Saving..." : "Save Clinic"}
                    </button>
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