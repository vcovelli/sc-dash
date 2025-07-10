// ConfirmDeleteDialog.tsx

interface OrgUser {
  id: string;
  email: string;
}

interface ConfirmDeleteDialogProps {
  user: OrgUser;
  onClose: () => void;
  onDeleted: () => void;
}

export default function ConfirmDeleteDialog({
  user,
  onClose,
  onDeleted,
}: ConfirmDeleteDialogProps) {
  const handleDelete = async () => {
    const token = localStorage.getItem("access_token");
    await fetch(`/api/accounts/org/users/${user.id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8">
        <h2 className="font-bold text-lg mb-4">Remove user?</h2>
        <p>Are you sure you want to remove <b>{user.email}</b> from your organization?</p>
        <div className="mt-6 flex gap-3">
          <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">Yes, remove</button>
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
        </div>
      </div>
    </div>
  );
}
