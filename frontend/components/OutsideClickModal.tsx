"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
};

export default function OutsideClickModal({ onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white/90 dark:bg-[#161b22] border border-white/10 dark:border-white/10 shadow-2xl rounded-2xl p-8 w-full max-w-md ring-1 ring-blue-500/10 dark:ring-white/10 transition-all"
      >
        {children}
      </div>
    </div>
  );
}
