"use client";

import { useState } from "react";
import Papa from "papaparse";

const groupedFields: Record<string, { value: string; label: string; description?: string }[]> = {
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
    { value: "client_name", label: "Client Name" },
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

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("file", file!);
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
        <h2 className="text-3xl font-bold text-gray-900">📄 Upload & Map CSV Columns</h2>
        <p className="text-gray-600">Upload a CSV file and match your data columns to system fields.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {csvHeaders.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">🔧 Map Columns</h3>
          <div className="space-y-4">
            {csvHeaders.map((col) => (
              <div key={col} className="flex flex-col md:flex-row md:items-center md:gap-6 gap-2 border-b pb-3">
                <span className="text-gray-700 font-medium w-full md:w-1/2">{col}</span>
                <select
                  value={mapping[col] || ""}
                  onChange={(e) => handleMappingChange(col, e.target.value)}
                  className="w-full md:w-1/2 border border-gray-300 rounded px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            ))}
          </div>

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