export default function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen overflow-hidden relative bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}
