export default function ChoiceTag({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  // console.log("🏷️ ChoiceTag rendering:", value);
  const fallback = "bg-gray-100 text-gray-800 border-gray-300";

  if (!value || typeof value !== "string" || value.trim() === "") {
    return (
      <span
        className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${fallback} ${className}`}
      >
        –
      </span>
    );
  }

  const knownColors: Record<string, string> = {
    Delivered: "bg-green-100 text-green-800 border-green-300",
    "In Transit": "bg-yellow-100 text-yellow-800 border-yellow-300",
    Pending: "bg-red-100 text-red-800 border-red-300",
  };

  const getColorClass = (val: string): string => {
    if (knownColors[val]) return knownColors[val];
    const hash = typeof val === "string"
      ? [...val].reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : 0;
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-300",
      "bg-green-100 text-green-800 border-green-300",
      "bg-purple-100 text-purple-800 border-purple-300",
      "bg-pink-100 text-pink-800 border-pink-300",
    ];
    return colors[hash % colors.length];
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getColorClass(
        value
      )} ${className}`}
    >
      {value}
    </span>
  );
}
