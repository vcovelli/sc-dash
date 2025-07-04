// MultiReferenceTag.tsx
import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";

interface MultiReferenceTagProps {
  value: string | null | undefined;
  className?: string;
  fontSize?: number;
  rowHeight?: number;
  truncate?: boolean;
}

export default function MultiReferenceTag({
  value,
  className = "",
  fontSize = 14,
  rowHeight = 36,
  truncate = false,
}: MultiReferenceTagProps) {
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
