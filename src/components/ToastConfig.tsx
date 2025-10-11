"use client";

import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Reusable toast trigger helpers
export const notify = {
  success: (msg: string) => toast.success(msg),
  warning: (msg: string) => toast.warning(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
};

// 🎨 Unified HealthLane Toast styling
export const ToastConfig = () => (
  <ToastContainer
    position="top-center"
    autoClose={3000}
    hideProgressBar={false}
    closeOnClick
    pauseOnFocusLoss
    draggable
    pauseOnHover
    transition={Slide}
    theme="light"
    toastStyle={{
      display: "flex",
      alignItems: "center",          // ✅ vertical centering
      gap: "8px",
      borderRadius: "10px",
      fontSize: "0.9rem",
      fontWeight: 400,               // ✅ lighter text
      padding: "18px 23px",
      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
      border: "1px solid #E5E5E5",
      lineHeight: "1.4",
    }}
    icon={({ type }) => {
      // ✅ custom minimal icons that stay vertically aligned
      const size = 18;
      switch (type) {
        case "success":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              fill="none"
              viewBox="0 0 24 24"
              stroke="#1BAE69"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          );
        case "warning":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              fill="none"
              viewBox="0 0 24 24"
              stroke="#B68900"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.72A1 1 0 002.76 21h18.48a1 1 0 00.85-1.42L13.6 3.86a1 1 0 00-1.7 0z" />
            </svg>
          );
        case "error":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              fill="none"
              viewBox="0 0 24 24"
              stroke="#D32F2F"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          );
        case "info":
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              fill="none"
              viewBox="0 0 24 24"
              stroke="#0067B8"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          );
        default:
          return null;
      }
    }}
    toastClassName={(context) => {
      switch (context?.type) {
        case "success":
          return "bg-[#E8F8EF] text-[#1BAE69] border border-[#1BAE69]";
        case "warning":
          return "bg-[#FFF8E5] text-[#B68900] border border-[#FFB400]";
        case "error":
          return "bg-[#FDECEC] text-[#D32F2F] border border-[#D32F2F]";
        case "info":
          return "bg-[#EAF4FF] text-[#0067B8] border border-[#0081BF]";
        default:
          return "bg-white text-gray-800 border border-gray-200";
      }
    }}
  />
);
