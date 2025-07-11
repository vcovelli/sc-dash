// InviteUserModal.tsx
import { useState } from "react";
import { inviteUser } from "@/lib/invitesAPI";
import { FaTimes, FaUserPlus, FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";
import OutsideClickModal from "@/components/OutsideClickModal";

interface InviteUserDialogProps {
  onInvited: () => void;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: "read_only", label: "Read Only", icon: "👁️", description: "Can view data but cannot make changes" },
  { value: "client", label: "Client/Partner", icon: "🤝", description: "External partner with limited access" },
  { value: "employee", label: "Employee", icon: "👤", description: "Basic employee with standard access" },
  { value: "local_manager", label: "Site Manager", icon: "📍", description: "Manages local site operations" },
  { value: "regional_manager", label: "Regional Manager", icon: "🗺️", description: "Manages multiple sites in a region" },
  { value: "national_manager", label: "National Manager", icon: "🌍", description: "Oversees national operations" },
  { value: "ceo", label: "CEO/Global Access", icon: "🌟", description: "Full system access and control" },
  { value: "owner", label: "Organization Owner", icon: "🏢", description: "Organization owner with admin privileges" },
];

export default function InviteUserDialog({ onInvited, onClose }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; role?: string } = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Role validation
    if (!role) {
      newErrors.role = "Please select a role";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await inviteUser(email.trim(), role);
      toast.success(`Invitation sent to ${email}!`);
      onInvited();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to send invite";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleInfo = ROLE_OPTIONS.find(r => r.value === role);

  return (
    <OutsideClickModal onClose={onClose}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 w-full max-w-md mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          aria-label="Close dialog"
        >
          <FaTimes size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <FaUserPlus className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Invite Team Member
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Send an invitation to join your organization
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="colleague@company.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-400 transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (errors.role) setErrors(prev => ({ ...prev, role: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 transition ${
                errors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.icon} {roleOption.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.role}
              </p>
            )}
            
            {/* Role Description */}
            {selectedRoleInfo && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">{selectedRoleInfo.icon} {selectedRoleInfo.label}:</span>{" "}
                  {selectedRoleInfo.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <FaUserPlus size={16} />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </div>
    </OutsideClickModal>
  );
}
