"use client";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string; // 👈 Added this
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Delete",
  message,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteModalProps) {
  // 👇 Dynamically adjust message
  const displayMessage =
    message ||
    (itemName
      ? `Are you sure you want to delete ${itemName}?`
      : "Are you sure you want to delete this item?");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex justify-center items-end sm:items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 80 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 text-sm mb-5">{displayMessage}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white transition ${
                  loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[var(--color-brandRed)] hover:bg-[var(--color-brandRedhover)]"
                }`}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}