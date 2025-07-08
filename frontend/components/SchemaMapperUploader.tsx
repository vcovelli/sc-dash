"use client";

import { useState } from "react";
import Papa from "papaparse";

const groupedFields: Record<string, { value: string; label: string; description?: string }[]> = {
  // ... same as before ...
  "🧾 Order Info": [
    { value: "order_id", label: "Order ID" },
    { value: "order_date", label: "Order Date" },
    { value: "expected_delivery_date", label: "Expected Delivery Date" },
    { value: "actual_delivery_date", label: "Actual Delivery Date" },
    { value: "order_status", label: "Order Status" },
    { value: "total_price", label: "Total Price" },
    { value: "currency", label: "Currency" }
  ],
  "👥 Customer Info": [
    { value: "customer_id", label: "Customer ID" },
    { value: "customer_name", label: "Customer Name" }
  ],
  "📦 Product Info": [
    { value: "product_id", label: "Product ID / SKU" },
    { value: "product_name", label: "Product Name" },
    { value: "product_category", label: "Product Category" },
    { value: "unit_price", label: "Unit Price" },
    { value: "quantity", label: "Quantity" }
  ],
  "🏭 Supplier Info": [
    { value: "supplier_id", label: "Supplier ID" },
    { value: "supplier_name", label: "Supplier Name" }
  ],
  "🏬 Warehouse Info": [
    { value: "warehouse_id", label: "Warehouse ID" },
    { value: "warehouse_location", label: "Warehouse Location" }
  ],
  "📤 Shipment Info": [
    { value: "shipment_id", label: "Shipment ID" },
    { value: "shipment_method", label: "Shipment Method" },
    { value: "tracking_number", label: "Tracking Number" },
    { value: "shipment_status", label: "Shipment Status" }
  ],
  "🛠️ System Metadata": [
    { value: "uuid", label: "UUID" },
    { value: "version", label: "Version" },
    { value: "client_id", label: "Client Name" },
    { value: "ingested_at", label: "Ingested At" },
    { value: "last_updated", label: "Last Updated" },
    { value: "notes", label: "Notes" }
  ]
};

export default function SchemaMapperUploader() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        const headers = Object.keys(results.data[0] || {});
        setCsvHeaders(headers);
        setFile(file);
      }
    });
  };

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setMapping((prev) => ({ ...prev, [csvColumn]: targetField }));
  };

  const allMapped =
    csvHeaders.length > 0 &&
    csvHeaders.every((header) => mapping[header] && mapping[header] !== "");

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));

    const res = await fetch("/api/map-schema/", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    alert(`✅ Schema saved! Download your template: ${data.download_url}`);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          📄 Upload & Map CSV Columns
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a CSV file and match your data columns to system fields.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Select CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-[#161B22]
            file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold 
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
            dark:file:bg-[#21262d] dark:file:text-blue-300 hover:dark:file:bg-[#30363d]"
        />
      </div>

      {csvHeaders.length > 0 && (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-200 tracking-wide select-none">
                Uploaded File Columns
              </span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline align-middle">
                <path
                  d="M7 5l5 5-5 5"
                  stroke={allMapped ? "#22c55e" : "#E11D48"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className={`text-lg font-semibold tracking-wide select-none ${allMapped ? "text-green-600" : "text-rose-600"}`}>
              Map To Our System Columns
            </span>
          </div>
          <div className="border-b border-gray-300 dark:border-gray-700 mb-2" />

          {/* Mapping Rows */}
          <div className="space-y-3">
            {csvHeaders.map((col) => {
              const isMapped = !!mapping[col];
              return (
                <div
                  key={col}
                  className="flex flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-2"
                >
                  {/* Uploaded file column name */}
                  <span className="text-gray-700 dark:text-gray-200 font-medium w-2/5 text-left tracking-wide">{col}</span>
                  {/* Row Arrow: green when mapped, red when unmapped */}
                  <span className="flex-1 text-center">
                    <svg width="26" height="18" viewBox="0 0 26 18" fill="none" className="inline align-middle">
                      <path
                        d="M7 9h12m0 0l-4-4m4 4l-4 4"
                        stroke={isMapped ? "#22c55e" : "#E11D48"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {/* System field select */}
                  <select
                    value={mapping[col] || ""}
                    onChange={(e) => handleMappingChange(col, e.target.value)}
                    className={
                      "w-2/5 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 " +
                      "focus:ring-blue-500 bg-white dark:bg-[#161B22] text-gray-800 dark:text-gray-100"
                    }
                  >
                    <option value="">-- Select system field --</option>
                    {Object.entries(groupedFields).map(([group, fields]) => (
                      <optgroup key={group} label={group}>
                        {fields.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            🚀 Submit Mapping
          </button>
        </div>
      )}
    </div>
  );
}