import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      {/* Header with Add Camp */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Camps Overview</h1>
        <Link
          href="/staff/camps/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          + Add New Camp
        </Link>
      </div>

      {/* Placeholder box */}
      <div className="bg-white rounded shadow p-6">
        <p className="text-gray-600">
          All active camp listings will appear here. Create one now.
        </p>
      </div>
    </div>
  );
}
