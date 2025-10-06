"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Hospital, User2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OverviewPage() {
  const [stats, setStats] = useState({
    clinics: 0,
    doctors: 0,
    patients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [clinicsSnap, doctorsSnap, patientsSnap] = await Promise.all([
          getDocs(collection(db, "clinics")),
          getDocs(collection(db, "doctors")),
          getDocs(collection(db, "patients")),
        ]);

        setStats({
          clinics: clinicsSnap.size,
          doctors: doctorsSnap.size,
          patients: patientsSnap.size,
        });
      } catch (err) {
        console.error("Error fetching dashboard counts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const cards = [
    {
      label: "Clinics",
      value: stats.clinics,
      icon: <Hospital size={28} className="text-primary" />,
    },
    {
      label: "Doctors",
      value: stats.doctors,
      icon: <User2 size={28} className="text-primary" />,
    },
    {
      label: "Patients",
      value: stats.patients,
      icon: <Users size={28} className="text-primary" />,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-8 md:px-10 lg:px-12 mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {cards.map((card, i) => (
          <div
            key={i}
            className="relative flex items-center justify-between border border-gray-200 bg-white rounded-xl p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
          >
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />

            {/* Content */}
            <div className="pl-4">
              {loading ? (
                <div className="h-8 w-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin mb-1" />
              ) : (
                <motion.h2
                  key={card.value} // re-animate when value changes
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl font-semibold text-gray-900"
                >
                  <AnimatedNumber value={card.value} />
                </motion.h2>
              )}
              <p className="text-gray-600 font-medium mt-1">{card.label}</p>
            </div>

            <div className="bg-gray-50 rounded-full p-3 border border-gray-200 shadow-sm ml-4">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for future sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-600 text-sm">
        <p className="font-medium text-gray-800 mb-2">Coming Soon:</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Recent doctor registrations</li>
          <li>Most active cities</li>
          <li>Pending facility approvals</li>
        </ul>
      </div>
    </div>
  );
}

// ---------- Animated number component ----------
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = value / steps;

    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [value]);

  return <span>{display}</span>;
}