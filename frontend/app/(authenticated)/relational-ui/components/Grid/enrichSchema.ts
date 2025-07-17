import { CustomColumnDef, Option } from "@/app/(authenticated)/relational-ui/components/Sheet";

export async function fetchReferenceData(table: string): Promise<Option[]> {
  try {
    const res = await fetch(`/api/dropdowns/${table}/`);
    if (!res.ok) return [];
    return await res.json(); // expects [{ id, name }]
  } catch (err) {
    console.error("Error fetching reference data:", err);
    return [];
  }
}

export async function enrichSchemaWithReferenceData(
  columns: CustomColumnDef[]
): Promise<CustomColumnDef[]> {
  const enriched = await Promise.all(
    columns.map(async (col) => {
      if (col.type === "reference" && col.referenceTable) {
        const referenceData = await fetchReferenceData(col.referenceTable);
        return { ...col, referenceData };
      }
      return col;
    })
  );
  return enriched;
}