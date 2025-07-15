"use client";
import { createContext, useContext, useState } from "react";

type NavContextType = {
  showNav: boolean;
  setShowNav: (v: boolean) => void;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  showDesktopNav: boolean;
  setShowDesktopNav: (v: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
};

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [showNav, setShowNav] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showDesktopNav, setShowDesktopNav] = useState(true); // default: visible
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <NavContext.Provider 
      value={{
        showNav,
        setShowNav,
        fullscreen,
        setFullscreen,
        showDesktopNav,
        setShowDesktopNav,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
      >
      {children}
    </NavContext.Provider>
  );
}

export function useNavContext() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavContext must be used within a NavbarProvider");
  return ctx;
}