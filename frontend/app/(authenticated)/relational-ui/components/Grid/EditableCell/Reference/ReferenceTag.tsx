import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";

export default function ReferenceTag({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  return <ChoiceTag value={value} className={className} />;
}
