import React from "react";
import OutsideClickModal from "@/components/OutsideClickModal";
import {
  FaUserEdit,
  FaEnvelope,
  FaKey,
  FaTrashAlt,
} from "react-icons/fa";
import ModalItem from "./Modal-Item";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <OutsideClickModal onClose={onClose}>
      <div className="relative bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-900/30 rounded-2xl shadow-2xl px-8 py-8 w-full max-w-md text-gray-800 dark:text-gray-100 ring-1 ring-black/10 dark:ring-white/10"
        style={{ fontSize: "var(--body)" }}>
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"
          style={{ fontSize: "var(--h2)" }}>
          <span className="text-blue-600 dark:text-blue-400">⚙️</span> Settings
        </h3>
        <div className="space-y-3">
          <ModalItem icon={<FaUserEdit />} label="Change Username" />
          <ModalItem icon={<FaEnvelope />} label="Change Email" />
          <ModalItem icon={<FaKey />} label="Reset Password" />
        </div>
        <hr className="my-6 border-gray-200 dark:border-gray-700" />
        <button className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900 text-red-600 font-semibold"
          style={{ fontSize: "var(--body)" }}>
          <FaTrashAlt /> Delete Account
        </button>
      </div>
    </OutsideClickModal>
  );
}
