"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const requiredFields = ["order_id", "product_name", "uuid", "ingested_at", "version", "client_name"];

const fieldGroups: Record<string, string[]> = {
  "🧾 Order Info": [
    "order_date", "expected_delivery_date", "actual_delivery_date", "order_status", "total_price", "currency"
  ],
  "👥 Customer Info": ["customer_id", "customer_name"],
  "📦 Product Info": ["product_id", "product_category", "unit_price", "quantity"],
  "🏭 Supplier Info": ["supplier_id", "supplier_name"],
  "🏬 Warehouse Info": ["warehouse_id", "warehouse_location"],
  "📤 Shipment Info": [
    "shipment_id", "shipment_method", "tracking_number", "shipment_status"
  ],
  "🛠️ System Metadata (Required)": ["order_id", "product_name", "uuid", "ingested_at", "version", "client_name"]
};

export default function StartFreshPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState("");

  const toggleField = (field: string) => {
    if (requiredFields.includes(field)) return;
    setSelected((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!businessName) {
    alert("Please enter your business name.");
    return;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/schema-wizard/generate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: businessName.toLowerCase(),
      columns: [...requiredFields, ...selected],
    }),
  });

  if (res.ok) {
    const data = await res.json();
    const { download_url } = data;

    // Trigger browser download from MinIO
    const link = document.createElement("a");
    link.href = download_url;
    link.download = `${businessName}_data_template.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    localStorage.setItem("client_name", businessName.toLowerCase());
    router.push("/uploads");
  } else {
    const error = await res.json();
    alert(`Failed to generate schema: ${error.message || "Unknown error"}`);
  }
};

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-6 py-16 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            🧾 Start Fresh
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            Choose the data fields for your custom CSV template.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-200 space-y-10">
          <div>
            <label htmlFor="business-name" className="block text-lg font-semibold mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="business-name"
              type="text"
              placeholder="e.g. canes"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {Object.entries(fieldGroups).map(([group, fields]) => (
            <div key={group}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-1">{group}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <label key={field} className="flex items-center space-x-3 px-3 py-2 rounded transition">
                    <input
                      type="checkbox"
                      checked={requiredFields.includes(field) || selected.includes(field)}
                      disabled={requiredFields.includes(field)}
                      onChange={() => toggleField(field)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className={`text-gray-700 font-medium ${requiredFields.includes(field) ? 'opacity-70 italic' : ''}`}>
                      {field} {requiredFields.includes(field) ? "(required)" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-6">
            <button
              type="submit"
              className="w-full text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              🚀 Generate Template
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-gray-400 pt-8">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}