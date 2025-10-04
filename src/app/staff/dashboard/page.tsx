import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Overview</h1>
        <Link
          href="/staff/clinics"
          className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base px-4 py-2 rounded-md text-center transition"
        >
          + Register New Facility
        </Link>
      </div>

      {/* Content grid */}
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
    </div>
  );
}
