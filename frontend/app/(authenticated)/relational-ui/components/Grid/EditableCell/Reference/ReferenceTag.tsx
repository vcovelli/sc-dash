import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";

interface ReferenceTagProps {
  value: string | null | undefined;
  className?: string;
  fontSize?: number;
  rowHeight?: number;
  truncate?: boolean;
}

export default function ReferenceTag({
  value,
  className = "",
  fontSize = 14,     // Default font size
  rowHeight = 36,    // Default row height
  truncate = false,  // Default to no truncation
}: ReferenceTagProps) {
  return (
    <ChoiceTag
      value={value}
      className={className}
      fontSize={fontSize}
      rowHeight={rowHeight}
      truncate={truncate}
    />
  );
}
